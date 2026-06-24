import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatAmount } from '@/lib/utils';
import CommissionLevelForm from '@/components/admin/CommissionLevelForm';

export default async function AdminCommissionsPage() {
  const depositLevels = await db.depositCommissionLevel.findMany({ orderBy: { number: 'asc' } });
  const withdrawLevels = await db.withdrawCommissionLevel.findMany({ orderBy: { number: 'asc' } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Commission Levels</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Deposit Commission</h3>
              <CommissionLevelForm type="deposit" />
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Level</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Personal</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Team</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Group</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Commission %</th>
                </tr>
              </thead>
              <tbody>
                {depositLevels.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-medium">{l.number}</td>
                    <td className="py-2 px-2">{formatAmount(l.personal_investment)}</td>
                    <td className="py-2 px-2">{formatAmount(l.team_deposit)}</td>
                    <td className="py-2 px-2">{formatAmount(l.group_deposit)}</td>
                    <td className="py-2 px-2 text-emerald-600 font-medium">{l.commission_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Withdrawal Commission</h3>
              <CommissionLevelForm type="withdraw" />
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Level</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Personal</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Team</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Group</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Commission %</th>
                </tr>
              </thead>
              <tbody>
                {withdrawLevels.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-medium">{l.number}</td>
                    <td className="py-2 px-2">{formatAmount(l.personal_investment)}</td>
                    <td className="py-2 px-2">{formatAmount(l.team_deposit)}</td>
                    <td className="py-2 px-2">{formatAmount(l.group_deposit)}</td>
                    <td className="py-2 px-2 text-emerald-600 font-medium">{l.commission_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
