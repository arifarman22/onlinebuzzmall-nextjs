import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { adminUserActionSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

const MODERATOR_ACTIONS = ['toggle_status', 'adjust_balance', 'freeze_balance', 'change_order_limit'];
const SUPER_ADMIN_ACTIONS = ['change_password', 'change_withdrawal_password', 'delete_user'];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const roleSlug = (session.user as any).roleSlug || 'super-admin';
  const body = await req.json();
  const parsed = adminUserActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { action, user_id } = parsed.data;

  // Role-based action restriction
  if (roleSlug === 'support') {
    return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
  }
  if (roleSlug === 'moderator' && SUPER_ADMIN_ACTIONS.includes(action)) {
    return NextResponse.json({ success: false, message: 'Only Super Admin can perform this action' }, { status: 403 });
  }

  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  switch (action) {
    case 'toggle_status': {
      const newStatus = user.status === 1 ? 0 : 1;
      await db.user.update({ where: { id: user_id }, data: { status: newStatus } });
      return NextResponse.json({ success: true, message: `User ${newStatus === 0 ? 'banned' : 'unbanned'} successfully` });
    }

    case 'adjust_balance': {
      const { amount, type, remark } = parsed.data;
      if (!amount || amount <= 0 || !type) {
        return NextResponse.json({ success: false, message: 'Invalid amount or type' }, { status: 400 });
      }

      if (type === 'sub' && user.balance < amount) {
        return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
      }

      const newBalance = type === 'add' ? user.balance + amount : user.balance - amount;
      await db.user.update({ where: { id: user_id }, data: { balance: newBalance } });

      await db.transaction.create({
        data: {
          user_id,
          amount,
          post_balance: newBalance,
          charge: 0,
          trx_type: type === 'add' ? '+' : '-',
          details: remark || `Balance ${type === 'add' ? 'added' : 'subtracted'} by admin`,
          trx: generateTrx(),
          remark: 'admin_balance_adjust',
        },
      });
      return NextResponse.json({ success: true, message: `Balance ${type === 'add' ? 'added' : 'subtracted'} successfully` });
    }

    case 'freeze_balance': {
      const { amount } = parsed.data;
      if (amount === undefined || amount < 0) {
        return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
      }
      await db.user.update({ where: { id: user_id }, data: { freeze_amount: amount } });
      return NextResponse.json({ success: true, message: 'Freeze amount updated' });
    }

    case 'change_password': {
      const { password } = parsed.data;
      if (!password) return NextResponse.json({ success: false, message: 'Password required' }, { status: 400 });
      const hashed = await bcrypt.hash(password, 12);
      await db.user.update({ where: { id: user_id }, data: { password: hashed } });
      return NextResponse.json({ success: true, message: 'Login password changed successfully' });
    }

    case 'change_withdrawal_password': {
      const { withdrawal_password } = parsed.data;
      if (withdrawal_password === undefined) return NextResponse.json({ success: false, message: 'Withdrawal password required' }, { status: 400 });
      const hashedWp = withdrawal_password ? await bcrypt.hash(withdrawal_password, 12) : null;
      await db.user.update({ where: { id: user_id }, data: { withdrawal_password: hashedWp } });
      return NextResponse.json({ success: true, message: 'Withdrawal password updated successfully' });
    }

    case 'change_order_limit': {
      const { daily_order_limit } = parsed.data;
      if (daily_order_limit === undefined) return NextResponse.json({ success: false, message: 'Order limit required' }, { status: 400 });
      await db.user.update({ where: { id: user_id }, data: { daily_order_limit } });
      return NextResponse.json({ success: true, message: `Daily order limit updated to ${daily_order_limit}` });
    }

    case 'delete_user': {
      await db.user.update({ where: { id: user_id }, data: { status: -1 } });
      return NextResponse.json({ success: true, message: 'User deleted successfully' });
    }

    default:
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  }
}
