'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import AuthForm from '@/components/AuthForm';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import Header from '@/components/Header';
import ItemTable from '@/components/ItemTable';
import ItemModal from '@/components/ItemModal';
import FilterModal from '@/components/FilterModal';
import LayoutSettingsModal from '@/components/LayoutSettingsModal';
import {
  DEFAULT_FILTER,
  DEFAULT_SETTINGS,
  type Item,
  type ItemFilter,
  type ItemInput,
  type UserSettings,
} from '@/lib/types';

export default function Home() {
  // 認証
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // データ
  const [items, setItems] = useState<Item[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ItemFilter>(DEFAULT_FILTER);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // モーダル
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const userId = session?.user.id;

  // 1. ログイン状態の監視
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setAuthReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 2. 物品一覧の取得
  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (error) {
      setErrorMessage('物品の取得に失敗しました: ' + error.message);
      return;
    }
    setErrorMessage('');
    setItems((data ?? []) as Item[]);
  }, []);

  // 3. ログイン後に一覧とレイアウト設定を読み込む
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [itemsRes, settingsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase
          .from('user_settings')
          .select('theme, view_mode, density, visible_columns')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (itemsRes.error) {
        setErrorMessage('物品の取得に失敗しました: ' + itemsRes.error.message);
      } else {
        setErrorMessage('');
        setItems((itemsRes.data ?? []) as Item[]);
      }
      const saved = settingsRes.data;
      if (saved) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...saved,
          visible_columns: Array.isArray(saved.visible_columns)
            ? saved.visible_columns
            : DEFAULT_SETTINGS.visible_columns,
        } as UserSettings);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const makers = useMemo(
    () => Array.from(new Set(items.map((i) => i.maker).filter(Boolean))).sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const text = [item.name, item.maker, item.item_number, item.serial_number ?? ''].join(' ').toLowerCase();
      const stock = item.stock_count ?? 0;
      const matchesSearch = !q || text.includes(q);
      const matchesMaker = !filter.maker || item.maker === filter.maker;
      const matchesStock = filter.stock === 'all' || (filter.stock === 'in' ? stock > 0 : stock === 0);
      return matchesSearch && matchesMaker && matchesStock;
    });
  }, [items, searchQuery, filter]);

  const isFiltered = filter.maker !== '' || filter.stock !== 'all';

  // 選択（表示中の物品だけを対象にする。しぼり込みで隠れた物品は削除されない）
  const selectedItems = useMemo(() => filteredItems.filter((i) => selectedIds.has(i.id)), [filteredItems, selectedIds]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = (checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((i) => (checked ? next.add(i.id) : next.delete(i.id)));
      return next;
    });

  // 一括削除（成功時 null / 失敗時メッセージ）
  const handleDeleteSelected = async (): Promise<string | null> => {
    const ids = selectedItems.map((i) => i.id);
    const { data, error } = await supabase.from('items').delete().in('id', ids).select('id');
    if (error) return '削除に失敗しました: ' + error.message;
    const deleted = data?.length ?? 0;
    await fetchItems();
    if (deleted !== ids.length) return `一部の物品を削除できませんでした（${ids.length}件中${deleted}件を削除）`;
    setSelectedIds(new Set());
    setIsDeleteModalOpen(false);
    return null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedIds(new Set());
    setItems([]);
    setSettings(DEFAULT_SETTINGS);
    setFilter(DEFAULT_FILTER);
    setSearchQuery('');
  };

  // 登録・変更（成功時 null / 失敗時メッセージ）
  const handleSaveItem = async (formData: ItemInput): Promise<string | null> => {
    const { error } = editingItem
      ? await supabase.from('items').update(formData).eq('id', editingItem.id)
      : await supabase.from('items').insert([formData]);
    if (error) return '保存に失敗しました: ' + error.message;
    await fetchItems();
    setIsItemModalOpen(false);
    setEditingItem(null);
    return null;
  };

  // レイアウト設定の保存（user_settings に upsert）
  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
    if (!userId) return;
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...newSettings, updated_at: new Date().toISOString() });
    if (error) setErrorMessage('設定の保存に失敗しました: ' + error.message);
  };

  if (!authReady) return <p className="p-6 muted">読み込み中...</p>;

  // ① ログイン / 新規登録画面
  if (!session) return <AuthForm />;

  // ② 一覧画面
  return (
    <div className={`app theme-${settings.theme}`}>
      <Header email={session.user.email} onOpenSettings={() => setIsSettingsOpen(true)} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto p-6">
        {errorMessage && <p className="error-text text-sm mb-4">{errorMessage}</p>}

        <div className="surface flex flex-wrap gap-4 justify-between items-center mb-6 p-4">
          <input
            type="text"
            placeholder="けんさく（商品名・メーカー・番号・製造番号）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field sm:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="muted text-sm">{filteredItems.length} / {items.length} 件</span>
            {selectedItems.length > 0 && (
              <>
                <button onClick={() => setSelectedIds(new Set())} className="link-button text-sm">
                  選択解除
                </button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="btn btn-danger">
                  選択した{selectedItems.length}件を削除
                </button>
              </>
            )}
            <button onClick={() => setIsFilterModalOpen(true)} className="btn btn-secondary">
              しぼり込み{isFiltered && '（適用中）'}
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="btn btn-primary"
            >
              新規登録
            </button>
          </div>
        </div>

        <ItemTable
          items={filteredItems}
          settings={settings}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={(item) => {
            setEditingItem(item);
            setIsItemModalOpen(true);
          }}
        />
      </main>

      {/* ③-1 新規登録 / ③-2 登録情報の変更 */}
      {isItemModalOpen && (
        <ItemModal
          item={editingItem}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {/* 選択した物品の一括削除 */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          items={selectedItems}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSelected}
        />
      )}

      {/* ④ しぼり込み */}
      {isFilterModalOpen && (
        <FilterModal
          makers={makers}
          current={filter}
          onApply={(f) => {
            setFilter(f);
            setIsFilterModalOpen(false);
          }}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}

      {/* レイアウト設定 */}
      {isSettingsOpen && (
        <LayoutSettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
