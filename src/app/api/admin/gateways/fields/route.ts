import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const gatewayId = Number(req.nextUrl.searchParams.get('gateway_id'));
  if (!gatewayId) return NextResponse.json({ success: false, message: 'gateway_id required' }, { status: 400 });

  const fields = await db.gatewayField.findMany({
    where: { gateway_id: gatewayId },
    orderBy: { sort_order: 'asc' },
  });

  return NextResponse.json({ success: true, data: fields });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { gateway_id, label, field_name, placeholder, type, options, required, validation, default_value, sort_order } = await req.json();

  if (!gateway_id || !label || !field_name) {
    return NextResponse.json({ success: false, message: 'gateway_id, label, and field_name are required' }, { status: 400 });
  }

  const field = await db.gatewayField.create({
    data: {
      gateway_id,
      label,
      field_name: field_name.toLowerCase().replace(/\s+/g, '_'),
      placeholder: placeholder || null,
      type: type || 'text',
      options: options || null,
      required: required ?? 1,
      validation: validation || null,
      default_value: default_value || null,
      sort_order: sort_order || 0,
    },
  });

  return NextResponse.json({ success: true, message: 'Field added', data: field });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ success: false, message: 'Field ID required' }, { status: 400 });

  await db.gatewayField.update({ where: { id }, data });
  return NextResponse.json({ success: true, message: 'Field updated' });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ success: false, message: 'Field ID required' }, { status: 400 });

  await db.gatewayField.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Field deleted' });
}
