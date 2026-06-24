import { Inter, Nunito_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getBranding } from '@/lib/branding';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const nunito = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito', weight: ['300', '400', '500', '600', '700'] });

export async function generateMetadata() {
  const { siteName, favicon } = await getBranding();
  return {
    title: siteName,
    description: 'Your trusted e-commerce platform',
    icons: favicon ? { icon: [{ url: favicon }] } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} ${nunito.variable} font-sans antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-white`}>
        <Providers>
          <AnalyticsTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
