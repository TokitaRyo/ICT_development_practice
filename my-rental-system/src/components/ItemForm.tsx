'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Item, ItemInput } from '@/lib/types';
import { validateItemForm, type ItemFormErrors, type ItemFormValues } from '@/lib/validation';

interface ItemFormProps {
  /** 指定すると「詳細・編集」、省略すると「新規登録」 */
  item?: Item;
  submitLabel: string;
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onSubmit: (input: ItemInput) => Promise<string | null>;
  /** 削除ボタンなど、フォーム下部に追加する操作 */
  extraActions?: React.ReactNode;
}

export default function ItemForm({ item, submitLabel, onSubmit, extraActions }: ItemFormProps) {
  const [values, setValues] = useState<ItemFormValues>({
    maker: item?.maker ?? '',
    name: item?.name ?? '',
    serial_number: item?.serial_number ?? '',
    price: item?.price != null ? String(item.price) : '',
    stock_count: item?.stock_count != null ? String(item.stock_count) : '',
  });
  const [errors, setErrors] = useState<ItemFormErrors>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ItemFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setNotice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setNotice('');
    const result = validateItemForm(values);
    setErrors(result.errors);
    if (!result.input) return;

    setSaving(true);
    const message = await onSubmit(result.input);
    setSaving(false);
    if (message) setFormError(message);
    else if (item) setNotice('保存しました');
  };

  const field = (label: string, key: keyof ItemFormValues, opts?: { required?: boolean; numeric?: boolean }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        {label}
        {opts?.required && <span className="error-text"> *</span>}
      </label>
      <input
        type="text"
        inputMode={opts?.numeric ? 'numeric' : undefined}
        value={values[key]}
        onChange={set(key)}
        className="field"
      />
      {errors[key] && <p className="error-text text-sm mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="surface p-6 max-w-xl">
      {item && (
        <dl className="text-sm mb-6 space-y-1">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 muted">管理番号</dt>
            <dd className="font-medium">{item.item_number}</dd>
          </div>
          {item.created_at && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 muted">登録日時</dt>
              <dd>{new Date(item.created_at).toLocaleString('ja-JP')}</dd>
            </div>
          )}
        </dl>
      )}
      {!item && <p className="muted text-sm mb-4">管理番号は登録時に自動で付与されます。</p>}

      {field('メーカー名', 'maker')}
      {field('製品名', 'name', { required: true })}
      {field('製品番号', 'serial_number')}
      {field('単価（円）', 'price', { required: true, numeric: true })}
      {field('在庫数', 'stock_count', { required: true, numeric: true })}

      {formError && <p className="error-text text-sm mb-3">{formError}</p>}
      {notice && <p className="text-sm mb-3">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/" className="btn btn-secondary">
          一覧へ戻る
        </Link>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? '保存中...' : submitLabel}
        </button>
        {extraActions && <div className="ml-auto">{extraActions}</div>}
      </div>
    </form>
  );
}
