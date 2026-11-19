import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Google reCAPTCHA のトークンをサーバー側で検証する */
async function verifyRecaptcha(token: string, secret: string): Promise<boolean> {
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  if (!res.ok) return false;
  const result: { success?: boolean } = await res.json();
  return result.success === true;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email: unknown = body?.email;
  const password: unknown = body?.password;
  const token: unknown = body?.token;

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return fail('メールアドレスの形式が正しくありません', 400);
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return fail(`パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`, 400);
  }
  if (typeof token !== 'string' || token === '') {
    return fail('reCAPTCHA を確認してください', 400);
  }

  // 任意: 登録できるメールのドメインを制限する（例: sendai-nct.jp）
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (allowedDomain && !email.toLowerCase().endsWith('@' + allowedDomain.toLowerCase())) {
    return fail(`@${allowedDomain} のメールアドレスのみ登録できます`, 403);
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!secret || !supabaseUrl || !supabaseKey) {
    return fail('サーバーの設定が不足しています（RECAPTCHA_SECRET_KEY など）', 500);
  }

  let human = false;
  try {
    human = await verifyRecaptcha(token, secret);
  } catch {
    return fail('reCAPTCHA の確認に失敗しました。時間をおいて、もう一度お試しください', 502);
  }
  if (!human) return fail('reCAPTCHA の確認に失敗しました。もう一度チェックしてください', 400);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: new URL(request.url).origin },
  });
  if (error) return fail('登録に失敗しました: ' + error.message, 400);

  return NextResponse.json({ ok: true });
}
