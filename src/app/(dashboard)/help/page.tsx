import { BookOpen, Wallet, ArrowDownCircle, ShoppingBag, ChevronRight } from 'lucide-react';

const helpItems = [
  {
    number: '01',
    title: 'About Recharge',
    icon: Wallet,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    content: [
      'You can top up your account in the "Profile" interface. Click the "Deposit" button, enter the assignee\'s name and the amount needed, and then proceed with transferring to the account provided by the platform.',
      'Please be sure to submit a screenshot of the successful transaction to ensure that your recharge is received quickly.',
      'Double-check the USDT wallet address you entered before topping up. The platform may change the wallet address details from time to time, so stay updated.',
    ],
  },
  {
    number: '02',
    title: 'About Withdrawals',
    icon: ArrowDownCircle,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    content: [
      'To apply for a withdrawal, you must complete 25 orders first.',
      'Please head to the "Profile" interface during working hours and click the withdrawal button.',
      'Your funds will be transferred to your USDT wallet within 1 hour after you apply.',
    ],
  },
  {
    number: '03',
    title: 'About Grabbing Orders',
    icon: ShoppingBag,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.2)',
    content: [
      'Once your account balance reaches the minimum of 20 USDT, you can start grabbing orders.',
      'Each person can grab up to 25 orders per day.',
      'You need to complete your tasks as soon as possible (before 23:59) so you can start the next 25 tasks the following day.',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #a855f7 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-5">
          {/* SVG Illustration */}
          <div className="flex-shrink-0 hidden sm:block">
            <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="44" r="44" fill="rgba(168,85,247,0.1)" />
              <circle cx="44" cy="44" r="30" fill="rgba(168,85,247,0.12)" />
              {/* Book */}
              <rect x="26" y="28" width="22" height="30" rx="3" fill="#7c3aed" opacity="0.8"/>
              <rect x="28" y="30" width="18" height="26" rx="2" fill="#4c1d95" opacity="0.6"/>
              <path d="M31 36h12M31 40h12M31 44h8" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Question mark page */}
              <rect x="40" y="32" width="22" height="28" rx="3" fill="#6d28d9" opacity="0.9"/>
              <text x="51" y="52" textAnchor="middle" fill="#e9d5ff" fontSize="16" fontWeight="bold" fontFamily="sans-serif">?</text>
              {/* Stars */}
              <circle cx="22" cy="26" r="2" fill="#a78bfa" opacity="0.4"/>
              <circle cx="68" cy="32" r="1.5" fill="#c4b5fd" opacity="0.4"/>
              <circle cx="70" cy="58" r="2" fill="#a78bfa" opacity="0.3"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Help Center</h2>
            <p className="text-sm text-slate-400 mt-1">Everything you need to know about using the platform.</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400">
                <BookOpen size={11} />
                3 Topics
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Items */}
      <div className="space-y-4">
        {helpItems.map((item) => (
          <div
            key={item.number}
            className="rounded-xl border p-5 space-y-4"
            style={{ background: item.bg, borderColor: item.border }}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}25` }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono" style={{ color: item.color }}>{item.number}</span>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                </div>
              </div>
            </div>

            {/* Content bullets */}
            <ul className="space-y-2.5 pl-1">
              {item.content.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <ChevronRight size={13} className="mt-0.5 flex-shrink-0" style={{ color: item.color }} />
                  <p className="text-sm text-slate-300 leading-relaxed">{line}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-600 pb-2">
        Still have questions? Visit our <a href="/support" className="text-violet-400 hover:underline">Support page</a> to contact us.
      </p>
    </div>
  );
}
