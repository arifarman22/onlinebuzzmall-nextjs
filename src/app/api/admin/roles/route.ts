import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission, seedRBAC, PERMISSIONS } from '@/lib/rbac';

// GET: List all roles with permissions, or seed RBAC
export async function GET(req: NextRequest) {
  const guard = await requirePermission('roles.view');
  if (!guard.authorized) return guard.response;

  const action = req.nextUrl.searchParams.get('action');

  // Seed default roles & permissions
  if (action === 'seed') {
    const result = await seedRBAC();
    return NextResponse.json({ success: true, message: 'RBAC seeded', data: result });
  }

  // List all permissions grouped
  if (action === 'permissions') {
    const permissions = await db.permission.findMany({ orderBy: { group: 'asc' } });
    return NextResponse.json({ success: true, data: { permissions, groups: PERMISSIONS } });
  }

  const roles = await db.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { admins: true } },
    },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({ success: true, data: roles });
}

// POST: Create a new role
export async function POST(req: NextRequest) {
  const guard = await requirePermission('roles.create');
  if (!guard.authorized) return guard.response;

  const { name, slug, description, permissions } = await req.json();

  if (!name || !slug) {
    return NextResponse.json({ success: false, message: 'Name and slug are required' }, { status: 400 });
  }

  const existing = await db.role.findFirst({ where: { OR: [{ name }, { slug }] } });
  if (existing) {
    return NextResponse.json({ success: false, message: 'Role name or slug already exists' }, { status: 400 });
  }

  const role = await db.role.create({
    data: { name, slug, description },
  });

  // Assign permissions
  if (permissions && Array.isArray(permissions)) {
    const permRecords = await db.permission.findMany({ where: { slug: { in: permissions } } });
    for (const perm of permRecords) {
      await db.rolePermission.create({
        data: { role_id: role.id, permission_id: perm.id },
      });
    }
  }

  return NextResponse.json({ success: true, message: 'Role created', data: role });
}

// PUT: Update role and its permissions
export async function PUT(req: NextRequest) {
  const guard = await requirePermission('roles.edit');
  if (!guard.authorized) return guard.response;

  const { id, name, description, permissions } = await req.json();

  if (!id) return NextResponse.json({ success: false, message: 'Role ID required' }, { status: 400 });

  const role = await db.role.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });

  // Prevent editing super-admin slug
  if (role.slug === 'super-admin') {
    return NextResponse.json({ success: false, message: 'Cannot modify super-admin role' }, { status: 403 });
  }

  await db.role.update({
    where: { id },
    data: { name: name || role.name, description },
  });

  // Update permissions if provided
  if (permissions && Array.isArray(permissions)) {
    // Remove existing permissions
    await db.rolePermission.deleteMany({ where: { role_id: id } });

    // Add new permissions
    const permRecords = await db.permission.findMany({ where: { slug: { in: permissions } } });
    for (const perm of permRecords) {
      await db.rolePermission.create({
        data: { role_id: id, permission_id: perm.id },
      });
    }
  }

  return NextResponse.json({ success: true, message: 'Role updated' });
}

// DELETE: Delete a role
export async function DELETE(req: NextRequest) {
  const guard = await requirePermission('roles.delete');
  if (!guard.authorized) return guard.response;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ success: false, message: 'Role ID required' }, { status: 400 });

  const role = await db.role.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });

  if (role.slug === 'super-admin') {
    return NextResponse.json({ success: false, message: 'Cannot delete super-admin role' }, { status: 403 });
  }

  // Check if any admins are assigned
  const adminCount = await db.admin.count({ where: { role_id: id } });
  if (adminCount > 0) {
    return NextResponse.json({ success: false, message: `Cannot delete: ${adminCount} admin(s) assigned to this role` }, { status: 400 });
  }

  await db.rolePermission.deleteMany({ where: { role_id: id } });
  await db.role.delete({ where: { id } });

  return NextResponse.json({ success: true, message: 'Role deleted' });
}

// PATCH: Assign role to admin
export async function PATCH(req: NextRequest) {
  const guard = await requirePermission('roles.assign');
  if (!guard.authorized) return guard.response;

  const { admin_id, role_id } = await req.json();

  if (!admin_id || !role_id) {
    return NextResponse.json({ success: false, message: 'Admin ID and Role ID required' }, { status: 400 });
  }

  const admin = await db.admin.findUnique({ where: { id: admin_id } });
  if (!admin) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });

  const role = await db.role.findUnique({ where: { id: role_id } });
  if (!role) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });

  await db.admin.update({ where: { id: admin_id }, data: { role_id } });

  return NextResponse.json({ success: true, message: `Role "${role.name}" assigned to ${admin.name}` });
}
