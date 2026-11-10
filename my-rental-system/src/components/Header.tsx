'use client';

interface HeaderProps {
  email?: string;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function Header({ email, onOpenSettings, onLogout }: HeaderProps) {
  return (
    <header className="surface rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold">物貸し借りシステム</h1>
        <div className="flex items-center gap-3">
          {email && <span className="muted text-sm hidden sm:inline">{email}</span>}
          <button onClick={onOpenSettings} className="btn btn-secondary">
            レイアウト設定
          </button>
          <button onClick={onLogout} className="btn btn-secondary">
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
