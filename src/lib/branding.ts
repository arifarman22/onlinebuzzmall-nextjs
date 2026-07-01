import { unstable_cache } from 'next/cache';
import { getSetting } from '@/lib/settings';

export const getBranding = unstable_cache(
  async () => {
    const [logo, darkLogo, adminLogo, footerLogo, favicon, siteName] = await Promise.all([
      getSetting('logo'),
      getSetting('dark_logo'),
      getSetting('admin_logo'),
      getSetting('footer_logo'),
      getSetting('favicon'),
      getSetting('site_name', 'OnlineBuzz Mall'),
    ]);
    return { logo, darkLogo, adminLogo, footerLogo, favicon, siteName };
  },
  ['branding'],
  { revalidate: 300 }
);
