'use client';

import { useState } from 'react';
import {
  COLUMN_LABELS,
  THEME_LABELS,
  type Density,
  type Theme,
  type UserSettings,
  type ViewMode,
} from '@/lib/types';

interface LayoutSettingsModalProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'table', label: 'テーブル' },
  { value: 'card', label: 'カード' },
];

const DENSITIES: { value: Density; label: string }[] = [
  { value: 'compact', label: 'コンパクト' },
  { value: 'standard', label: '標準' },
  { value: 'relaxed', label: 'ゆったり' },
];

export default function LayoutSettingsModal({ settings, onSave, onClose }: LayoutSettingsModalProps) {
  const [draft, setDraft] = useState<UserSettings>(settings);

  const toggleColumn = (col: string) =>
    setDraft((d) => ({
      ...d,
      visible_columns: d.visible_columns.includes(col)
        ? d.visible_columns.filter((c) => c !== col)
        : [...d.visible_columns, col],
    }));

  const radio = <T extends string>(
    name: string,
    options: { value: T; label: string }[],
    selected: T,
    onChange: (v: T) => void,
  ) => (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {options.map((o) => (
        <label key={o.value} className="text-sm">
          <input type="radio" name={name} checked={selected === o.value} onChange={() => onChange(o.value)} />{' '}
          {o.label}
        </label>
      ))}
    </div>
  );

  return (
    <div className="overlay">
      <div className="surface p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">レイアウト設定</h2>

        <fieldset className="mb-4">
          <legend className="text-sm font-medium mb-1">カラーテーマ</legend>
          {radio<Theme>(
            'theme',
            (Object.keys(THEME_LABELS) as Theme[]).map((t) => ({ value: t, label: THEME_LABELS[t] })),
            draft.theme,
            (theme) => setDraft({ ...draft, theme }),
          )}
        </fieldset>

        <fieldset className="mb-4">
          <legend className="text-sm font-medium mb-1">表示スタイル</legend>
          {radio<ViewMode>('view_mode', VIEW_MODES, draft.view_mode, (view_mode) => setDraft({ ...draft, view_mode }))}
        </fieldset>

        <fieldset className="mb-4">
          <legend className="text-sm font-medium mb-1">表示の密度</legend>
          {radio<Density>('density', DENSITIES, draft.density, (density) => setDraft({ ...draft, density }))}
        </fieldset>

        <fieldset className="mb-6">
          <legend className="text-sm font-medium mb-1">表示する項目</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(COLUMN_LABELS).map(([col, label]) => (
              <label key={col} className="text-sm">
                <input
                  type="checkbox"
                  checked={draft.visible_columns.includes(col)}
                  onChange={() => toggleColumn(col)}
                />{' '}
                {label}
              </label>
            ))}
          </div>
          {draft.visible_columns.length === 0 && (
            <p className="error-text text-sm mt-1">1つ以上の項目を選んでください</p>
          )}
        </fieldset>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">
            キャンセル
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={draft.visible_columns.length === 0}
            className="btn btn-primary"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
