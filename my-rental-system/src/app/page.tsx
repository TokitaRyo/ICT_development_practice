'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import ItemTable from '@/components/ItemTable';
import ItemModal from '@/components/ItemModal';
import FilterModal from '@/components/FilterModal';
import LayoutSettingsModal from '@/components/LayoutSettingsModal';

export interface Item {
  id: string;
  item_number: string;
  maker: string;
  name: string;
  serial_number: string;
  price: number;
}

export interface UserSettings {
  theme: 'indigo' | 'dark' | 'blue' | 'green';
  view_mode: 'table' | 'card';
  density: 'compact' | 'standard' | 'relaxed';
  visible_columns: string[];
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMaker, setFilterMaker] = useState('');
  
  // モーダル制御状態
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // カスタマイズ設定
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'indigo',
    view_mode: 'table',
    density: 'standard',
    visible_columns: ['item_number', 'maker', 'name', 'serial_number', 'price', 'stock_count'],
  });

  // 1. 初期セッションチェック
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchItems();
    });
  }, []);

  // 2. データ取得処理
  const fetchItems = async () => {
    const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (!error && data) setItems(data);
  };

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('ログインエラー: ' + error.message);
    else {
      setSession(data.session);
      fetchItems();
    }
  };

  // 登録・更新処理
  const handleSaveItem = async (formData: Partial<Item>) => {
    if (editingItem) {
      await supabase.from('items').update(formData).eq('id', editingItem.id);
    } else {
      await supabase.from('items').insert([formData]);
    }
    fetchItems();
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  // ① ログイン画面の表示 (未認証時)
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-xl font-bold mb-6 text-center">物貸し借りシステム ログイン</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">ID (Email)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Ps (Password)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">ログイン</button>
        </form>
      </div>
    );
  }

  // フィルタリング処理
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.includes(searchQuery) || item.maker.includes(searchQuery);
    const matchesFilter = filterMaker ? item.maker === filterMaker : true;
    return matchesSearch && matchesFilter;
  });

  // ② メイン画面表示
  return (
    <div className={`min-h-screen theme-${settings.theme} bg-gray-50`}>
      <Header onOpenSettings={() => setIsSettingsOpen(true)} onLogout={() => supabase.auth.signOut().then(() => setSession(null))} />

      <main className="max-w-7xl mx-auto p-6">
        {/* 操作エリア (検索 / しぼり込み / 新規登録) */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6 bg-white p-4 rounded shadow-sm">
          <input
            type="text"
            placeholder="けんさく"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <div className="flex gap-2">
            <button onClick={() => setIsFilterModalOpen(true)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              しぼり込み
            </button>
            <button onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              新規登録
            </button>
          </div>
        </div>

        {/* ②-の拡大・一覧テーブル表示 */}
        <ItemTable
          items={filteredItems}
          settings={settings}
          onEdit={(item) => { setEditingItem(item); setIsItemModalOpen(true); }}
        />
      </main>

      {/* ③-1 / ③-2 登録・編集モーダル */}
      {isItemModalOpen && (
        <ItemModal
          item={editingItem}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
        />
      )}

      {/* ④ しぼり込みモーダル */}
      {isFilterModalOpen && (
        <FilterModal
          currentMaker={filterMaker}
          onApply={(maker) => { setFilterMaker(maker); setIsFilterModalOpen(false); }}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}

      {/* レイアウト設定モーダル */}
      {isSettingsOpen && (
        <LayoutSettingsModal
          settings={settings}
          onSave={(newSettings) => { setSettings(newSettings); setIsSettingsOpen(false); }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}