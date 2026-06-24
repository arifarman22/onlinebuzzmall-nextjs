'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { DarkCard as Card, DarkCardContent as CardContent } from '@/components/ui/DarkCard';
import { User, Lock, Camera, Shield } from 'lucide-react';
import Link from 'next/link';

interface ProfileFormProps {
  user: { firstname: string; lastname: string; email: string; mobile: string; country_code: string };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    firstname: user.firstname,
    lastname: user.lastname,
    mobile: user.mobile,
    country_code: user.country_code,
  });
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const showMsg = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    showMsg(data.success ? 'success' : 'error', data.message);
    setLoading(false);
    if (data.success) router.refresh();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) {
      showMsg('error', 'Passwords do not match');
      return;
    }
    setPassLoading(true);
    const res = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: passForm.current_password, new_password: passForm.new_password }),
    });
    const data = await res.json();
    showMsg(data.success ? 'success' : 'error', data.message);
    setPassLoading(false);
    if (data.success) setPassForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    showMsg(data.success ? 'success' : 'error', data.success ? 'Profile picture updated' : data.message);
    setImgLoading(false);
    if (data.success) router.refresh();
  };

  return (
    <div className="space-y-5">
      {message.text && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {/* Edit Profile */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Personal Information</h3>
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="firstname" label="First Name" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} required />
              <Input id="lastname" label="Last Name" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} required />
            </div>
            <Input id="email" label="Email" value={user.email} disabled />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="flex">
                  <select
                    value={form.country_code}
                    onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                    className="rounded-l-lg border border-r-0 border-slate-700 bg-slate-800 px-2 py-2.5 text-sm text-slate-300 outline-none focus:border-emerald-500"
                  >
                    <option value="">+--</option>
                    <option value="1">+1 US</option>
                    <option value="7">+7 RU</option>
                    <option value="33">+33 FR</option>
                    <option value="44">+44 UK</option>
                    <option value="49">+49 DE</option>
                    <option value="55">+55 BR</option>
                    <option value="60">+60 MY</option>
                    <option value="61">+61 AU</option>
                    <option value="62">+62 ID</option>
                    <option value="63">+63 PH</option>
                    <option value="66">+66 TH</option>
                    <option value="81">+81 JP</option>
                    <option value="82">+82 KR</option>
                    <option value="84">+84 VN</option>
                    <option value="86">+86 CN</option>
                    <option value="91">+91 IN</option>
                    <option value="92">+92 PK</option>
                    <option value="234">+234 NG</option>
                    <option value="254">+254 KE</option>
                    <option value="880">+880 BD</option>
                    <option value="971">+971 AE</option>
                  </select>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="flex-1 rounded-r-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input id="current_password" label="Current Password" type="password" value={passForm.current_password} onChange={(e) => setPassForm({ ...passForm, current_password: e.target.value })} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="new_password" label="New Password" type="password" value={passForm.new_password} onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })} required />
              <Input id="confirm_password" label="Confirm Password" type="password" value={passForm.confirm_password} onChange={(e) => setPassForm({ ...passForm, confirm_password: e.target.value })} required />
            </div>
            <Button type="submit" loading={passLoading}>Update Password</Button>
          </form>
        </CardContent>
      </Card>

      {/* 2FA + KYC Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/twofactor" className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Two-Factor Auth</p>
            <p className="text-xs text-slate-500">Secure your account with 2FA</p>
          </div>
        </Link>
        <Link href="/kyc" className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
            <User size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">KYC Verification</p>
            <p className="text-xs text-slate-500">Verify your identity</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
