import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '物貸し借りシステム',
  description: '物品の貸し借りを管理するシステム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
