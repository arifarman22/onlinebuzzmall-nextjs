import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import {
  User, Mail, Phone, Globe, Calendar, Shield, CheckCircle, AlertCircle, Key, Lock,
} from 'lucide-react';
import ProfileForm from '@/components/dashboard/ProfileForm';
import LogoutButton from '@/components/dashboard/LogoutButton';
import ProfileAvatarUpload from '@/components/dashboard/ProfileAvatarUpload';

export default async function ProfilePage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const statuses = [
    { label: 'Email', verified: user.ev === 1, action: user.ev !== 1 ? '/verify-otp' : undefined },
    { label: 'KYC', verified: user.kv === 1, action: user.kv === 0 ? '/kyc' : undefined },
    { label: '2FA', verified: user.ts === 1, action: '/twofactor' },
    { label: 'Account', verified: user.status === 1 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile & Security</h2>
        <p className="mt-1 text-sm text-slate-400">Manage your account information and security settings</p>
      </div>

      {/* Profile Header Card */}
      <ProfileAvatarUpload user={{ image: user.image, firstname: user.firstname, lastname: user.lastname, username: user.username }} />

      {/* Security Status */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Security Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statuses.map((s) => (
            <div key={s.label} className={`p-3 rounded-xl border ${s.verified ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
              <div className="flex items-center gap-2 mb-1">
                {s.verified ? <CheckCircle size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-amber-400" />}
                <span className="text-xs font-medium text-slate-300">{s.label}</span>
              </div>
              <p className={`text-xs ${s.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {s.verified ? 'Verified' : 'Not verified'}
              </p>
            </div>
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
