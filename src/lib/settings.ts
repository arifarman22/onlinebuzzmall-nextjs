import { db } from '@/lib/db';

// In-memory cache for settings (refreshed every 60s or on update)
let settingsCache: Map<string, string | null> = new Map();
let cacheTime = 0;
const CACHE_TTL = 60000; // 60 seconds

async function loadCache() {
  if (Date.now() - cacheTime < CACHE_TTL && settingsCache.size > 0) return;
  const all = await db.siteSetting.findMany();
  settingsCache = new Map(all.map((s) => [s.key, s.value]));
  cacheTime = Date.now();
}

export function invalidateCache() {
  cacheTime = 0;
  settingsCache.clear();
}

export async function getSetting(key: string, fallback: string = ''): Promise<string> {
  await loadCache();
  return settingsCache.get(key) ?? fallback;
}

export async function getSettingBool(key: string, fallback: boolean = false): Promise<boolean> {
  const val = await getSetting(key, fallback ? '1' : '0');
  return val === '1' || val === 'true';
}

export async function getSettingNum(key: string, fallback: number = 0): Promise<number> {
  const val = await getSetting(key, String(fallback));
  return Number(val) || fallback;
}

export async function getSettingJson<T = any>(key: string, fallback: T | null = null): Promise<T | null> {
  const val = await getSetting(key, '');
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

export async function getSettingsByGroup(group: string) {
  return db.siteSetting.findMany({ where: { group }, orderBy: { sort_order: 'asc' } });
}

export async function getAllSettings() {
  return db.siteSetting.findMany({ orderBy: [{ group: 'asc' }, { sort_order: 'asc' }] });
}

export async function getAllSettingsGrouped() {
  const all = await getAllSettings();
  const grouped: Record<string, typeof all> = {};
  for (const s of all) {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  }
  return grouped;
}

export async function updateSetting(key: string, value: string, adminId?: number) {
  const existing = await db.siteSetting.findUnique({ where: { key } });
  const oldValue = existing?.value || null;

  await db.siteSetting.upsert({
    where: { key },
    update: { value, updated_at: new Date() },
    create: { key, value, group: 'general', type: 'text' },
  });

  // Audit log
  if (oldValue !== value) {
    await db.settingAuditLog.create({
      data: { admin_id: adminId || null, key, old_value: oldValue, new_value: value },
    });
  }

  invalidateCache();
}

export async function updateSettings(settings: { key: string; value: string }[], adminId?: number) {
  for (const { key, value } of settings) {
    await updateSetting(key, value, adminId);
  }
}

// Seed all default settings
export async function seedSettings() {
  const defaults = getDefaultSettings();
  for (const s of defaults) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
}

function getDefaultSettings() {
  return [
    // General
    { key: 'site_name', value: 'OnlineBuzz Mall', group: 'general', type: 'text', label: 'Site Name', hint: 'Your website name', sort_order: 1 },
    { key: 'site_title', value: 'Your Trusted E-Commerce Platform', group: 'general', type: 'text', label: 'Site Title', hint: 'Shown in browser tab', sort_order: 2 },
    { key: 'site_description', value: 'Earn while you shop with our MLM platform', group: 'general', type: 'textarea', label: 'Site Description', hint: '', sort_order: 3 },
    { key: 'company_name', value: 'OnlineBuzz Mall LLC', group: 'general', type: 'text', label: 'Company Name', hint: '', sort_order: 4 },
    { key: 'company_address', value: '', group: 'general', type: 'textarea', label: 'Company Address', hint: '', sort_order: 5 },
    { key: 'company_phone', value: '', group: 'general', type: 'text', label: 'Company Phone', hint: '', sort_order: 6 },
    { key: 'company_email', value: '', group: 'general', type: 'text', label: 'Company Email', hint: '', sort_order: 7 },
    { key: 'support_email', value: '', group: 'general', type: 'text', label: 'Support Email', hint: '', sort_order: 8 },
    { key: 'timezone', value: 'UTC', group: 'general', type: 'text', label: 'Timezone', hint: 'e.g. UTC, America/New_York', sort_order: 9 },
    { key: 'currency', value: 'USD', group: 'general', type: 'text', label: 'Currency', hint: '', sort_order: 10 },
    { key: 'currency_symbol', value: '$', group: 'general', type: 'text', label: 'Currency Symbol', hint: '', sort_order: 11 },
    { key: 'language', value: 'en', group: 'general', type: 'text', label: 'Default Language', hint: '', sort_order: 12 },
    { key: 'date_format', value: 'MMM DD, YYYY', group: 'general', type: 'text', label: 'Date Format', hint: '', sort_order: 13 },

    // Branding
    { key: 'logo', value: '', group: 'branding', type: 'image', label: 'Logo', hint: 'Main site logo', sort_order: 1 },
    { key: 'favicon', value: '', group: 'branding', type: 'image', label: 'Favicon', hint: '32x32 or 64x64 icon', sort_order: 2 },
    { key: 'dark_logo', value: '', group: 'branding', type: 'image', label: 'Dark Logo', hint: 'For dark backgrounds', sort_order: 3 },
    { key: 'admin_logo', value: '', group: 'branding', type: 'image', label: 'Admin Panel Logo', hint: '', sort_order: 4 },
    { key: 'footer_logo', value: '', group: 'branding', type: 'image', label: 'Footer Logo', hint: '', sort_order: 5 },
    { key: 'default_avatar', value: '', group: 'branding', type: 'image', label: 'Default User Avatar', hint: '', sort_order: 6 },

    // Theme
    { key: 'primary_color', value: '#6366f1', group: 'theme', type: 'color', label: 'Primary Color', hint: '', sort_order: 1 },
    { key: 'secondary_color', value: '#a855f7', group: 'theme', type: 'color', label: 'Secondary Color', hint: '', sort_order: 2 },
    { key: 'accent_color', value: '#10b981', group: 'theme', type: 'color', label: 'Accent Color', hint: '', sort_order: 3 },
    { key: 'font_family', value: 'Inter', group: 'theme', type: 'text', label: 'Font Family', hint: 'Google Font name', sort_order: 4 },
    { key: 'dark_mode', value: '0', group: 'theme', type: 'boolean', label: 'Dark Mode Default', hint: '', sort_order: 5 },
    { key: 'custom_css', value: '', group: 'theme', type: 'code', label: 'Custom CSS', hint: 'Injected globally', sort_order: 6 },
    { key: 'custom_js', value: '', group: 'theme', type: 'code', label: 'Custom JS', hint: 'Injected in <head>', sort_order: 7 },

    // User Settings
    { key: 'registration_enabled', value: '1', group: 'users', type: 'boolean', label: 'Registration Enabled', hint: '', sort_order: 1 },
    { key: 'email_verification', value: '1', group: 'users', type: 'boolean', label: 'Email Verification', hint: '', sort_order: 2 },
    { key: 'mobile_verification', value: '0', group: 'users', type: 'boolean', label: 'Mobile Verification', hint: '', sort_order: 3 },
    { key: 'kyc_enabled', value: '1', group: 'users', type: 'boolean', label: 'KYC Enabled', hint: '', sort_order: 4 },
    { key: 'referral_enabled', value: '1', group: 'users', type: 'boolean', label: 'Referral System', hint: '', sort_order: 5 },
    { key: 'min_password_length', value: '6', group: 'users', type: 'number', label: 'Min Password Length', hint: '', sort_order: 6 },
    { key: 'login_max_attempts', value: '5', group: 'users', type: 'number', label: 'Max Login Attempts', hint: 'Before lockout', sort_order: 7 },
    { key: 'session_timeout', value: '168', group: 'users', type: 'number', label: 'Session Timeout (hours)', hint: '', sort_order: 8 },

    // Financial
    { key: 'min_deposit', value: '10', group: 'financial', type: 'number', label: 'Min Deposit', hint: '', sort_order: 1 },
    { key: 'max_deposit', value: '100000', group: 'financial', type: 'number', label: 'Max Deposit', hint: '', sort_order: 2 },
    { key: 'min_withdrawal', value: '10', group: 'financial', type: 'number', label: 'Min Withdrawal', hint: '', sort_order: 3 },
    { key: 'max_withdrawal', value: '50000', group: 'financial', type: 'number', label: 'Max Withdrawal', hint: '', sort_order: 4 },
    { key: 'deposit_charge_fixed', value: '0', group: 'financial', type: 'number', label: 'Deposit Fixed Charge', hint: '', sort_order: 5 },
    { key: 'deposit_charge_percent', value: '0', group: 'financial', type: 'number', label: 'Deposit % Charge', hint: '', sort_order: 6 },
    { key: 'withdrawal_charge_fixed', value: '0', group: 'financial', type: 'number', label: 'Withdrawal Fixed Charge', hint: '', sort_order: 7 },
    { key: 'withdrawal_charge_percent', value: '0', group: 'financial', type: 'number', label: 'Withdrawal % Charge', hint: '', sort_order: 8 },
    { key: 'transfer_enabled', value: '1', group: 'financial', type: 'boolean', label: 'Balance Transfer', hint: '', sort_order: 9 },
    { key: 'transfer_min', value: '1', group: 'financial', type: 'number', label: 'Transfer Min', hint: '', sort_order: 10 },
    { key: 'transfer_max', value: '10000', group: 'financial', type: 'number', label: 'Transfer Max', hint: '', sort_order: 11 },

    // Email
    { key: 'smtp_host', value: '', group: 'email', type: 'text', label: 'SMTP Host', hint: '', sort_order: 1 },
    { key: 'smtp_port', value: '465', group: 'email', type: 'number', label: 'SMTP Port', hint: '', sort_order: 2 },
    { key: 'smtp_user', value: '', group: 'email', type: 'text', label: 'SMTP Username', hint: '', sort_order: 3 },
    { key: 'smtp_password', value: '', group: 'email', type: 'text', label: 'SMTP Password', hint: '', sort_order: 4 },
    { key: 'smtp_from', value: '', group: 'email', type: 'text', label: 'From Email', hint: '', sort_order: 5 },
    { key: 'smtp_from_name', value: 'OnlineBuzz Mall', group: 'email', type: 'text', label: 'From Name', hint: '', sort_order: 6 },
    { key: 'smtp_encryption', value: 'ssl', group: 'email', type: 'text', label: 'Encryption', hint: 'ssl or tls', sort_order: 7 },

    // SEO
    { key: 'meta_title', value: 'OnlineBuzz Mall - Earn While You Shop', group: 'seo', type: 'text', label: 'Meta Title', hint: '', sort_order: 1 },
    { key: 'meta_description', value: '', group: 'seo', type: 'textarea', label: 'Meta Description', hint: '', sort_order: 2 },
    { key: 'meta_keywords', value: '', group: 'seo', type: 'textarea', label: 'Meta Keywords', hint: 'Comma separated', sort_order: 3 },
    { key: 'og_image', value: '', group: 'seo', type: 'image', label: 'OG Image', hint: '1200x630 recommended', sort_order: 4 },
    { key: 'google_analytics', value: '', group: 'seo', type: 'text', label: 'Google Analytics ID', hint: 'e.g. G-XXXXXXX', sort_order: 5 },
    { key: 'google_tag_manager', value: '', group: 'seo', type: 'text', label: 'GTM Container ID', hint: '', sort_order: 6 },
    { key: 'facebook_pixel', value: '', group: 'seo', type: 'text', label: 'Facebook Pixel ID', hint: '', sort_order: 7 },

    // Social Media
    { key: 'social_facebook', value: '', group: 'social', type: 'text', label: 'Facebook URL', hint: '', sort_order: 1 },
    { key: 'social_instagram', value: '', group: 'social', type: 'text', label: 'Instagram URL', hint: '', sort_order: 2 },
    { key: 'social_twitter', value: '', group: 'social', type: 'text', label: 'X (Twitter) URL', hint: '', sort_order: 3 },
    { key: 'social_linkedin', value: '', group: 'social', type: 'text', label: 'LinkedIn URL', hint: '', sort_order: 4 },
    { key: 'social_youtube', value: '', group: 'social', type: 'text', label: 'YouTube URL', hint: '', sort_order: 5 },
    { key: 'social_telegram', value: '', group: 'social', type: 'text', label: 'Telegram URL', hint: '', sort_order: 6 },
    { key: 'social_whatsapp', value: '', group: 'social', type: 'text', label: 'WhatsApp Number', hint: '', sort_order: 7 },

    // Security
    { key: 'recaptcha_enabled', value: '0', group: 'security', type: 'boolean', label: 'reCAPTCHA Enabled', hint: '', sort_order: 1 },
    { key: 'recaptcha_site_key', value: '', group: 'security', type: 'text', label: 'reCAPTCHA Site Key', hint: '', sort_order: 2 },
    { key: 'recaptcha_secret_key', value: '', group: 'security', type: 'text', label: 'reCAPTCHA Secret Key', hint: '', sort_order: 3 },
    { key: 'force_ssl', value: '0', group: 'security', type: 'boolean', label: 'Force SSL', hint: '', sort_order: 4 },
    { key: '2fa_enabled', value: '1', group: 'security', type: 'boolean', label: '2FA Available', hint: 'Allow users to enable 2FA', sort_order: 5 },

    // Maintenance
    { key: 'maintenance_mode', value: '0', group: 'maintenance', type: 'boolean', label: 'Maintenance Mode', hint: '', sort_order: 1 },
    { key: 'maintenance_message', value: 'We are currently performing maintenance. Please check back soon.', group: 'maintenance', type: 'textarea', label: 'Maintenance Message', hint: '', sort_order: 2 },

    // Content
    { key: 'terms_conditions', value: '', group: 'content', type: 'code', label: 'Terms & Conditions', hint: 'HTML content', sort_order: 1 },
    { key: 'privacy_policy', value: '', group: 'content', type: 'code', label: 'Privacy Policy', hint: 'HTML content', sort_order: 2 },
    { key: 'about_us', value: '', group: 'content', type: 'code', label: 'About Us', hint: 'HTML content', sort_order: 3 },
    { key: 'footer_text', value: '© 2024 OnlineBuzz Mall. All rights reserved.', group: 'content', type: 'text', label: 'Footer Text', hint: '', sort_order: 4 },
  ];
}
