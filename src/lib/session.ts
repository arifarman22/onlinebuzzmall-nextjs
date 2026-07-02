import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export interface ResolvedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  impersonatedBy?: number;
}

export async function getSessionUser(): Promise<ResolvedUser | null> {
  // 1. Try NextAuth session first
  const session = await auth();
  if (session?.user && (session.user as any).role === 'user') {
    return {
      id: (session.user as any).id,
      name: session.user.name || '',
      email: session.user.email || '',
      image: session.user.image || null,
      role: 'user',
      impersonatedBy: (session.user as any).impersonatedBy,
    };
  }

  // 2. Fall back to imp_token cookie
  const cookieStore = await cookies();
  const impToken = cookieStore.get('imp_token')?.value;
  if (!impToken || !process.env.NEXTAUTH_SECRET) return null;

  try {
    const decoded = jwt.verify(impToken, process.env.NEXTAUTH_SECRET) as any;
    if (decoded.type !== 'impersonate') return null;

    const user = await db.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.status === 0 || user.status === -1) return null;

    return {
      id: String(user.id),
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      image: user.image,
      role: 'user',
      impersonatedBy: decoded.adminId,
    };
  } catch {
    return null;
  }
}
