import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function getApiUserId(req: NextRequest): Promise<number | null> {
  // 1. Try NextAuth session
  const session = await auth();
  if (session?.user?.id && (session.user as any).role === 'user') {
    return Number(session.user.id);
  }

  // 2. Fall back to imp_token cookie
  const impToken = req.cookies.get('imp_token')?.value;
  if (!impToken || !process.env.NEXTAUTH_SECRET) return null;

  try {
    const decoded = jwt.verify(impToken, process.env.NEXTAUTH_SECRET) as any;
    if (decoded.type === 'impersonate') return Number(decoded.userId);
  } catch {}

  return null;
}
