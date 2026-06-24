import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// One-time seed: creates first user (root) without referral
// Only works when NO users exist AND requires CRON_SECRET for protection
export async function POST(req: NextRequest) {
  try {
    // Require secret header to prevent abuse
    const secret = req.headers.get('x-seed-secret') || '';
    const expectedSecret = process.env.CRON_SECRET || '';
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const userCount = await db.user.count();
    if (userCount > 0) {
      return NextResponse.json({ message: 'Seed not allowed. Users already exist.' }, { status: 403 });
    }

    const body = await req.json();
    const { username, email, password, firstname, lastname } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'username, email, password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        firstname: firstname || 'Admin',
        lastname: lastname || 'User',
        username: username.trim().slice(0, 30),
        email: email.trim().toLowerCase().slice(0, 100),
        password: hashedPassword,
        ref_by: null,
        pos_id: null,
        position: null,
        status: 1,
        ev: 1,
        sv: 1,
        profile_complete: 1,
      },
    });

    await db.userExtra.create({
      data: { user_id: user.id },
    });

    return NextResponse.json({
      message: 'Root user created successfully',
      data: { id: user.id, username: user.username, referral_code: user.username },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}
