import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  const impToken = req.cookies.get('imp_token')?.value;
  if (!impToken || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ impersonating: false });
  }
  try {
    const decoded = jwt.verify(impToken, process.env.NEXTAUTH_SECRET) as any;
    return NextResponse.json({ impersonating: decoded.type === 'impersonate' });
  } catch {
    return NextResponse.json({ impersonating: false });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('imp_token', '', { maxAge: 0, path: '/' });
  return res;
}
