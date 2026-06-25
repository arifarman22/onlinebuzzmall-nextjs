import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import {
  Shield, CheckCircle, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import ProfileForm from '@/components/dashboard/ProfileForm';
import LogoutButton from '@/components/dashboard/LogoutButton';
import ProfileAvatarUpload from '@/components/dashboard/ProfileAvatarUpload';
import CopyButton from '@/components/dashboard/CopyButton';

export default async function ProfilePage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://buzzmallshop.com';
  const referralLink = `${appUrl}/register?ref=${user.id}`;

  const statuses = [
    { label: 'Email', verified: user.ev === 1, href: '/verify-otp' },
    { label: 'KYC', verified: user.kv === 1, href: '/kyc' },
    { label: '2FA', verified: user.ts === 1, href: '/twofactor' },
    { label: 'Account', verified: user.status === 1, href: '/profile' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile & Security</h2>
        <p className="mt-1 text-sm text-slate-400">Manage your account information and security settings</p>
      </div>

      {/* Profile Header Card */}
      <ProfileAvatarUpload user={{ image: user.image, firstname: user.firstname, lastname: user.lastname, username: user.username }} />

      {/* Referral Link */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Your Referral Link</h3>
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <input type="text" readOnly value={referralLink} className="flex-1 bg-transparent text-xs text-slate-300 outline-none truncate font-mono" />
          <CopyButton text={referralLink} />
        </div>
        <p className="text-xs text-slate-500 mt-2">Share this link to invite others and earn referral commissions.</p>
      </div>

      {/* Security Status - Clickable */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Security Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statuses.map((s) => (
            <Link key={s.label} href={s.href} className={`p-3 rounded-xl border transition-colors ${s.verified ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40' : 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'}`}>
              <div className="flex items-center gap-2 mb-1">
                {s.verified ? <CheckCircle size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-amber-400" />}
                <span className="text-xs font-medium text-slate-300">{s.label}</span>
              </div>
              <p className={`text-xs ${s.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {s.verified ? 'Verified' : 'Not verified'}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Edit Profile + Change Password */}
      <ProfileForm
        user={{
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          email: user.email,
          mobile: user.mobile || '',
          country_code: user.country_code || '',
        }}
      />

      {/* Logout */}
      <LogoutButton />
    </div>
  );
}
