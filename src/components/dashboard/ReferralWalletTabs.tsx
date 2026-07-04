'use client';

import { useState } from 'react';
import { Link2, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';
import CopyButton from './CopyButton';

export default function ReferralWalletTabs({ referralLink }: { referralLink: string }) {
  const [tab, setTab] = useState<'referral' | 'wallet'>('referral');

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => setTab('referral')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${tab === 'referral' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Link2 size={13} /> Referral Link
        </button>
        <button
          onClick={() => setTab('wallet')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${tab === 'wallet' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Wallet size={13} /> Wallet
        </button>
      </div>

      {/* Referral Tab */}
      {tab === 'referral' && (
        <div>
          <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
            <input type="text" readOnly value={referralLink} className="flex-1 bg-transparent text-xs text-slate-300 outline-none truncate font-mono" />
            <CopyButton text={referralLink} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Share this link to invite others and earn referral commissions.</p>
        </div>
      )}

      {/* Wallet Tab */}
      {tab === 'wallet' && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/deposit" className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowDownCircle size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Deposit</p>
              <p className="text-[11px] text-slate-400">Add funds</p>
            </div>
          </Link>
          <Link href="/withdraw" className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-violet-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowUpCircle size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Withdraw</p>
              <p className="text-[11px] text-slate-400">Cash out</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
