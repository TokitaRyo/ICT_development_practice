'use client';

import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserSettings } from '@/lib/types';

interface AppContextValue {
  session: Session;
  settings: UserSettings;
}

export const AppContext = createContext<AppContextValue | null>(null);

/** ログイン済みの画面（AppShell の内側）で、ユーザーと表示設定を取得する */
export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp は AppShell の内側で使ってください');
  return value;
}
