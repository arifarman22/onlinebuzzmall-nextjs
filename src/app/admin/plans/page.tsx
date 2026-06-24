import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatAmount } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import PlanFormModal from '@/components/admin/PlanFormModal';

export default async function AdminPlansPage() {
  const plans = await db.plan.findMany({ orderBy: { id: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Plans</h2>
        <PlanFormModal />
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Price</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">BV</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Ref Com</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Tree Com</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 px-3 font-medium">{p.name}</td>
                    <td className="py-3 px-3">{formatAmount(p.price)}</td>
                    <td className="py-3 px-3">{p.bv}</td>
                    <td className="py-3 px-3">{formatAmount(p.ref_com)}</td>
                    <td className="py-3 px-3">{formatAmount(p.tree_com)}</td>
                    <td className="py-3 px-3"><Badge variant={p.status === 1 ? 'success' : 'danger'}>{p.status === 1 ? 'Active' : 'Inactive'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
