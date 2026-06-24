import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedRBAC } from '@/lib/rbac';
import bcrypt from 'bcryptjs';

// GET /api/admin/rbac-seed?secret=YOUR_CRON_SECRET
// One-time endpoint to seed roles, permissions, and admin accounts
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Admin credentials from environment variables
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || process.env.CRON_SECRET;
  if (!adminPassword || adminPassword.length < 8) {
    return NextResponse.json({ success: false, message: 'ADMIN_SEED_PASSWORD env variable required (min 8 chars)' }, { status: 400 });
  }

  try {
    const result = await seedRBAC();
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Delete old test admin accounts
    await db.admin.deleteMany({
      where: { username: { in: ['superadmin', 'moderator', 'support', 'admin', 'admin_root'] } },
    });

    // Create Super Admin account
    await db.admin.upsert({
      where: { username: 'ComputerChapter' },
      update: { role_id: result.superAdmin.id },
      create: {
        name: 'Computer Chapter',
        email: 'admin@onlinebuzzmall.com',
        username: 'ComputerChapter',
        password: hashedPassword,
        role_id: result.superAdmin.id,
      },
    });

    // Create Moderator account
    await db.admin.upsert({
      where: { username: 'ModeratorX' },
      update: { role_id: result.moderator.id },
      create: {
        name: 'Moderator',
        email: 'moderatorx@onlinebuzzmall.com',
        username: 'ModeratorX',
        password: hashedPassword,
        role_id: result.moderator.id,
      },
    });

    // Create Support Staff account
    await db.admin.upsert({
      where: { username: 'SupportTeam' },
      update: { role_id: result.support.id },
      create: {
        name: 'Support Staff',
        email: 'supportteam@onlinebuzzmall.com',
        username: 'SupportTeam',
        password: hashedPassword,
        role_id: result.support.id,
      },
    });

    // Assign super-admin role to any existing admin without a role
    await db.admin.updateMany({
      where: { role_id: null },
      data: { role_id: result.superAdmin.id },
    });

    return NextResponse.json({
      success: true,
      message: 'RBAC seeded successfully',
      data: {
        roles: [result.superAdmin.name, result.moderator.name, result.support.name],
        accounts: ['ComputerChapter', 'ModeratorX', 'SupportTeam'],
        note: 'All accounts use the password from ADMIN_SEED_PASSWORD env variable',
        loginUrl: '/admin/login',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
