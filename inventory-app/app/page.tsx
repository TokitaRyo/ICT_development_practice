'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Item = {
  id: string;
  name: string;
  quantity: number;
  created_at: string;
};

export default function InventoryList() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    let query = supabase.from('items').select('*').order('created_at', { ascending: false });
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    const { data, error } = await query;
    if (!error && data) setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">在庫一覧</h1>
        <Link href="/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + 新規登録
        </Link>
      </div>

      <input
        type="text"
        placeholder="商品名で検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border p-2 mb-6 rounded border-gray-300"
      />

      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 p-2 text-left">商品名</th>
            <th className="border border-gray-200 p-2 text-right">数量</th>
            <th className="border border-gray-200 p-2 text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="border border-gray-200 p-2">{item.name}</td>
              <td className="border border-gray-200 p-2 text-right">{item.quantity}</td>
              <td className="border border-gray-200 p-2 text-center">
                <Link href={`/edit/${item.id}`} className="text-blue-600 hover:underline">
                  編集 / 削除
                </Link>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center p-4 text-gray-500 border border-gray-200">
                該当するデータがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}