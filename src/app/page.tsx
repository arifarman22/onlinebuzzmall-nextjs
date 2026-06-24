import Link from 'next/link';
import {
  ArrowRight, Shield, Users, TrendingUp, Globe, Wallet,
  Star, CheckCircle, CreditCard, Lock, Layers,
  HeadphonesIcon, BarChart3, Smartphone,
} from 'lucide-react';
import LandingStats from '@/components/LandingStats';
import ScrollReveal from '@/components/ScrollReveal';
import { getBranding } from '@/lib/branding';

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Full-time earner', text: 'I started 3 months ago and now earn more than my previous full-time job. The platform is incredibly reliable.' },
  { name: 'Michael R.', role: 'Team leader', text: 'The referral system is amazing. My team of 50+ members generates passive income daily. Best decision I made.' },
  { name: 'Amina J.', role: 'Part-time user', text: 'Even doing this part-time, I earn a significant side income. Withdrawals are fast and customer support is great.' },
] as const;

export default async function HomePage() {
  const { logo, footerLogo, siteName } = await getBranding();
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 py-4">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            {logo ? (
              <img src={logo} alt={siteName} className="h-9 max-w-[160px] object-contain" />
            ) : (
              <>
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-lg font-semibold tracking-tight text-white">{siteName}</span>
              </>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium text-slate-300 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[13px] font-medium rounded-full hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-20 lg:pt-32 pb-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400 mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Trusted by 10,000+ users worldwide
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight">
              The Smartest Way to
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Earn Online
              </span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
              Complete product orders, build your referral network, and earn daily commissions. Your financial growth starts here.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <Link href="/register" className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-full hover:from-emerald-600 hover:to-cyan-600 shadow-xl shadow-emerald-500/25 transition-all">
                Start Earning Now
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/login" className="px-7 py-3.5 border border-slate-700 text-slate-300 text-sm font-medium rounded-full hover:bg-slate-800 hover:border-slate-600 transition-all">
                Sign In to Dashboard
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 flex-wrap text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield size={13} className="text-emerald-400" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-emerald-400" />
                <span>Verified Platform</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe size={13} className="text-emerald-400" />
                <span>Available Worldwide</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/40">
              <img
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=500&fit=crop&q=80"
                alt="Crypto Trading"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
                <div className="px-4 py-2.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl text-xs font-medium text-white flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  +24.5% This Week
                </div>
                <div className="px-4 py-2.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl text-xs font-medium text-white flex items-center gap-2">
                  <Wallet size={14} className="text-cyan-400" />
                  $2.4M Earned
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 p-3 bg-slate-900 rounded-xl shadow-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Star size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Daily Profit</p>
                  <p className="text-xs font-bold text-white">$127.50</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <LandingStats />
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Everything You Need to Succeed</h2>
            <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">Powerful tools designed to maximize your earning potential.</p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: TrendingUp, title: 'Daily Profit Orders', desc: 'Complete assigned product orders and earn guaranteed commissions every day.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Users, title: 'Multi-Level Referrals', desc: 'Build your team and earn from multiple levels with our binary tree system.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { icon: CreditCard, title: 'Instant Withdrawals', desc: 'Withdraw earnings anytime via crypto, bank transfer, or mobile payments.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Lock, title: 'Bank-Grade Security', desc: '2FA authentication, encrypted data, and secure payment processing.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Layers, title: 'Crypto Payments', desc: 'Deposit and withdraw using Bitcoin, Ethereum, USDT, and more.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Dedicated customer service team available around the clock.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
          ].map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 100}>
              <div className="group p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 hover:bg-slate-900 transition-all h-full">
                <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={18} className={feature.color} />
                </div>
                <h3 className="text-[15px] font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-[13px] text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white">How It Works</h2>
            <p className="mt-3 text-sm text-slate-400">Start earning in 3 simple steps</p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Create Account', desc: 'Sign up for free and complete your profile in under 2 minutes.', icon: Smartphone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { step: '02', title: 'Choose a Plan', desc: 'Select an investment plan that matches your goals and deposit funds.', icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { step: '03', title: 'Start Earning', desc: 'Complete daily orders, refer friends, and watch your balance grow.', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          ].map((item, i) => (
            <ScrollReveal key={item.step} delay={i * 150} direction="up">
              <div className="relative p-7 bg-slate-900/50 border border-slate-800 rounded-2xl h-full hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center`}>
                    <item.icon size={16} className={item.color} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">Step {item.step}</span>
                </div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[13px] text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white">What Our Users Say</h2>
            <p className="mt-3 text-sm text-slate-400">Real results from real people</p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 120}>
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl h-full hover:border-slate-700 transition-all">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[13px] text-slate-300 leading-relaxed">{t.text}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 lg:px-12 py-20">
        <ScrollReveal direction="up">
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to Start Earning?</h2>
              <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
                Join thousands of users already growing their income. Create your free account today.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 mt-7 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-full hover:from-emerald-600 hover:to-cyan-600 shadow-xl shadow-emerald-500/20 transition-all">
                Create Free Account
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {footerLogo || logo ? (
              <img src={footerLogo || logo} alt={siteName} className="h-7 max-w-[130px] object-contain" />
            ) : (
              <>
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white">{siteName}</span>
              </>
            )}
          </Link>
          <div className="flex items-center gap-6 text-[12px] font-medium text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/support" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
          <div className="text-[12px] text-slate-500">
            © {new Date().getFullYear()} OnlineBuzz Mall. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
