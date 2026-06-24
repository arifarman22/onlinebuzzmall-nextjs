import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { type, number, personal_investment, team_deposit, group_deposit, commission_percent } = await req.json();

  if (type === 'deposit') {
    await db.depositCommissionLevel.create({ data: { number, personal_investment, team_deposit, group_deposit, commission_percent } });
  } else {
    await db.withdrawCommissionLevel.create({ data: { number, personal_investment, team_deposit, group_deposit, commission_percent } });
  }

  return NextResponse.json({ success: true, message: 'Commission level created' });
}
