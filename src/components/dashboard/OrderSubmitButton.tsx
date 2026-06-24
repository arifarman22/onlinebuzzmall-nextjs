'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface OrderSubmitButtonProps {
  orderId: number;
  price: number;
  userBalance: number;
  freezeAmount: number;
}

export default function OrderSubmitButton({ orderId, price, userBalance, freezeAmount }: OrderSubmitButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const availableBalance = userBalance - freezeAmount;
  const canAfford = availableBalance >= price;

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, price }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Order completed successfully! ✅');
        setTimeout(() => router.refresh(), 1500);
      } else {
        setMessage(data.message || 'Failed to submit order');
      }
    } catch {
      setMessage('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!canAfford && (
        <p className="text-sm text-red-500 mb-2">
          Insufficient balance. You need ${(price - availableBalance).toFixed(2)} more to complete this order.
        </p>
      )}
      {message && (
        <p className={`text-sm mb-2 ${message.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!canAfford}
        className="w-full"
        size="lg"
      >
        Submit Order
      </Button>
    </div>
  );
}
