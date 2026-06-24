import { getSetting } from '@/lib/settings';

export async function getBranding() {
  const [logo, darkLogo, adminLogo, footerLogo, favicon, siteName] = await Promise.all([
    getSetting('logo'),
    getSetting('dark_logo'),
    getSetting('admin_logo'),
    getSetting('footer_logo'),
    getSetting('favicon'),
    getSetting('site_name', 'OnlineBuzz Mall'),
  ]);

  return { logo, darkLogo, adminLogo, footerLogo, favicon, siteName };
}
