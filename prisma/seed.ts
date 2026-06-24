// Run: npx tsx prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const PERMISSIONS: Record<string, string[]> = {
  dashboard: ['dashboard.view'],
  users: ['users.view', 'users.edit', 'users.ban', 'users.balance', 'users.password'],
  deposits: ['deposits.view', 'deposits.approve', 'deposits.reject'],
  withdrawals: ['withdrawals.view', 'withdrawals.approve', 'withdrawals.reject'],
  orders: ['orders.view', 'orders.manage'],
  order_sets: ['order_sets.view', 'order_sets.create', 'order_sets.edit', 'order_sets.delete', 'order_sets.assign'],
  plans: ['plans.view', 'plans.create', 'plans.edit'],
  platforms: ['platforms.view', 'platforms.create', 'platforms.edit', 'platforms.delete'],
  products: ['products.view', 'products.create', 'products.edit', 'products.delete'],
  support: ['support.view', 'support.reply', 'support.close'],
  commissions: ['commissions.view', 'commissions.edit'],
  reports: ['reports.view'],
  settings: ['settings.view', 'settings.edit'],
  roles: ['roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.assign'],
  notifications: ['notifications.view', 'notifications.edit'],
  pages: ['pages.view', 'pages.create', 'pages.edit', 'pages.delete'],
};

async function main() {
  console.log('Seeding RBAC...');

  // 1. Create all permissions
  for (const [group, perms] of Object.entries(PERMISSIONS)) {
    for (const slug of perms) {
      const name = slug.replace('.', ' ').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await db.permission.upsert({ where: { slug }, update: {}, create: { name, slug, group } });
    }
  }
  console.log('✓ Permissions created');

  // 2. Create roles
  const superAdmin = await db.role.upsert({
    where: { slug: 'super-admin' },
    update: {},
    create: { name: 'Super Admin', slug: 'super-admin', description: 'Full access to all features', is_default: 1 },
  });

  const moderator = await db.role.upsert({
    where: { slug: 'moderator' },
    update: {},
    create: { name: 'Moderator', slug: 'moderator', description: 'User and financial management' },
  });

  const support = await db.role.upsert({
    where: { slug: 'support' },
    update: {},
    create: { name: 'Support Staff', slug: 'support', description: 'Support ticket management only' },
  });
  console.log('✓ Roles created');

  // 3. Assign moderator permissions
  const modPerms = ['dashboard.view', 'users.view', 'users.edit', 'users.ban', 'users.balance', 'deposits.view', 'deposits.approve', 'deposits.reject', 'withdrawals.view', 'withdrawals.approve', 'withdrawals.reject', 'orders.view', 'support.view', 'support.reply', 'reports.view'];
  for (const slug of modPerms) {
    const perm = await db.permission.findUnique({ where: { slug } });
    if (perm) {
      await db.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: moderator.id, permission_id: perm.id } },
        update: {},
        create: { role_id: moderator.id, permission_id: perm.id },
      });
    }
  }

  // 4. Assign support permissions
  const supportPerms = ['dashboard.view', 'support.view', 'support.reply', 'support.close'];
  for (const slug of supportPerms) {
    const perm = await db.permission.findUnique({ where: { slug } });
    if (perm) {
      await db.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: support.id, permission_id: perm.id } },
        update: {},
        create: { role_id: support.id, permission_id: perm.id },
      });
    }
  }
  console.log('✓ Role permissions assigned');

  // 5. Create/update admin accounts with proper roles
  const adminPassword = await bcrypt.hash('ComputerChapter@@2025#', 12);
  await db.admin.upsert({
    where: { username: 'ComputerChapter' },
    update: { role_id: superAdmin.id, password: adminPassword },
    create: { name: 'Super Admin', email: 'admin@onlinebuzzmall.com', username: 'ComputerChapter', password: adminPassword, role_id: superAdmin.id },
  });

  // Also assign super-admin role to the original admin (id=1)
  await db.admin.updateMany({ where: { id: 1 }, data: { role_id: superAdmin.id } });
  console.log('✓ Admin accounts configured');

  // 6. Seed site settings
  console.log('Seeding settings...');
  const settings = [
    { key: 'site_name', value: 'OnlineBuzz Mall', group: 'general', type: 'text', label: 'Site Name', hint: 'Your website name', sort_order: 1 },
    { key: 'site_title', value: 'Your Trusted E-Commerce Platform', group: 'general', type: 'text', label: 'Site Title', hint: 'Shown in browser tab', sort_order: 2 },
    { key: 'site_description', value: 'Earn while you shop with our MLM platform', group: 'general', type: 'textarea', label: 'Site Description', hint: '', sort_order: 3 },
    { key: 'company_name', value: 'OnlineBuzz Mall LLC', group: 'general', type: 'text', label: 'Company Name', hint: '', sort_order: 4 },
    { key: 'company_email', value: '', group: 'general', type: 'text', label: 'Company Email', hint: '', sort_order: 5 },
    { key: 'support_email', value: '', group: 'general', type: 'text', label: 'Support Email', hint: '', sort_order: 6 },
    { key: 'currency', value: 'USD', group: 'general', type: 'text', label: 'Currency', hint: '', sort_order: 7 },
    { key: 'currency_symbol', value: '$', group: 'general', type: 'text', label: 'Currency Symbol', hint: '', sort_order: 8 },
    { key: 'logo', value: '', group: 'branding', type: 'image', label: 'Logo', hint: 'Main site logo', sort_order: 1 },
    { key: 'favicon', value: '', group: 'branding', type: 'image', label: 'Favicon', hint: '32x32 icon', sort_order: 2 },
    { key: 'dark_logo', value: '', group: 'branding', type: 'image', label: 'Dark Logo', hint: 'For dark backgrounds', sort_order: 3 },
    { key: 'primary_color', value: '#6366f1', group: 'theme', type: 'color', label: 'Primary Color', hint: '', sort_order: 1 },
    { key: 'secondary_color', value: '#a855f7', group: 'theme', type: 'color', label: 'Secondary Color', hint: '', sort_order: 2 },
    { key: 'registration_enabled', value: '1', group: 'users', type: 'boolean', label: 'Registration Enabled', hint: '', sort_order: 1 },
    { key: 'email_verification', value: '1', group: 'users', type: 'boolean', label: 'Email Verification', hint: '', sort_order: 2 },
    { key: 'kyc_enabled', value: '1', group: 'users', type: 'boolean', label: 'KYC Enabled', hint: '', sort_order: 3 },
    { key: 'referral_enabled', value: '1', group: 'users', type: 'boolean', label: 'Referral System', hint: '', sort_order: 4 },
    { key: 'min_deposit', value: '10', group: 'financial', type: 'number', label: 'Min Deposit', hint: '', sort_order: 1 },
    { key: 'max_deposit', value: '100000', group: 'financial', type: 'number', label: 'Max Deposit', hint: '', sort_order: 2 },
    { key: 'min_withdrawal', value: '10', group: 'financial', type: 'number', label: 'Min Withdrawal', hint: '', sort_order: 3 },
    { key: 'max_withdrawal', value: '50000', group: 'financial', type: 'number', label: 'Max Withdrawal', hint: '', sort_order: 4 },
    { key: 'transfer_enabled', value: '1', group: 'financial', type: 'boolean', label: 'Balance Transfer', hint: '', sort_order: 5 },
    { key: 'smtp_host', value: '', group: 'email', type: 'text', label: 'SMTP Host', hint: '', sort_order: 1 },
    { key: 'smtp_port', value: '465', group: 'email', type: 'number', label: 'SMTP Port', hint: '', sort_order: 2 },
    { key: 'smtp_user', value: '', group: 'email', type: 'text', label: 'SMTP Username', hint: '', sort_order: 3 },
    { key: 'smtp_password', value: '', group: 'email', type: 'text', label: 'SMTP Password', hint: '', sort_order: 4 },
    { key: 'maintenance_mode', value: '0', group: 'maintenance', type: 'boolean', label: 'Maintenance Mode', hint: '', sort_order: 1 },
    { key: 'maintenance_message', value: 'We are performing maintenance. Please check back soon.', group: 'maintenance', type: 'textarea', label: 'Maintenance Message', hint: '', sort_order: 2 },
  ];

  for (const s of settings) {
    await db.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log('✓ Settings seeded');

  console.log('\n=== Seed Complete ===');
  console.log(`Roles: ${superAdmin.id} (Super Admin), ${moderator.id} (Moderator), ${support.id} (Support)`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
