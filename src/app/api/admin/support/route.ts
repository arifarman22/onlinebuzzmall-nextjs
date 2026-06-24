import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminSupportSchema } from '@/lib/validations';
import { requirePermission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = adminSupportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { ticket_id, message, action } = parsed.data;

  if (action === 'reply') {
    const guard = await requirePermission('support.reply');
    if (!guard.authorized) return guard.response;

    if (!message) return NextResponse.json({ success: false, message: 'Message required' }, { status: 400 });
    await db.supportMessage.create({ data: { support_ticket_id: ticket_id, admin_id: guard.adminId, message } });
    await db.supportTicket.update({ where: { id: ticket_id }, data: { status: 1, last_reply: new Date() } });
    return NextResponse.json({ success: true, message: 'Reply sent' });
  }

  if (action === 'close') {
    const guard = await requirePermission('support.close');
    if (!guard.authorized) return guard.response;

    await db.supportTicket.update({ where: { id: ticket_id }, data: { status: 3 } });
    return NextResponse.json({ success: true, message: 'Ticket closed' });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
