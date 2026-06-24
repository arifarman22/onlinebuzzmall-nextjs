import { db } from '@/lib/db';
import OrderSetForm from '@/components/admin/OrderSetForm';

export default async function CreateOrderSetPage() {
  const platforms = await db.platform.findMany({ where: { status: 1 } });
  const userRanks = await db.userRankSetting.findMany({ where: { status: 1 } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Order Set</h2>
      <OrderSetForm platforms={platforms} userRanks={userRanks} />
    </div>
  );
}
