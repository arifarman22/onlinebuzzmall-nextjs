'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function PlanPurchaseButton({ planId, planPrice, userBalance }: { planId: number; planPrice: number; userBalance: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const canAfford = userBalance >= planPrice;

  const handlePurchase = async () => {
    if (!confirm('Are you sure you want to purchase this plan?')) return;
    setLoading(true);
    const res = await fetch('/api/user/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: planId }) });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert('Plan purchased successfully!');
      router.refresh();
    } else {
      alert(data.message);
    }
  };

  return (
    <Button onClick={handlePurchase} loading={loading} disabled={!canAfford} className="w-full">
      {canAfford ? 'Purchase' : 'Insufficient Balance'}
    </Button>
  );
}
