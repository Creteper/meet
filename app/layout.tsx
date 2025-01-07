import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: 'Meet Pro',
    template: '%s',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.ico',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" data-lk-theme="default">
      <body className='overflow-hidden h-screen'>
        { children }
        <Toaster />
      </body>
    </html>
  );
}
