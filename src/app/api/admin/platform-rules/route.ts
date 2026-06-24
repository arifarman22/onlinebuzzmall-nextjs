import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rules = await db.platformRules.findMany({ orderBy: { sort_order: 'asc' } });
  return NextResponse.json({ success: true, data: rules });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, content, image, sort_order, status } = body;

  const rule = await db.platformRules.create({
    data: {
      title: title || '',
      description: description || '',
      content: content || null,
      image: image || null,
      sort_order: sort_order ?? 0,
      status: status ?? 1,
    },
  });

  return NextResponse.json({ success: true, data: rule });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, description, content, image, sort_order, status } = body;

  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (content !== undefined) data.content = content;
  if (image !== undefined) data.image = image;
  if (sort_order !== undefined) data.sort_order = sort_order;
  if (status !== undefined) data.status = status;

  const rule = await db.platformRules.update({ where: { id }, data });

  return NextResponse.json({ success: true, data: rule });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));

  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

  await db.platformRules.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Deleted' });
}
