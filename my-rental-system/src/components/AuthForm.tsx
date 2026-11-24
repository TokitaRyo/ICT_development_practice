'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RecaptchaBox from '@/components/RecaptchaBox';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const MIN_PASSWORD_LENGTH = 8;

type Mode = 'login' | 'signup';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setConfirm('');
    setCaptchaToken(null);
    setError('');
    setNotice('');
  };

  const handleLogin = async () => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'メールアドレスまたはパスワードが違います'
          : 'ログインに失敗しました: ' + signInError.message,
      );
    }
    // 成功時は onAuthStateChange が一覧画面へ切り替える
  };

  const handleSignup = async () => {
    if (!RECAPTCHA_SITE_KEY) {
      setError('reCAPTCHA のサイトキーが設定されていません');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`);
      return;
    }
    if (password !== confirm) {
      setError('パスワードが一致しません');
      return;
    }
    if (!captchaToken) {
      setError('「ロボットではありません」にチェックを入れてください');
      return;
    }

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, token: captchaToken }),
    });
    const body: { error?: string } = await res.json().catch(() => ({}));

    // reCAPTCHA のトークンは1回限り。成否にかかわらずリセットする
    setCaptchaToken(null);
    setResetSignal((n) => n + 1);

    if (!res.ok) {
      setError(body.error ?? '登録に失敗しました');
      return;
    }
    setMode('login');
    setPassword('');
    setConfirm('');
    setNotice('登録しました。確認メールが届いた場合は、メール内のリンクを開いてからログインしてください。');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await (mode === 'login' ? handleLogin() : handleSignup());
    } catch {
      setError('通信に失敗しました。時間をおいて、もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      onClick={() => switchMode(value)}
      className={`flex-1 pb-2 text-sm border-b-2 ${mode === value ? 'font-bold' : 'muted border-transparent'}`}
      style={mode === value ? { borderColor: 'var(--accent)' } : undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="app flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="surface p-8 w-full max-w-sm shadow-md">
        <h1 className="text-xl font-bold mb-6 text-center">文房具在庫管理システム</h1>

        <div className="flex mb-6">
          {tab('login', 'ログイン')}
          {tab('signup', '新規登録')}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">ID (Email)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Ps (Password)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
            required
          />
          {mode === 'signup' && <p className="muted text-xs mt-1">{MIN_PASSWORD_LENGTH}文字以上</p>}
        </div>

        {mode === 'signup' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Ps (確認用)</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="field"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="mb-4 overflow-x-auto">
              {RECAPTCHA_SITE_KEY ? (
                <RecaptchaBox siteKey={RECAPTCHA_SITE_KEY} onChange={setCaptchaToken} resetSignal={resetSignal} />
              ) : (
                <p className="error-text text-sm">reCAPTCHA のサイトキー（NEXT_PUBLIC_RECAPTCHA_SITE_KEY）が未設定です</p>
              )}
            </div>
          </>
        )}

        {error && <p className="error-text text-sm mb-4">{error}</p>}
        {notice && <p className="text-sm mb-4">{notice}</p>}

        <button
          type="submit"
          disabled={loading || (mode === 'signup' && !RECAPTCHA_SITE_KEY)}
          className="btn btn-primary w-full"
        >
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
        </button>
      </form>
    </div>
  );
}
