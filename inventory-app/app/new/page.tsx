'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewItem() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('items').insert([{ name, quantity }]);
    if (!error) {
      router.push('/');
    } else {
      alert('登録に失敗しました');
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">在庫新規登録</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block mb-1 font-medium font-sans">数量</label>
          <input
            type="number"
            required
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border p-2 rounded border-gray-300"
          />
        </div>
        <div className="flex gap-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            保存
          </button>
          <Link href="/" className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
            キャンセル
          </Link>
        </div>
      </form>
    </main>
  );
}