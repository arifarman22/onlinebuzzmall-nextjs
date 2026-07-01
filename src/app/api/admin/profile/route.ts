import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const adminId = Number((session.user as any).id);
  const body = await req.json();
  const { action } = body;

  if (action === 'update_image') {
    const { image } = body;
    if (!image) return NextResponse.json({ success: false, message: 'Image URL required' }, { status: 400 });
    await db.admin.update({ where: { id: adminId }, data: { image } });
    return NextResponse.json({ success: true, message: 'Avatar updated' });
  }

  if (action === 'update_name') {
    const { name } = body;
    if (!name?.trim()) return NextResponse.json({ success: false, message: 'Name required' }, { status: 400 });
    await db.admin.update({ where: { id: adminId }, data: { name: name.trim() } });
    return NextResponse.json({ success: true, message: 'Name updated' });
  }

  if (action === 'change_password') {
    const { current_password, new_password } = body;
    if (!current_password || !new_password || new_password.length < 6) {
      return NextResponse.json({ success: false, message: 'Invalid password data' }, { status: 400 });
    }
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    if (!admin) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    const valid = await bcrypt.compare(current_password, admin.password);
    if (!valid) return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 });
    const hashed = await bcrypt.hash(new_password, 12);
    await db.admin.update({ where: { id: adminId }, data: { password: hashed } });
    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
