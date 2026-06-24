import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const admin = await db.admin.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    if (!admin.reset_code || admin.reset_code !== code) {
      return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });
    }

    // Check expiry (15 minutes)
    if (admin.reset_code_at) {
      const diff = Date.now() - new Date(admin.reset_code_at).getTime();
      if (diff > 15 * 60 * 1000) {
        return NextResponse.json({ success: false, message: 'Verification code expired. Please request a new one.' }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    await db.admin.update({
      where: { id: admin.id },
      data: { password: hashed, reset_code: null, reset_code_at: null },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
