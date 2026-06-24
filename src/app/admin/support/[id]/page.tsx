import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import AdminTicketReply from '@/components/admin/AdminTicketReply';

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await db.supportTicket.findUnique({
    where: { id: Number(id) },
    include: { messages: { orderBy: { id: 'asc' } }, user: { select: { username: true, email: true } } },
  });

  if (!ticket) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{ticket.subject}</h2>
          <p className="text-sm text-gray-500">#{ticket.ticket} • {ticket.user?.username} ({ticket.user?.email})</p>
        </div>
        <Badge variant={ticket.status === 3 ? 'default' : 'info'}>{ticket.status === 3 ? 'Closed' : 'Open'}</Badge>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {ticket.messages.map((msg) => (
              <div key={msg.id} className={`p-4 rounded-lg ${msg.admin_id ? 'bg-indigo-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium">{msg.admin_id ? '🛡️ Admin' : '👤 User'}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(msg.created_at)}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {ticket.status !== 3 && <AdminTicketReply ticketId={ticket.id} />}
    </div>
  );
}
