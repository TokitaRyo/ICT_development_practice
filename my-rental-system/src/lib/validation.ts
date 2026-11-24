import type { ItemInput } from '@/lib/types';

export interface ItemFormValues {
  maker: string;
  name: string;
  serial_number: string;
  price: string;
  stock_count: string;
}

export type ItemFormErrors = Partial<Record<keyof ItemFormValues, string>>;

/** PostgreSQL の integer の上限 */
const MAX_INT = 2147483647;

function checkNonNegativeInteger(label: string, raw: string): string | null {
  const value = raw.trim();
  if (value === '') return `${label}は必須です`;
  if (!/^\d+$/.test(value) || Number(value) > MAX_INT) return `${label}は0以上の整数で入力してください`;
  return null;
}

/**
 * 在庫の入力チェック。
 * 必須: 製品名・単価・在庫数 / 属性: 単価・在庫数は0以上の整数
 */
export function validateItemForm(values: ItemFormValues): { errors: ItemFormErrors; input: ItemInput | null } {
  const errors: ItemFormErrors = {};

  if (values.name.trim() === '') errors.name = '製品名は必須です';

  const priceError = checkNonNegativeInteger('単価', values.price);
  if (priceError) errors.price = priceError;

  const stockError = checkNonNegativeInteger('在庫数', values.stock_count);
  if (stockError) errors.stock_count = stockError;

  if (Object.keys(errors).length > 0) return { errors, input: null };

  return {
    errors,
    input: {
      maker: values.maker.trim(),
      name: values.name.trim(),
      serial_number: values.serial_number.trim() || null,
      price: Number(values.price.trim()),
      stock_count: Number(values.stock_count.trim()),
    },
  };
}
