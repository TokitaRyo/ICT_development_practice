'use client';

import { useState } from 'react';
import type { Item } from '@/lib/types';

interface DeleteConfirmModalProps {
  items: Item[];
  onClose: () => void;
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onConfirm: () => Promise<string | null>;
}

const PREVIEW_COUNT = 5;

export default function DeleteConfirmModal({ items, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');
    const message = await onConfirm();
    setDeleting(false);
    if (message) setError(message);
  };

  return (
    <div className="overlay">
      <div className="surface p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-3">{items.length}件の物品を削除しますか？</h2>
        <ul className="text-sm mb-3 list-disc pl-5 space-y-1">
          {items.slice(0, PREVIEW_COUNT).map((item) => (
            <li key={item.id}>
              {item.item_number} {item.name}
            </li>
          ))}
          {items.length > PREVIEW_COUNT && <li className="muted list-none -ml-5">ほか {items.length - PREVIEW_COUNT} 件</li>}
        </ul>
        <p className="error-text text-sm mb-4">この操作は取り消せません。</p>
        {error && <p className="error-text text-sm mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={deleting} className="btn btn-secondary">
            キャンセル
          </button>
          <button onClick={handleConfirm} disabled={deleting} className="btn btn-danger">
            {deleting ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}
