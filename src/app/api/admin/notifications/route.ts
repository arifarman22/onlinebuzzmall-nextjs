import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get('action');

  // Fetch recent admin notifications (user_id = 0)
  if (action === 'recent') {
    const notifications = await db.notificationLog.findMany({
      where: { user_id: 0 },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    return NextResponse.json({ success: true, data: notifications });
  }

  // Fetch single template by id
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (id) {
    const template = await db.notificationTemplate.findUnique({ where: { id } });
    if (!template) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: template });
  }

  return NextResponse.json({ success: false, message: 'Missing params' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await req.json();

  if (action === 'mark_all_read') {
    await db.notificationLog.updateMany({
      where: { user_id: 0, is_read: 0 },
      data: { is_read: 1, read_at: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id, subject, email_body, sms_body, email_status, sms_status } = await req.json();

  await db.notificationTemplate.update({
    where: { id },
    data: { subject, email_body, sms_body, email_status, sms_status },
  });

  return NextResponse.json({ success: true, message: 'Template updated successfully' });
}
