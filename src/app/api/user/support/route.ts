import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { supportTicketSchema, supportReplySchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `support:${session.user.id}`);
  const rl = rateLimit(rlKey, 5, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = supportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { subject, message, priority } = parsed.data;

  const ticket = await db.supportTicket.create({
    data: {
      user_id: userId,
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      ticket: generateTrx(6),
      subject,
      status: 0,
      priority: priority || 2,
      last_reply: new Date(),
    },
  });

  await db.supportMessage.create({
    data: { support_ticket_id: ticket.id, message },
  });

  return NextResponse.json({ success: true, message: 'Ticket created successfully' });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = supportReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { ticket_id, message } = parsed.data;

  const ticket = await db.supportTicket.findUnique({ where: { id: ticket_id } });
  if (!ticket || ticket.user_id !== Number(session.user.id)) {
    return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
  }

  await db.supportMessage.create({ data: { support_ticket_id: ticket_id, message } });
  await db.supportTicket.update({ where: { id: ticket_id }, data: { status: 2, last_reply: new Date() } });

  return NextResponse.json({ success: true, message: 'Reply sent' });
}
