import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAllSettingsGrouped, updateSettings, seedSettings, getSettingsByGroup } from '@/lib/settings';
import { requirePermission } from '@/lib/rbac';

// GET: Fetch all settings grouped, or by specific group
export async function GET(req: NextRequest) {
  const guard = await requirePermission('settings.view');
  if (!guard.authorized) return guard.response;

  const group = req.nextUrl.searchParams.get('group');
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'seed') {
    await seedSettings();
    return NextResponse.json({ success: true, message: 'Settings seeded successfully' });
  }

  if (action === 'audit') {
    const logs = await db.settingAuditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, data: logs });
  }

  if (group) {
    const settings = await getSettingsByGroup(group);
    return NextResponse.json({ success: true, data: settings });
  }

  const grouped = await getAllSettingsGrouped();
  return NextResponse.json({ success: true, data: grouped });
}

// PUT: Update multiple settings
export async function PUT(req: NextRequest) {
  const guard = await requirePermission('settings.edit');
  if (!guard.authorized) return guard.response;

  const body = await req.json();
  const { settings } = body;

  if (!settings || !Array.isArray(settings)) {
    return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
  }

  await updateSettings(settings, guard.adminId);

  return NextResponse.json({ success: true, message: 'Settings updated successfully' });
}

// POST: Create or update a single setting (for image uploads etc.)
export async function POST(req: NextRequest) {
  const guard = await requirePermission('settings.edit');
  if (!guard.authorized) return guard.response;

  const body = await req.json();
  const { key, value, group, type, label, hint } = body;

  if (!key) return NextResponse.json({ success: false, message: 'Key is required' }, { status: 400 });

  const existing = await db.siteSetting.findUnique({ where: { key } });

  if (existing) {
    await db.settingAuditLog.create({
      data: { admin_id: guard.adminId, key, old_value: existing.value, new_value: value },
    });
    await db.siteSetting.update({ where: { key }, data: { value } });
  } else {
    await db.siteSetting.create({
      data: { key, value, group: group || 'general', type: type || 'text', label, hint },
    });
  }

  return NextResponse.json({ success: true, message: 'Setting saved' });
}
