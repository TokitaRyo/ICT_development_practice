'use client';

import { useEffect, useRef } from 'react';

interface Grecaptcha {
  ready: (cb: () => void) => void;
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'light' | 'dark';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const SCRIPT_URL = 'https://www.google.com/recaptcha/api.js?render=explicit';

interface RecaptchaBoxProps {
  siteKey: string;
  /** チェック済みならトークン、未チェック・期限切れ・エラーなら null */
  onChange: (token: string | null) => void;
  /** この値が変わるたびにチェックをリセットする（トークンは1回しか使えない） */
  resetSignal: number;
}

export default function RecaptchaBox({ siteKey, onChange, resetSignal }: RecaptchaBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;

    const renderWidget = () => {
      const grecaptcha = window.grecaptcha;
      if (cancelled || !grecaptcha || !containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token) => onChangeRef.current(token),
        'expired-callback': () => onChangeRef.current(null),
        'error-callback': () => onChangeRef.current(null),
      });
    };
    const onScriptReady = () => window.grecaptcha?.ready(renderWidget);

    let script = document.querySelector<HTMLScriptElement>('script[src^="https://www.google.com/recaptcha/api.js"]');
    if (window.grecaptcha) {
      onScriptReady();
    } else if (script) {
      script.addEventListener('load', onScriptReady);
    } else {
      script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onScriptReady);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener('load', onScriptReady);
    };
  }, [siteKey]);

  useEffect(() => {
    if (widgetIdRef.current !== null) window.grecaptcha?.reset(widgetIdRef.current);
  }, [resetSignal]);

  return <div ref={containerRef} />;
}
