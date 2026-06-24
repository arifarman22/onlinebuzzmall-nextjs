'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Copy, CheckCircle } from 'lucide-react';
import { formatAmount } from '@/lib/utils';

interface Props {
  referralLink: string;
  totalReferrals: number;
  totalRefCom: number;
}

export default function ReferralCard({ referralLink, totalReferrals, totalRefCom }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
            <Users size={14} className="text-violet-600" />
          </div>
          <h3 className="text-[13px] font-semibold text-gray-900">Referral Program</h3>
        </div>
        <Link href="/invite" className="text-[11px] text-indigo-600 font-medium hover:underline">View All</Link>
      </div>
      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
        <input type="text" readOnly value={referralLink} className="flex-1 bg-transparent text-[11px] text-gray-600 outline-none truncate font-mono" />
        <button onClick={handleCopy} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors" title="Copy">
          {copied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} className="text-gray-500" />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-lg font-bold text-gray-900">{totalReferrals}</p>
          <p className="text-[10px] text-gray-400 font-medium">Total Referrals</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-lg font-bold text-emerald-600">{formatAmount(totalRefCom)}</p>
          <p className="text-[10px] text-gray-400 font-medium">Ref Earnings</p>
        </div>
      </div>
    </div>
  );
}
