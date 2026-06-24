'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function AdminTicketReply({ ticketId }: { ticketId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReply = async () => {
    if (!message.trim()) return;
    setLoading(true);
    await fetch('/api/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: ticketId, message, action: 'reply' }) });
    setMessage('');
    setLoading(false);
    router.refresh();
  };

  const handleClose = async () => {
    setLoading(true);
    await fetch('/api/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: ticketId, action: 'close' }) });
    setLoading(false);
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type admin reply..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 min-h-[100px]" />
        <div className="flex gap-2">
          <Button onClick={handleReply} loading={loading}>Reply</Button>
          <Button variant="danger" onClick={handleClose}>Close Ticket</Button>
        </div>
      </CardContent>
    </Card>
  );
}
