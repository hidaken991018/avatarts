import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SNSアプリ',
  description: 'Next.js、TypeScript、Tailwind CSS、shadcn/ui、Supabaseで作成したSNSアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SupabaseProvider>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}