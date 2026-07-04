'use client';

import { useState } from 'react';
import { Link2, Wallet } from 'lucide-react';
import CopyButton from './CopyButton';

interface Props {
  referralLink: string;
  walletAddress: string;
  walletCurrency: string;
}

export default function ReferralWalletTabs({ referralLink, walletAddress, walletCurrency }: Props) {
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
          <Wallet size={13} /> Wallet Address
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
        <div>
          {walletAddress ? (
            <>
              {walletCurrency && (
                <p className="text-xs text-slate-400 mb-2">
                  <span className="text-slate-500">Currency: </span>
                  <span className="text-emerald-400 font-semibold">{walletCurrency}</span>
                </p>
              )}
              <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <input type="text" readOnly value={walletAddress} className="flex-1 bg-transparent text-xs text-slate-300 outline-none truncate font-mono" />
                <CopyButton text={walletAddress} />
              </div>
              <p className="text-xs text-slate-500 mt-2">Your last used withdrawal wallet address.</p>
            </>
          ) : (
            <div className="text-center py-4">
              <Wallet size={24} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No wallet address found.</p>
              <p className="text-xs text-slate-600 mt-1">Submit a withdrawal to save your wallet address.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
