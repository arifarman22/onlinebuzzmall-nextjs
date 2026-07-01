'use client';

import { useState } from 'react';
import { Send, MessageCircle, Headphones, Mail, BookOpen, ChevronDown, Wallet, ArrowDownCircle, ShoppingBag } from 'lucide-react';

const helpItems = [
  {
    title: 'About Recharge',
    icon: Wallet,
    color: '#3b82f6',
    content: [
      'You can top up your account in the "Profile" interface. Click the "Deposit" button, enter the assignee\'s name and the amount needed, and then proceed with transferring to the account provided by the platform.',
      'Please be sure to submit a screenshot of the successful transaction to ensure that your recharge is received quickly.',
      'Double-check the USDT wallet address you entered before topping up. The platform may change the wallet address details from time to time, so stay updated.',
    ],
  },
  {
    title: 'About Withdrawals',
    icon: ArrowDownCircle,
    color: '#22c55e',
    content: [
      'To apply for a withdrawal, you must complete 25 orders first.',
      'Please head to the "Profile" interface during working hours and click the withdrawal button.',
      'Your funds will be transferred to your USDT wallet within 1 hour after you apply.',
    ],
  },
  {
    title: 'About Grabbing Orders',
    icon: ShoppingBag,
    color: '#a855f7',
    content: [
      'Once your account balance reaches the minimum of 20 USDT, you can start grabbing orders.',
      'Each person can grab up to 25 orders per day.',
      'You need to complete your tasks as soon as possible (before 23:59) so you can start the next 25 tasks the following day.',
    ],
  },
];

interface Props {
  header: string;
  telegram: string;
  whatsapp: string;
  livechat: string;
  email: string;
}

export default function SupportClient({ header, telegram, whatsapp, livechat, email }: Props) {
  const [openHelp, setOpenHelp] = useState<number | null>(null);

  const channels = [
    telegram && { href: telegram, label: 'Telegram', desc: 'Chat with us on Telegram', icon: Send, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', badge: 'Fast response' },
    whatsapp && { href: whatsapp, label: 'WhatsApp', desc: 'Message us on WhatsApp', icon: MessageCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', badge: 'Available 24/7' },
    livechat && { href: livechat, label: 'Live Chat', desc: 'Start a live chat session', icon: Headphones, color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', badge: 'Instant support' },
    email && { href: `mailto:${email}`, label: 'Email Us', desc: email, icon: Mail, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', badge: 'Reply within 24h' },
  ].filter(Boolean) as { href: string; label: string; desc: string; icon: any; color: string; bg: string; border: string; badge: string }[];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #6366f1 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-5">
          <div className="flex-shrink-0 hidden sm:block">
            <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="44" r="44" fill="rgba(99,102,241,0.12)" />
              <circle cx="44" cy="44" r="30" fill="rgba(99,102,241,0.15)" />
              <path d="M27 43c0-9.4 7.6-17 17-17s17 7.6 17 17" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <rect x="23" y="43" width="7" height="11" rx="3.5" fill="#6366f1"/>
              <rect x="58" y="43" width="7" height="11" rx="3.5" fill="#6366f1"/>
              <path d="M44 57v5M40 62h8" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
              <rect x="49" y="21" width="18" height="12" rx="4" fill="#4f46e5" opacity="0.7"/>
              <path d="M51 27h14M51 30h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <circle cx="21" cy="29" r="2" fill="#818cf8" opacity="0.5"/>
              <circle cx="69" cy="37" r="1.5" fill="#a5b4fc" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{header}</h2>
            <p className="text-sm text-slate-400 mt-1">Our support team is ready to assist you. Choose a channel below.</p>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Support Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Channels */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target={ch.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: ch.bg, borderColor: ch.border }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: `${ch.color}20` }}>
                <ch.icon size={20} style={{ color: ch.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{ch.label}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{ch.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${ch.color}20`, color: ch.color }}>{ch.badge}</span>
                <span className="text-xs font-medium" style={{ color: ch.color }}>Open →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Help Accordion */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
          <BookOpen size={16} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Help & Instructions</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {helpItems.map((item, i) => {
            const isOpen = openHelp === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenHelp(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-800/50"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                    <item.icon size={15} style={{ color: item.color }} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-200">
                    <span className="text-[10px] font-mono mr-2" style={{ color: item.color }}>0{i + 1}</span>
                    {item.title}
                  </span>
                  <ChevronDown
                    size={15}
                    className="text-slate-500 flex-shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 space-y-3" style={{ background: 'rgba(15,23,42,0.5)' }}>
                    {item.content.map((line, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <p className="text-sm text-slate-400 leading-relaxed">{line}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-600 pb-2">
        We typically respond within a few hours. Thank you for your patience.
      </p>
    </div>
  );
}
