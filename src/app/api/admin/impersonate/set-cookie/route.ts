import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, message: 'Token required' }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.json({ success: false }, { status: 500 });

  try {
    const decoded = jwt.verify(token, secret) as any;
    if (decoded.type !== 'impersonate') throw new Error('invalid type');

    const res = NextResponse.json({ success: true, userId: decoded.userId });
    res.cookies.set('imp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
}
