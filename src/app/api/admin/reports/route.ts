import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') || 'transactions';
  const page = Number(req.nextUrl.searchParams.get('page')) || 1;
  const limit = Number(req.nextUrl.searchParams.get('limit')) || 20;
  const search = req.nextUrl.searchParams.get('search') || '';
  const filter = req.nextUrl.searchParams.get('filter') || '';
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  const exportFormat = req.nextUrl.searchParams.get('export');

  const skip = (page - 1) * limit;
  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to + 'T23:59:59');

  let data: any[] = [];
  let total = 0;

  switch (type) {
    case 'transactions': {
      const where: any = {};
      if (Object.keys(dateFilter).length) where.created_at = dateFilter;
      if (filter) where.remark = filter;
      if (search) {
        where.OR = [
          { trx: { contains: search } },
          { user: { username: { contains: search } } },
        ];
      }

      [data, total] = await Promise.all([
        db.transaction.findMany({
          where,
          include: { user: { select: { username: true, email: true } } },
          orderBy: { id: 'desc' },
          skip,
          take: limit,
        }),
        db.transaction.count({ where }),
      ]);
      break;
    }

    case 'commissions': {
      const where: any = {};
      if (Object.keys(dateFilter).length) where.created_at = dateFilter;
      if (filter) where.type = filter;
      if (search) {
        where.OR = [
          { details: { contains: search } },
          { user: { username: { contains: search } } },
        ];
      }

      [data, total] = await Promise.all([
        db.commissionTransaction.findMany({
          where,
          include: { user: { select: { username: true } } },
          orderBy: { id: 'desc' },
          skip,
          take: limit,
        }),
        db.commissionTransaction.count({ where }),
      ]);
      break;
    }

    case 'logins': {
      const where: any = {};
      if (Object.keys(dateFilter).length) where.created_at = dateFilter;
      if (search) {
        where.OR = [
          { user: { username: { contains: search } } },
          { user_ip: { contains: search } },
          { country: { contains: search } },
          { city: { contains: search } },
        ];
      }
      if (filter) where.browser = filter;

      [data, total] = await Promise.all([
        db.userLogin.findMany({
          where,
          include: { user: { select: { username: true, email: true } } },
          orderBy: { id: 'desc' },
          skip,
          take: limit,
        }),
        db.userLogin.count({ where }),
      ]);
      break;
    }

    case 'notifications': {
      const where: any = {};
      if (Object.keys(dateFilter).length) where.created_at = dateFilter;
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { message: { contains: search } },
        ];
      }
      if (filter) where.type = filter;

      [data, total] = await Promise.all([
        db.notificationLog.findMany({
          where,
          orderBy: { id: 'desc' },
          skip,
          take: limit,
        }),
        db.notificationLog.count({ where }),
      ]);
      break;
    }
  }

  // Export as CSV
  if (exportFormat === 'csv') {
    const csv = generateCSV(data, type);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-report-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

function generateCSV(data: any[], type: string): string {
  if (!data.length) return '';

  let headers: string[] = [];
  let rows: string[][] = [];

  switch (type) {
    case 'transactions':
      headers = ['ID', 'Username', 'Amount', 'Charge', 'Balance', 'Type', 'TRX', 'Remark', 'Details', 'Date'];
      rows = data.map((t) => [t.id, t.user?.username || '', t.amount, t.charge, t.post_balance, t.trx_type, t.trx || '', t.remark || '', t.details || '', new Date(t.created_at).toISOString()]);
      break;
    case 'commissions':
      headers = ['ID', 'Sponsor', 'Amount', 'Type', 'Details', 'Date'];
      rows = data.map((c) => [c.id, c.user?.username || c.sponsor_id || '', c.amount, c.type || '', c.details || '', new Date(c.created_at).toISOString()]);
      break;
    case 'logins':
      headers = ['ID', 'Username', 'IP', 'Country', 'Country Code', 'City', 'Region', 'ISP', 'Latitude', 'Longitude', 'Browser', 'OS', 'Device Type', 'Date'];
      rows = data.map((l) => [l.id, l.user?.username || '', l.user_ip || '', l.country || '', l.country_code || '', l.city || '', l.region || '', l.isp || '', l.latitude || '', l.longitude || '', l.browser || '', l.os || '', l.device_type || '', new Date(l.created_at).toISOString()]);
      break;
    case 'notifications':
      headers = ['ID', 'User ID', 'Title', 'Type', 'Read', 'Date'];
      rows = data.map((n) => [n.id, n.user_id || '', n.title || '', n.type || '', n.is_read ? 'Yes' : 'No', new Date(n.created_at).toISOString()]);
      break;
  }

  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}
