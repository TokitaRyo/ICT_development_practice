export interface Item {
  id: string;
  item_number: string;
  maker: string;
  name: string;
  serial_number: string | null;
  price: number | null;
  stock_count: number | null;
  created_at?: string;
}

/** 登録・更新時にフォームから渡す値 */
export interface ItemInput {
  maker: string;
  name: string;
  serial_number: string | null;
  price: number;
  stock_count: number;
}

export type Theme = 'indigo' | 'dark' | 'blue' | 'green';
export type ViewMode = 'table' | 'card';
export type Density = 'compact' | 'standard' | 'relaxed';

export interface UserSettings {
  theme: Theme;
  view_mode: ViewMode;
  density: Density;
  visible_columns: string[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'indigo',
  view_mode: 'table',
  density: 'standard',
  visible_columns: ['item_number', 'maker', 'name', 'serial_number', 'price', 'stock_count'],
};

export const COLUMN_LABELS: Record<string, string> = {
  item_number: '管理番号',
  maker: 'メーカー名',
  name: '製品名',
  serial_number: '製品番号',
  price: '単価',
  stock_count: '在庫数',
};

export const THEME_LABELS: Record<Theme, string> = {
  indigo: 'インディゴ',
  dark: 'ダーク',
  blue: 'ブルー',
  green: 'グリーン',
};

export type StockFilter = 'all' | 'in' | 'out';

export interface ItemFilter {
  maker: string;
  stock: StockFilter;
}

export const DEFAULT_FILTER: ItemFilter = { maker: '', stock: 'all' };
