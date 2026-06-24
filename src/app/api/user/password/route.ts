import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { passwordChangeSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, `password:${session.user.id}`);
  const rl = rateLimit(rlKey, 5, 15 * 60 * 1000); // 5 per 15 min
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many attempts' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const body = await req.json();
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { current_password, new_password } = parsed.data;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  const isValid = await bcrypt.compare(current_password, user.password);
  if (!isValid) {
    return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 });
  }

  const isSame = await bcrypt.compare(new_password, user.password);
  if (isSame) {
    return NextResponse.json({ success: false, message: 'New password must be different from current password' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(new_password, 12);
  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true, message: 'Password changed successfully' });
}
