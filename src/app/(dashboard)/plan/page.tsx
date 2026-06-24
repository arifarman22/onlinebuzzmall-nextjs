import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount } from '@/lib/utils';
import PlanPurchaseButton from '@/components/dashboard/PlanPurchaseButton';

export default async function PlanPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  const plans = await db.plan.findMany({ where: { status: 1 }, orderBy: { price: 'asc' } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Plans</h2>
        <p className="mt-1 text-gray-600">Purchase a plan to activate MLM commissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={user?.plan_id === plan.id ? 'ring-2 ring-indigo-500' : ''}>
            <CardContent className="py-6 text-center space-y-4">
              {user?.plan_id === plan.id && <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Current Plan</span>}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-indigo-600">{formatAmount(plan.price)}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>BV: {plan.bv}</p>
                <p>Referral Commission: {formatAmount(plan.ref_com)}</p>
                <p>Tree Commission: {formatAmount(plan.tree_com)}</p>
              </div>
              {user?.plan_id !== plan.id && (
                <PlanPurchaseButton planId={plan.id} planPrice={plan.price} userBalance={user?.balance || 0} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
