import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { requirePermission } from '@/lib/rbac';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deposit_id, action, custom_amount } = body;

  if (!deposit_id || !action) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const permission = action === 'approve' ? 'deposits.approve' : 'deposits.reject';
  const guard = await requirePermission(permission);
  if (!guard.authorized) return guard.response;

  try {
    const deposit = await db.deposit.findUnique({ where: { id: deposit_id } });
    if (!deposit || deposit.status !== 2) {
      return NextResponse.json({ success: false, message: 'Deposit not found or already processed' }, { status: 400 });
    }

    if (action === 'approve') {
      const approvedAmount = custom_amount && Number(custom_amount) > 0 ? Number(custom_amount) : deposit.amount;

      // Step 1: Mark deposit approved
      await db.deposit.update({ where: { id: deposit_id }, data: { status: 1, amount: approvedAmount } });

      // Step 2: Credit user balance
      await db.user.update({
        where: { id: deposit.user_id },
        data: { balance: { increment: approvedAmount } },
      });

      // Step 3: Fetch updated balance for post_balance record
      const user = await db.user.findUnique({ where: { id: deposit.user_id }, select: { balance: true } });

      // Step 4: Create transaction record — if this fails, rollback balance
      try {
        await db.transaction.create({
          data: {
            user_id: deposit.user_id,
            amount: approvedAmount,
            post_balance: user!.balance,
            charge: deposit.charge,
            trx_type: '+',
            details: 'Deposit approved',
            trx: deposit.trx || generateTrx(),
            remark: 'deposit',
          },
        });
      } catch (txErr) {
        // Rollback: deduct balance and revert deposit status
        await db.user.update({ where: { id: deposit.user_id }, data: { balance: { decrement: approvedAmount } } });
        await db.deposit.update({ where: { id: deposit_id }, data: { status: 2 } });
        throw txErr;
      }
    } else {
      await db.deposit.update({ where: { id: deposit_id }, data: { status: 3 } });
    }

    // Send notification (non-blocking)
    const updatedDeposit = await db.deposit.findUnique({ where: { id: deposit_id }, include: { user: { select: { balance: true } } } });
    if (updatedDeposit) {
      const detail = typeof updatedDeposit.detail === 'string' ? JSON.parse(updatedDeposit.detail) : updatedDeposit.detail as any;
      const templateName = action === 'approve' ? 'Deposit - Manual - Approved' : 'Deposit - Manual - Rejected';
      sendNotification({
        userId: updatedDeposit.user_id,
        templateName,
        variables: {
          amount: String(updatedDeposit.amount),
          trx: updatedDeposit.trx || '',
          charge: String(updatedDeposit.charge || 0),
          rate: String(updatedDeposit.rate || 1),
          method_name: detail?.gateway_name || '',
          method_currency: updatedDeposit.method_currency || 'USD',
          method_amount: String(updatedDeposit.final_amo || updatedDeposit.amount),
          site_currency: 'USDT',
          post_balance: String(updatedDeposit.user?.balance || 0),
        },
        title: action === 'approve' ? `Deposit of $${updatedDeposit.amount} approved` : `Deposit of $${updatedDeposit.amount} rejected`,
      });
    }

    return NextResponse.json({ success: true, message: `Deposit ${action}d successfully` });
  } catch (error: any) {
    console.error('Deposit action error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Action failed' }, { status: 500 });
  }
}
