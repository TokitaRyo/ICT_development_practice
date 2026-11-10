'use client';

import { useState } from 'react';
import type { Item, ItemInput } from '@/lib/types';

interface ItemModalProps {
  item: Item | null;
  onClose: () => void;
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onSave: (data: ItemInput) => Promise<string | null>;
}

export default function ItemModal({ item, onClose, onSave }: ItemModalProps) {
  const [form, setForm] = useState({
    item_number: item?.item_number ?? '',
    maker: item?.maker ?? '',
    name: item?.name ?? '',
    serial_number: item?.serial_number ?? '',
    price: String(item?.price ?? 0),
    stock_count: String(item?.stock_count ?? 1),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const message = await onSave({
      item_number: form.item_number.trim(),
      maker: form.maker.trim(),
      name: form.name.trim(),
      serial_number: form.serial_number.trim() || null,
      price: Number(form.price) || 0,
      stock_count: Math.max(0, Math.floor(Number(form.stock_count) || 0)),
    });
    setSaving(false);
    if (message) setError(message);
  };

  const field = (label: string, key: keyof typeof form, opts?: { type?: string; required?: boolean }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={opts?.type ?? 'text'}
        min={opts?.type === 'number' ? 0 : undefined}
        value={form[key]}
        onChange={set(key)}
        className="field"
        required={opts?.required ?? true}
      />
    </div>
  );

  return (
    <div className="overlay">
      <form onSubmit={handleSubmit} className="surface p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">{item ? '登録情報の変更' : '新規登録'}</h2>
        {field('番号', 'item_number')}
        {field('メーカー', 'maker')}
        {field('商品名', 'name')}
        {field('製造番号', 'serial_number', { required: false })}
        {field('単価', 'price', { type: 'number' })}
        {field('在庫数', 'stock_count', { type: 'number' })}
        {error && <p className="error-text text-sm mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            キャンセル
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? '保存中...' : '確定'}
          </button>
        </div>
      </form>
    </div>
  );
}
