'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
      if (data && !error) {
        setName(data.name);
        setQuantity(data.quantity);
      }
    };
    fetchItem();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('items').update({ name, quantity }).eq('id', id);
    if (!error) {
      router.push('/');
    } else {
      alert('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当にこの在庫データを削除しますか？')) return;
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) {
      router.push('/');
    } else {
      alert('削除に失敗しました');
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">在庫編集・削除</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">商品名</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded border-gray-300"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">数量</label>
          <input
            type="number"
            required
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border p-2 rounded border-gray-300"
          />
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              更新
            </button>
            <Link href="/" className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
              戻る
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
}