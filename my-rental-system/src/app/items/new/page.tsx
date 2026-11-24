'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ItemForm from '@/components/ItemForm';
import type { ItemInput } from '@/lib/types';

/** ② 在庫新規登録画面（管理番号は DB 側で自動採番） */
export default function NewItemPage() {
  const router = useRouter();

  const handleCreate = async (input: ItemInput): Promise<string | null> => {
    const { error } = await supabase.from('items').insert([input]);
    if (error) return '登録に失敗しました: ' + error.message;
    router.push('/');
    return null;
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">在庫新規登録</h2>
      <ItemForm submitLabel="登録する" onSubmit={handleCreate} />
    </div>
  );
}
