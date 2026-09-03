import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SidebarDock from '@/components/SidebarDock';
import GlobalWorkerNotification from '@/components/GlobalWorkerNotification';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'FixItNow — AI-Powered Hyperlocal Services',
  description: 'Upload a photo or video of your problem. Our AI identifies the issue and connects you with the right blue-collar professional near you.',
  keywords: 'plumber, electrician, carpenter, home repair, hyperlocal, blue collar workers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Navbar />
          <Suspense fallback={null}>
            <SidebarDock />
          </Suspense>
          <GlobalWorkerNotification />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
