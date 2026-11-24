'use client';

import { COLUMN_LABELS, type Item, type UserSettings } from '@/lib/types';

interface ItemTableProps {
  items: Item[];
  settings: UserSettings;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onEdit: (item: Item) => void;
}

const PADDING = {
  compact: 'px-3 py-1',
  standard: 'px-4 py-2',
  relaxed: 'px-4 py-4',
} as const;

function renderValue(item: Item, column: string) {
  switch (column) {
    case 'price':
      return item.price === null ? '-' : `¥${Number(item.price).toLocaleString()}`;
    case 'stock_count': {
      const stock = item.stock_count ?? 0;
      return stock > 0 ? stock : <span className="error-text font-medium">在庫なし</span>;
    }
    case 'serial_number':
      return item.serial_number || '-';
    default:
      return String((item as unknown as Record<string, unknown>)[column] ?? '-');
  }
}

export default function ItemTable({
  items,
  settings,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
}: ItemTableProps) {
  const columns = Object.keys(COLUMN_LABELS).filter((c) => settings.visible_columns.includes(c));
  const pad = PADDING[settings.density];

  const selectedCount = items.filter((i) => selectedIds.has(i.id)).length;
  const allSelected = items.length > 0 && selectedCount === items.length;
  const someSelected = selectedCount > 0 && !allSelected;

  if (items.length === 0) {
    return <p className="surface p-6 text-center muted">該当する物品がありません</p>;
  }

  const selectAllBox = (
    <input
      type="checkbox"
      aria-label="表示中の物品をすべて選択"
      checked={allSelected}
      ref={(el) => {
        if (el) el.indeterminate = someSelected;
      }}
      onChange={(e) => onToggleSelectAll(e.target.checked)}
    />
  );

  if (settings.view_mode === 'card') {
    return (
      <div>
        <label className="flex items-center gap-2 text-sm muted mb-3">
          {selectAllBox} すべて選択
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const selected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`surface relative ${settings.density === 'compact' ? 'p-3' : 'p-4'}`}
                style={selected ? { borderColor: 'var(--accent)', background: 'var(--subtle)' } : undefined}
              >
                <input
                  type="checkbox"
                  aria-label={`${item.name} を選択`}
                  className="absolute top-3 right-3"
                  checked={selected}
                  onChange={() => onToggleSelect(item.id)}
                />
                <dl className={settings.density === 'relaxed' ? 'space-y-2' : 'space-y-1'}>
                  {columns.map((c) => (
                    <div key={c} className="flex gap-2 text-sm">
                      <dt className="w-24 shrink-0 muted">{COLUMN_LABELS[c]}</dt>
                      <dd>{renderValue(item, c)}</dd>
                    </div>
                  ))}
                </dl>
                <button onClick={() => onEdit(item)} className="link-button mt-3 text-sm">
                  変更
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="surface overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="table-head">
          <tr>
            <th className={`${pad} w-8`}>{selectAllBox}</th>
            {columns.map((c) => (
              <th key={c} className={`${pad} font-medium`}>
                {COLUMN_LABELS[c]}
              </th>
            ))}
            <th className={pad} />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const selected = selectedIds.has(item.id);
            return (
              <tr key={item.id} className="table-row" style={selected ? { background: 'var(--subtle)' } : undefined}>
                <td className={pad}>
                  <input
                    type="checkbox"
                    aria-label={`${item.name} を選択`}
                    checked={selected}
                    onChange={() => onToggleSelect(item.id)}
                  />
                </td>
                {columns.map((c) => (
                  <td key={c} className={pad}>
                    {renderValue(item, c)}
                  </td>
                ))}
                <td className={`${pad} text-right`}>
                  <button onClick={() => onEdit(item)} className="link-button">
                    変更
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
