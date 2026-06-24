import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Check if current admin session has a specific permission.
 * Super Admin (slug: 'super-admin') bypasses all checks.
 * Returns { allowed, session, adminId } or null if not admin.
 */
export async function checkPermission(permissionSlug?: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return null;
  }

  const roleSlug = (session.user as any).roleSlug || 'super-admin';
  const adminId = Number((session.user as any).id);

  // Super Admin bypasses all permission checks
  if (roleSlug === 'super-admin') {
    return { allowed: true, session, adminId, roleSlug };
  }

  // If no specific permission required, just verify they're admin
  if (!permissionSlug) {
    return { allowed: true, session, adminId, roleSlug };
  }

  // Check permission in DB
  const roleId = (session.user as any).roleId;
  if (!roleId) return { allowed: false, session, adminId, roleSlug };

  const permission = await db.permission.findFirst({ where: { slug: permissionSlug } });
  if (!permission) return { allowed: false, session, adminId, roleSlug };

  const rolePermission = await db.rolePermission.findFirst({
    where: { role_id: roleId, permission_id: permission.id },
  });

  return { allowed: !!rolePermission, session, adminId, roleSlug };
}

/**
 * Simple guard — returns session info if admin, null otherwise.
 * Does NOT check permissions (for backward compat).
 */
export async function guardAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return {
    session,
    adminId: Number((session.user as any).id),
    roleSlug: (session.user as any).roleSlug || 'super-admin',
    isSuperAdmin: ((session.user as any).roleSlug || 'super-admin') === 'super-admin',
  };
}

/**
 * Define which routes each role can access.
 * Super Admin: everything
 * Moderator: users, orders, deposits, withdrawals, support
 * Support: support tickets only
 */
export const ROLE_ROUTE_ACCESS: Record<string, string[]> = {
  'super-admin': ['*'],
  'moderator': [
    '/admin/dashboard',
    '/admin/users',
    '/admin/orders',
    '/admin/order-sets',
    '/admin/deposits',
    '/admin/withdrawals',
    '/admin/support',
    '/admin/kyc',
    '/admin/reports',
  ],
  'support': [
    '/admin/dashboard',
    '/admin/support',
    '/admin/kyc',
  ],
};

/**
 * Check if a role can access a specific route path.
 */
export function canAccessRoute(roleSlug: string, path: string): boolean {
  const routes = ROLE_ROUTE_ACCESS[roleSlug];
  if (!routes) return false;
  if (routes.includes('*')) return true;
  return routes.some((r) => path === r || path.startsWith(r + '/'));
}
