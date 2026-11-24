'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useApp } from '@/components/AppContext';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import FilterModal from '@/components/FilterModal';
import ItemTable from '@/components/ItemTable';
import { DEFAULT_FILTER, type Item, type ItemFilter } from '@/lib/types';

/** ① 在庫一覧・検索画面 */
export default function ItemListPage() {
  const { settings } = useApp();

  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ItemFilter>(DEFAULT_FILTER);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  // 物品一覧の取得（画面表示時と、削除後）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('items').select('*').order('item_number', { ascending: true });
      if (cancelled) return;
      if (error) {
        setErrorMessage('物品の取得に失敗しました: ' + error.message);
      } else {
        setErrorMessage('');
        setItems((data ?? []) as Item[]);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

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

  const isFiltered = filter.maker !== '';

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
    setReloadKey((k) => k + 1);
    if (deleted !== ids.length) return `一部の物品を削除できませんでした（${ids.length}件中${deleted}件を削除）`;
    setSelectedIds(new Set());
    setIsDeleteModalOpen(false);
    return null;
  };

  return (
    <div>
      {errorMessage && <p className="error-text text-sm mb-4">{errorMessage}</p>}

      <div className="surface flex flex-wrap gap-4 justify-between items-center mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="キーワード（製品名・メーカー名）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field sm:w-72"
          />
          <label className="text-sm">
            <input
              type="checkbox"
              checked={filter.stock === 'out'}
              onChange={(e) => setFilter({ ...filter, stock: e.target.checked ? 'out' : 'all' })}
            />{' '}
            在庫切れのみ
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="muted text-sm">
            {filteredItems.length} / {items.length} 件
          </span>
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
            メーカーでしぼり込み{isFiltered && '（適用中）'}
          </button>
          <Link href="/items/new" className="btn btn-primary">
            新規登録
          </Link>
        </div>
      </div>

      {loaded ? (
        <ItemTable
          items={filteredItems}
          settings={settings}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      ) : (
        <p className="muted">読み込み中...</p>
      )}

      {/* 選択した物品の一括削除 */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          items={selectedItems}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSelected}
        />
      )}

      {/* メーカーでしぼり込み */}
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
    </div>
  );
}
