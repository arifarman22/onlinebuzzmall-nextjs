import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAdmin() {
  const session = await auth();
  return session?.user && (session.user as any).role === 'admin';
}

export async function GET(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get('id'));
  const page = await db.page.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: page });
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { name, slug } = await req.json();
  if (!name || !slug) return NextResponse.json({ success: false, message: 'Name and slug required' }, { status: 400 });

  await db.page.create({ data: { name, slug, secs: '[]' } });
  return NextResponse.json({ success: true, message: 'Page created' });
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id, name, slug, secs } = await req.json();
  await db.page.update({ where: { id }, data: { name, slug, secs } });
  return NextResponse.json({ success: true, message: 'Page updated' });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await db.page.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Page deleted' });
}
