import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const profileSchema = z.object({
  firstname: z.string().min(1).max(50).transform((v) => v.replace(/<[^>]*>/g, '').trim()),
  lastname: z.string().min(1).max(50).transform((v) => v.replace(/<[^>]*>/g, '').trim()),
  mobile: z.string().max(20).optional().default(''),
  country_code: z.string().max(5).optional().default(''),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, `profile:${session.user.id}`);
  const rl = rateLimit(rlKey, 10, 60 * 1000);
  if (!rl.success) return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });

  const userId = Number(session.user.id);
  const body = await req.json();

  // Handle remove image
  if (body.remove_image) {
    await db.user.update({ where: { id: userId }, data: { image: null } });
    return NextResponse.json({ success: true, message: 'Profile photo removed' });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { firstname, lastname, mobile, country_code } = parsed.data;

  await db.user.update({
    where: { id: userId },
    data: { firstname, lastname, mobile: mobile || null, country_code: country_code || null },
  });

  return NextResponse.json({ success: true, message: 'Profile updated successfully' });
}
