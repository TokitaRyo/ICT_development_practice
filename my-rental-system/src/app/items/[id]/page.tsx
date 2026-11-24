'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ItemForm from '@/components/ItemForm';
import type { Item, ItemInput } from '@/lib/types';

type Status = 'loading' | 'ready' | 'notfound' | 'error';

/** ③ 在庫詳細・編集・削除画面 */
export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('items').select('*').eq('id', id).maybeSingle();
      if (cancelled) return;
      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
      } else if (!data) {
        setStatus('notfound');
      } else {
        setItem(data as Item);
        setStatus('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 更新（成功時 null / 失敗時メッセージ）
  const handleUpdate = async (input: ItemInput): Promise<string | null> => {
    const { data, error } = await supabase.from('items').update(input).eq('id', id).select('*').maybeSingle();
    if (error) return '更新に失敗しました: ' + error.message;
    if (!data) return '更新できませんでした（すでに削除されている可能性があります）';
    setItem(data as Item);
    return null;
  };

  // 削除（確認ダイアログ → 物理削除）
  const handleDelete = async (): Promise<string | null> => {
    const { data, error } = await supabase.from('items').delete().eq('id', id).select('id');
    if (error) return '削除に失敗しました: ' + error.message;
    if (!data || data.length === 0) return '削除できませんでした（すでに削除されている可能性があります）';
    router.push('/');
    return null;
  };

  if (status === 'loading') return <p className="muted">読み込み中...</p>;
  if (status === 'error') return <p className="error-text">取得に失敗しました: {errorMessage}</p>;
  if (status === 'notfound' || !item) {
    return (
      <div>
        <p className="mb-4">該当する物品が見つかりません。</p>
        <Link href="/" className="btn btn-secondary">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">在庫詳細・編集</h2>
      <ItemForm
        key={item.id}
        item={item}
        submitLabel="保存"
        onSubmit={handleUpdate}
        extraActions={
          <button type="button" onClick={() => setIsDeleteOpen(true)} className="btn btn-danger">
            削除
          </button>
        }
      />
      {isDeleteOpen && (
        <DeleteConfirmModal items={[item]} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} />
      )}
    </div>
  );
}
