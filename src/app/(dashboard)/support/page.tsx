import { auth } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { Send, MessageCircle, Headphones } from 'lucide-react';
import Link from 'next/link';

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [header, telegram, whatsapp, livechat] = await Promise.all([
    getSetting('support_header', 'Need Help? Contact Us'),
    getSetting('support_telegram'),
    getSetting('support_whatsapp'),
    getSetting('support_livechat'),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">{header}</h2>
        <p className="text-xs text-slate-500 mt-1">Choose your preferred way to reach us</p>
      </div>

      <div className="space-y-3">
        {telegram && (
          <a href={telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/30 transition-all group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send size={22} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Telegram</p>
              <p className="text-xs text-slate-500 mt-0.5">Chat with us on Telegram</p>
            </div>
            <span className="text-xs text-blue-400 font-medium">Open →</span>
          </a>
        )}

        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-slate-900 rounded-xl border border-slate-800 hover:border-green-500/30 transition-all group">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageCircle size={22} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">WhatsApp</p>
              <p className="text-xs text-slate-500 mt-0.5">Message us on WhatsApp</p>
            </div>
            <span className="text-xs text-green-400 font-medium">Open →</span>
          </a>
        )}

        {livechat && (
          <a href={livechat} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-all group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Headphones size={22} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Live Chat</p>
              <p className="text-xs text-slate-500 mt-0.5">Start a live chat session</p>
            </div>
            <span className="text-xs text-purple-400 font-medium">Open →</span>
          </a>
        )}

        {!telegram && !whatsapp && !livechat && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 py-12 text-center">
            <Headphones size={32} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">Support channels are not configured yet.</p>
            <p className="text-xs text-slate-600 mt-1">Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
