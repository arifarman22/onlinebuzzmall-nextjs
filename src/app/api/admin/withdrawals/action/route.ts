import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminWithdrawalActionSchema } from '@/lib/validations';
import { requirePermission } from '@/lib/rbac';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = adminWithdrawalActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { withdrawal_id, action, user_id, amount } = parsed.data;

  const permission = action === 'approve' ? 'withdrawals.approve' : 'withdrawals.reject';
  const guard = await requirePermission(permission);
  if (!guard.authorized) return guard.response;

  try {
    await db.$transaction(async (tx: any) => {
      const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawal_id } });
      if (!withdrawal || withdrawal.status !== 2) {
        throw new Error('Not found or already processed');
      }

      if (action === 'approve') {
        await tx.withdrawal.update({ where: { id: withdrawal_id }, data: { status: 1 } });
      } else {
        await tx.withdrawal.update({ where: { id: withdrawal_id }, data: { status: 3 } });
        await tx.user.update({
          where: { id: user_id },
          data: { balance: { increment: amount } },
        });
      }
    });

    // Send notification
    const templateName = action === 'approve' ? 'Withdraw - Approved' : 'Withdraw - Rejected';
    sendNotification({
      userId: user_id,
      templateName,
      variables: { amount: String(amount) },
      title: action === 'approve' ? `Withdrawal of $${amount} approved` : `Withdrawal of $${amount} rejected`,
    });

    return NextResponse.json({ success: true, message: `Withdrawal ${action}d successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Action failed' }, { status: 400 });
  }
}
