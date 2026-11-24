'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_SETTINGS, type UserSettings } from '@/lib/types';
import { AppContext } from '@/components/AppContext';
import AuthForm from '@/components/AuthForm';
import Header from '@/components/Header';
import LayoutSettingsModal from '@/components/LayoutSettingsModal';

/** 全画面共通: ログイン状態の管理・ヘッダー・表示設定（テーマなど） */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const userId = session?.user.id;

  // ログイン状態の監視
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setAuthReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ログイン後に表示設定を読み込む
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('theme, view_mode, density, visible_columns')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled || !data) return;
      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
        visible_columns: Array.isArray(data.visible_columns)
          ? data.visible_columns
          : DEFAULT_SETTINGS.visible_columns,
      } as UserSettings);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSettings(DEFAULT_SETTINGS);
    router.push('/');
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
    if (!userId) return;
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...newSettings, updated_at: new Date().toISOString() });
    setErrorMessage(error ? '設定の保存に失敗しました: ' + error.message : '');
  };

  if (!authReady) return <p className="p-6 muted">読み込み中...</p>;
  if (!session) return <AuthForm />;

  return (
    <AppContext.Provider value={{ session, settings }}>
      <div className={`app theme-${settings.theme}`}>
        <Header email={session.user.email} onOpenSettings={() => setIsSettingsOpen(true)} onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto p-6">
          {errorMessage && <p className="error-text text-sm mb-4">{errorMessage}</p>}
          {children}
        </main>
        {isSettingsOpen && (
          <LayoutSettingsModal
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
