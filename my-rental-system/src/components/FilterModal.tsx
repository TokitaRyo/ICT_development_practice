'use client';

import { useState } from 'react';
import { DEFAULT_FILTER, type ItemFilter, type StockFilter } from '@/lib/types';

interface FilterModalProps {
  makers: string[];
  current: ItemFilter;
  onApply: (filter: ItemFilter) => void;
  onClose: () => void;
}

const STOCK_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'in', label: '在庫あり' },
  { value: 'out', label: '在庫なし' },
];

export default function FilterModal({ makers, current, onApply, onClose }: FilterModalProps) {
  const [draft, setDraft] = useState<ItemFilter>(current);

  return (
    <div className="overlay">
      <div className="surface p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-bold mb-4">しぼり込み</h2>

        <label className="block text-sm font-medium mb-1">メーカー</label>
        <select
          value={draft.maker}
          onChange={(e) => setDraft({ ...draft, maker: e.target.value })}
          className="field mb-4"
        >
          <option value="">すべて</option>
          {makers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <fieldset className="mb-6">
          <legend className="text-sm font-medium mb-1">在庫状態</legend>
          <div className="flex gap-4">
            {STOCK_OPTIONS.map((o) => (
              <label key={o.value} className="text-sm">
                <input
                  type="radio"
                  name="stock"
                  checked={draft.stock === o.value}
                  onChange={() => setDraft({ ...draft, stock: o.value })}
                />{' '}
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-between">
          <button onClick={() => onApply(DEFAULT_FILTER)} className="link-button text-sm">
            条件をクリア
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary">
              キャンセル
            </button>
            <button onClick={() => onApply(draft)} className="btn btn-primary">
              適用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
