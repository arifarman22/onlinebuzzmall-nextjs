import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// All available permissions grouped by module
export const PERMISSIONS = {
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
} as const;

export type PermissionSlug = typeof PERMISSIONS[keyof typeof PERMISSIONS][number];

// Check if an admin has a specific permission
export async function hasPermission(adminId: number, permission: string): Promise<boolean> {
  const admin = await db.admin.findUnique({
    where: { id: adminId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!admin) return false;

  // No role assigned — treat as super-admin (first admin account)
  if (!admin.role) return true;

  // Super admin (role slug = 'super-admin') has all permissions
  if (admin.role.slug === 'super-admin') return true;

  return admin.role.permissions.some((rp: { permission: { slug: string } }) => rp.permission.slug === permission);
}

// Check multiple permissions (any of them)
export async function hasAnyPermission(adminId: number, permissions: string[]): Promise<boolean> {
  const admin = await db.admin.findUnique({
    where: { id: adminId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!admin?.role) return false;
  if (admin.role.slug === 'super-admin') return true;

  const adminPermissions = admin.role.permissions.map((rp: { permission: { slug: string } }) => rp.permission.slug);
  return permissions.some((p) => adminPermissions.includes(p));
}

// Get all permissions for an admin
export async function getAdminPermissions(adminId: number): Promise<string[]> {
  const admin = await db.admin.findUnique({
    where: { id: adminId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!admin?.role) return [];
  if (admin.role.slug === 'super-admin') {
    return Object.values(PERMISSIONS).flat();
  }

  return admin.role.permissions.map((rp: { permission: { slug: string } }) => rp.permission.slug);
}

// Middleware-style guard for API routes
export async function requirePermission(permission: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return { authorized: false, response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }

  // Super-admin check via session roleSlug — avoids extra DB query
  const roleSlug = (session.user as any).roleSlug || '';
  if (roleSlug === 'super-admin') {
    return { authorized: true, adminId: Number(session.user.id), session };
  }

  const adminId = Number(session.user.id);
  const allowed = await hasPermission(adminId, permission);

  if (!allowed) {
    return { authorized: false, response: NextResponse.json({ success: false, message: 'Forbidden: insufficient permissions' }, { status: 403 }) };
  }

  return { authorized: true, adminId, session };
}

// Seed default roles and permissions
export async function seedRBAC() {
  // Create all permissions
  const allPermissions: { name: string; slug: string; group: string }[] = [];
  for (const [group, perms] of Object.entries(PERMISSIONS)) {
    for (const slug of perms) {
      const name = slug
        .replace('.', ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      allPermissions.push({ name, slug, group });
    }
  }

  for (const perm of allPermissions) {
    await db.permission.upsert({
      where: { slug: perm.slug },
      update: {},
      create: perm,
    });
  }

  // Create super-admin role
  const superAdmin = await db.role.upsert({
    where: { slug: 'super-admin' },
    update: {},
    create: { name: 'Super Admin', slug: 'super-admin', description: 'Full access to all features', is_default: 1 },
  });

  // Create moderator role with limited permissions
  const moderator = await db.role.upsert({
    where: { slug: 'moderator' },
    update: {},
    create: { name: 'Moderator', slug: 'moderator', description: 'Limited access for support and user management' },
  });

  // Assign moderator permissions
  const modPerms = ['dashboard.view', 'users.view', 'users.edit', 'deposits.view', 'withdrawals.view', 'support.view', 'support.reply', 'reports.view'];
  const permissions = await db.permission.findMany({ where: { slug: { in: modPerms } } });

  for (const perm of permissions) {
    await db.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: moderator.id, permission_id: perm.id } },
      update: {},
      create: { role_id: moderator.id, permission_id: perm.id },
    });
  }

  // Create support role
  const support = await db.role.upsert({
    where: { slug: 'support' },
    update: {},
    create: { name: 'Support Staff', slug: 'support', description: 'Support ticket management only' },
  });

  const supportPerms = ['dashboard.view', 'support.view', 'support.reply', 'support.close'];
  const supportPermissions = await db.permission.findMany({ where: { slug: { in: supportPerms } } });

  for (const perm of supportPermissions) {
    await db.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: support.id, permission_id: perm.id } },
      update: {},
      create: { role_id: support.id, permission_id: perm.id },
    });
  }

  return { superAdmin, moderator, support };
}
