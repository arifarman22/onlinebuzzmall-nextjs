import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { adminDepositActionSchema } from '@/lib/validations';
import { requirePermission } from '@/lib/rbac';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = adminDepositActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { deposit_id, action } = parsed.data;

  const permission = action === 'approve' ? 'deposits.approve' : 'deposits.reject';
  const guard = await requirePermission(permission);
  if (!guard.authorized) return guard.response;

  try {
    await db.$transaction(async (tx: any) => {
      const deposit = await tx.deposit.findUnique({ where: { id: deposit_id } });
      if (!deposit || deposit.status !== 2) {
        throw new Error('Deposit not found or already processed');
      }

      if (action === 'approve') {
        await tx.deposit.update({ where: { id: deposit_id }, data: { status: 1 } });

        await tx.user.update({
          where: { id: deposit.user_id },
          data: { balance: { increment: deposit.amount } },
        });

        const user = await tx.user.findUnique({ where: { id: deposit.user_id } });

        await tx.transaction.create({
          data: {
            user_id: deposit.user_id,
            amount: deposit.amount,
            post_balance: user!.balance,
            charge: deposit.charge,
            trx_type: '+',
            details: 'Deposit approved',
            trx: deposit.trx || generateTrx(),
            remark: 'deposit',
          },
        });
      } else {
        await tx.deposit.update({ where: { id: deposit_id }, data: { status: 3 } });
      }
    });

    // Send notification (non-blocking)
    const deposit = await db.deposit.findUnique({ where: { id: deposit_id }, include: { user: { select: { balance: true } } } });
    if (deposit) {
      const detail = typeof deposit.detail === 'string' ? JSON.parse(deposit.detail) : deposit.detail;
      const templateName = action === 'approve' ? 'Deposit - Manual - Approved' : 'Deposit - Manual - Rejected';
      sendNotification({
        userId: deposit.user_id,
        templateName,
        variables: {
          amount: String(deposit.amount),
          trx: deposit.trx || '',
          charge: String(deposit.charge || 0),
          rate: String(deposit.rate || 1),
          method_name: detail?.gateway_name || '',
          method_currency: deposit.method_currency || 'USD',
          method_amount: String(deposit.final_amo || deposit.amount),
          site_currency: 'USDT',
          post_balance: String(deposit.user?.balance || 0),
        },
        title: action === 'approve' ? `Deposit of $${deposit.amount} approved` : `Deposit of $${deposit.amount} rejected`,
      });
    }

    return NextResponse.json({ success: true, message: `Deposit ${action}d successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Action failed' }, { status: 400 });
  }
}
