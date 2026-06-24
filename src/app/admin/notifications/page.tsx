import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

export default async function AdminNotificationsPage() {
  const templates = await db.notificationTemplate.findMany({ orderBy: { id: 'asc' } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Notification Templates</h2>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Subject</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">SMS</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{t.name}</td>
                    <td className="py-3 px-3 text-gray-600">{t.subject}</td>
                    <td className="py-3 px-3">
                      <Badge variant={t.email_status === 1 ? 'success' : 'danger'}>{t.email_status === 1 ? 'On' : 'Off'}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={t.sms_status === 1 ? 'success' : 'danger'}>{t.sms_status === 1 ? 'On' : 'Off'}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Link href={`/admin/notifications/${t.id}`} className="text-indigo-600 text-xs font-medium">Edit</Link>
                    </td>
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
