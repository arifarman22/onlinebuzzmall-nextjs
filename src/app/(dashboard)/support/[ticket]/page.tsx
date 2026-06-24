import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import TicketReplyForm from '@/components/dashboard/TicketReplyForm';

export default async function TicketDetailPage({ params }: { params: { ticket: string } }) {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const ticket = await db.supportTicket.findFirst({
    where: { ticket: params.ticket, user_id: userId },
    include: { messages: { orderBy: { id: 'asc' } } },
  });

  if (!ticket) return notFound();

  const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
    0: { label: 'Open', variant: 'info' },
    1: { label: 'Answered', variant: 'success' },
    2: { label: 'Replied', variant: 'warning' },
    3: { label: 'Closed', variant: 'default' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{ticket.subject}</h2>
          <p className="text-sm text-gray-500">Ticket #{ticket.ticket}</p>
        </div>
        <Badge variant={statusMap[ticket.status]?.variant || 'default'}>{statusMap[ticket.status]?.label}</Badge>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {ticket.messages.map((msg) => (
              <div key={msg.id} className={`p-4 rounded-lg ${msg.admin_id ? 'bg-indigo-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-600">{msg.admin_id ? '🛡️ Support' : '👤 You'}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(msg.created_at)}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {ticket.status !== 3 && <TicketReplyForm ticketId={ticket.id} />}
    </div>
  );
}
