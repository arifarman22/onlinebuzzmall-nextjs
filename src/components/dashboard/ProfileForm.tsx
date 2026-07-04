'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { DarkCard as Card, DarkCardContent as CardContent } from '@/components/ui/DarkCard';
import { User, Lock, Camera, Shield } from 'lucide-react';
import Link from 'next/link';

const COUNTRY_CODES = [
  { code: 'AF', dial: '93', flag: '🇦🇫', name: 'Afghanistan' },
  { code: 'AL', dial: '355', flag: '🇦🇱', name: 'Albania' },
  { code: 'DZ', dial: '213', flag: '🇩🇿', name: 'Algeria' },
  { code: 'AD', dial: '376', flag: '🇦🇩', name: 'Andorra' },
  { code: 'AO', dial: '244', flag: '🇦🇴', name: 'Angola' },
  { code: 'AR', dial: '54', flag: '🇦🇷', name: 'Argentina' },
  { code: 'AM', dial: '374', flag: '🇦🇲', name: 'Armenia' },
  { code: 'AU', dial: '61', flag: '🇦🇺', name: 'Australia' },
  { code: 'AT', dial: '43', flag: '🇦🇹', name: 'Austria' },
  { code: 'AZ', dial: '994', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: 'BH', dial: '973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'BD', dial: '880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'BY', dial: '375', flag: '🇧🇾', name: 'Belarus' },
  { code: 'BE', dial: '32', flag: '🇧🇪', name: 'Belgium' },
  { code: 'BZ', dial: '501', flag: '🇧🇿', name: 'Belize' },
  { code: 'BJ', dial: '229', flag: '🇧🇯', name: 'Benin' },
  { code: 'BT', dial: '975', flag: '🇧🇹', name: 'Bhutan' },
  { code: 'BO', dial: '591', flag: '🇧🇴', name: 'Bolivia' },
  { code: 'BA', dial: '387', flag: '🇧🇦', name: 'Bosnia' },
  { code: 'BW', dial: '267', flag: '🇧🇼', name: 'Botswana' },
  { code: 'BR', dial: '55', flag: '🇧🇷', name: 'Brazil' },
  { code: 'BN', dial: '673', flag: '🇧🇳', name: 'Brunei' },
  { code: 'BG', dial: '359', flag: '🇧🇬', name: 'Bulgaria' },
  { code: 'BF', dial: '226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'BI', dial: '257', flag: '🇧🇮', name: 'Burundi' },
  { code: 'KH', dial: '855', flag: '🇰🇭', name: 'Cambodia' },
  { code: 'CM', dial: '237', flag: '🇨🇲', name: 'Cameroon' },
  { code: 'CA', dial: '1', flag: '🇨🇦', name: 'Canada' },
  { code: 'CV', dial: '238', flag: '🇨🇻', name: 'Cape Verde' },
  { code: 'CF', dial: '236', flag: '🇨🇫', name: 'Central African Rep.' },
  { code: 'TD', dial: '235', flag: '🇹🇩', name: 'Chad' },
  { code: 'CL', dial: '56', flag: '🇨🇱', name: 'Chile' },
  { code: 'CN', dial: '86', flag: '🇨🇳', name: 'China' },
  { code: 'CO', dial: '57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'KM', dial: '269', flag: '🇰🇲', name: 'Comoros' },
  { code: 'CG', dial: '242', flag: '🇨🇬', name: 'Congo' },
  { code: 'CR', dial: '506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: 'HR', dial: '385', flag: '🇭🇷', name: 'Croatia' },
  { code: 'CU', dial: '53', flag: '🇨🇺', name: 'Cuba' },
  { code: 'CY', dial: '357', flag: '🇨🇾', name: 'Cyprus' },
  { code: 'CZ', dial: '420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: 'DK', dial: '45', flag: '🇩🇰', name: 'Denmark' },
  { code: 'DJ', dial: '253', flag: '🇩🇯', name: 'Djibouti' },
  { code: 'DO', dial: '1', flag: '🇩🇴', name: 'Dominican Rep.' },
  { code: 'EC', dial: '593', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'EG', dial: '20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'SV', dial: '503', flag: '🇸🇻', name: 'El Salvador' },
  { code: 'GQ', dial: '240', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: 'ER', dial: '291', flag: '🇪🇷', name: 'Eritrea' },
  { code: 'EE', dial: '372', flag: '🇪🇪', name: 'Estonia' },
  { code: 'ET', dial: '251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: 'FJ', dial: '679', flag: '🇫🇯', name: 'Fiji' },
  { code: 'FI', dial: '358', flag: '🇫🇮', name: 'Finland' },
  { code: 'FR', dial: '33', flag: '🇫🇷', name: 'France' },
  { code: 'GA', dial: '241', flag: '🇬🇦', name: 'Gabon' },
  { code: 'GM', dial: '220', flag: '🇬🇲', name: 'Gambia' },
  { code: 'GE', dial: '995', flag: '🇬🇪', name: 'Georgia' },
  { code: 'DE', dial: '49', flag: '🇩🇪', name: 'Germany' },
  { code: 'GH', dial: '233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'GR', dial: '30', flag: '🇬🇷', name: 'Greece' },
  { code: 'GT', dial: '502', flag: '🇬🇹', name: 'Guatemala' },
  { code: 'GN', dial: '224', flag: '🇬🇳', name: 'Guinea' },
  { code: 'GW', dial: '245', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: 'GY', dial: '592', flag: '🇬🇾', name: 'Guyana' },
  { code: 'HT', dial: '509', flag: '🇭🇹', name: 'Haiti' },
  { code: 'HN', dial: '504', flag: '🇭🇳', name: 'Honduras' },
  { code: 'HK', dial: '852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: 'HU', dial: '36', flag: '🇭🇺', name: 'Hungary' },
  { code: 'IS', dial: '354', flag: '🇮🇸', name: 'Iceland' },
  { code: 'IN', dial: '91', flag: '🇮🇳', name: 'India' },
  { code: 'ID', dial: '62', flag: '🇮🇩', name: 'Indonesia' },
  { code: 'IR', dial: '98', flag: '🇮🇷', name: 'Iran' },
  { code: 'IQ', dial: '964', flag: '🇮🇶', name: 'Iraq' },
  { code: 'IE', dial: '353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'IL', dial: '972', flag: '🇮🇱', name: 'Israel' },
  { code: 'IT', dial: '39', flag: '🇮🇹', name: 'Italy' },
  { code: 'JM', dial: '1', flag: '🇯🇲', name: 'Jamaica' },
  { code: 'JP', dial: '81', flag: '🇯🇵', name: 'Japan' },
  { code: 'JO', dial: '962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'KZ', dial: '7', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: 'KE', dial: '254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'KW', dial: '965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'KG', dial: '996', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: 'LA', dial: '856', flag: '🇱🇦', name: 'Laos' },
  { code: 'LV', dial: '371', flag: '🇱🇻', name: 'Latvia' },
  { code: 'LB', dial: '961', flag: '🇱🇧', name: 'Lebanon' },
  { code: 'LS', dial: '266', flag: '🇱🇸', name: 'Lesotho' },
  { code: 'LR', dial: '231', flag: '🇱🇷', name: 'Liberia' },
  { code: 'LY', dial: '218', flag: '🇱🇾', name: 'Libya' },
  { code: 'LI', dial: '423', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: 'LT', dial: '370', flag: '🇱🇹', name: 'Lithuania' },
  { code: 'LU', dial: '352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: 'MO', dial: '853', flag: '🇲🇴', name: 'Macau' },
  { code: 'MK', dial: '389', flag: '🇲🇰', name: 'Macedonia' },
  { code: 'MG', dial: '261', flag: '🇲🇬', name: 'Madagascar' },
  { code: 'MW', dial: '265', flag: '🇲🇼', name: 'Malawi' },
  { code: 'MY', dial: '60', flag: '🇲🇾', name: 'Malaysia' },
  { code: 'MV', dial: '960', flag: '🇲🇻', name: 'Maldives' },
  { code: 'ML', dial: '223', flag: '🇲🇱', name: 'Mali' },
  { code: 'MT', dial: '356', flag: '🇲🇹', name: 'Malta' },
  { code: 'MR', dial: '222', flag: '🇲🇷', name: 'Mauritania' },
  { code: 'MU', dial: '230', flag: '🇲🇺', name: 'Mauritius' },
  { code: 'MX', dial: '52', flag: '🇲🇽', name: 'Mexico' },
  { code: 'MD', dial: '373', flag: '🇲🇩', name: 'Moldova' },
  { code: 'MC', dial: '377', flag: '🇲🇨', name: 'Monaco' },
  { code: 'MN', dial: '976', flag: '🇲🇳', name: 'Mongolia' },
  { code: 'ME', dial: '382', flag: '🇲🇪', name: 'Montenegro' },
  { code: 'MA', dial: '212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'MZ', dial: '258', flag: '🇲🇿', name: 'Mozambique' },
  { code: 'MM', dial: '95', flag: '🇲🇲', name: 'Myanmar' },
  { code: 'NA', dial: '264', flag: '🇳🇦', name: 'Namibia' },
  { code: 'NP', dial: '977', flag: '🇳🇵', name: 'Nepal' },
  { code: 'NL', dial: '31', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'NZ', dial: '64', flag: '🇳🇿', name: 'New Zealand' },
  { code: 'NI', dial: '505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: 'NE', dial: '227', flag: '🇳🇪', name: 'Niger' },
  { code: 'NG', dial: '234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'NO', dial: '47', flag: '🇳🇴', name: 'Norway' },
  { code: 'OM', dial: '968', flag: '🇴🇲', name: 'Oman' },
  { code: 'PK', dial: '92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'PA', dial: '507', flag: '🇵🇦', name: 'Panama' },
  { code: 'PG', dial: '675', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: 'PY', dial: '595', flag: '🇵🇾', name: 'Paraguay' },
  { code: 'PE', dial: '51', flag: '🇵🇪', name: 'Peru' },
  { code: 'PH', dial: '63', flag: '🇵🇭', name: 'Philippines' },
  { code: 'PL', dial: '48', flag: '🇵🇱', name: 'Poland' },
  { code: 'PT', dial: '351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'QA', dial: '974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'RO', dial: '40', flag: '🇷🇴', name: 'Romania' },
  { code: 'RU', dial: '7', flag: '🇷🇺', name: 'Russia' },
  { code: 'RW', dial: '250', flag: '🇷🇼', name: 'Rwanda' },
  { code: 'SA', dial: '966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'SN', dial: '221', flag: '🇸🇳', name: 'Senegal' },
  { code: 'RS', dial: '381', flag: '🇷🇸', name: 'Serbia' },
  { code: 'SL', dial: '232', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: 'SG', dial: '65', flag: '🇸🇬', name: 'Singapore' },
  { code: 'SK', dial: '421', flag: '🇸🇰', name: 'Slovakia' },
  { code: 'SI', dial: '386', flag: '🇸🇮', name: 'Slovenia' },
  { code: 'SO', dial: '252', flag: '🇸🇴', name: 'Somalia' },
  { code: 'ZA', dial: '27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'SS', dial: '211', flag: '🇸🇸', name: 'South Sudan' },
  { code: 'ES', dial: '34', flag: '🇪🇸', name: 'Spain' },
  { code: 'LK', dial: '94', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: 'SD', dial: '249', flag: '🇸🇩', name: 'Sudan' },
  { code: 'SR', dial: '597', flag: '🇸🇷', name: 'Suriname' },
  { code: 'SZ', dial: '268', flag: '🇸🇿', name: 'Swaziland' },
  { code: 'SE', dial: '46', flag: '🇸🇪', name: 'Sweden' },
  { code: 'CH', dial: '41', flag: '🇨🇭', name: 'Switzerland' },
  { code: 'SY', dial: '963', flag: '🇸🇾', name: 'Syria' },
  { code: 'TW', dial: '886', flag: '🇹🇼', name: 'Taiwan' },
  { code: 'TJ', dial: '992', flag: '🇹🇯', name: 'Tajikistan' },
  { code: 'TZ', dial: '255', flag: '🇹🇿', name: 'Tanzania' },
  { code: 'TH', dial: '66', flag: '🇹🇭', name: 'Thailand' },
  { code: 'TG', dial: '228', flag: '🇹🇬', name: 'Togo' },
  { code: 'TT', dial: '1', flag: '🇹🇹', name: 'Trinidad & Tobago' },
  { code: 'TN', dial: '216', flag: '🇹🇳', name: 'Tunisia' },
  { code: 'TR', dial: '90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'TM', dial: '993', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: 'UG', dial: '256', flag: '🇺🇬', name: 'Uganda' },
  { code: 'UA', dial: '380', flag: '🇺🇦', name: 'Ukraine' },
  { code: 'AE', dial: '971', flag: '🇦🇪', name: 'UAE' },
  { code: 'GB', dial: '44', flag: '🇬🇧', name: 'UK' },
  { code: 'US', dial: '1', flag: '🇺🇸', name: 'USA' },
  { code: 'UY', dial: '598', flag: '🇺🇾', name: 'Uruguay' },
  { code: 'UZ', dial: '998', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: 'VE', dial: '58', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'VN', dial: '84', flag: '🇻🇳', name: 'Vietnam' },
  { code: 'YE', dial: '967', flag: '🇾🇪', name: 'Yemen' },
  { code: 'ZM', dial: '260', flag: '🇿🇲', name: 'Zambia' },
  { code: 'ZW', dial: '263', flag: '🇿🇼', name: 'Zimbabwe' },
];

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
    country_code: user.country_code?.replace(/^\+/, '') || '',
  });

  // Auto-detect country code from IP if not already set
  useEffect(() => {
    if (user.country_code) return;
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((d) => {
        const match = COUNTRY_CODES.find((c) => c.code === d.country_code);
        if (match) setForm((f) => ({ ...f, country_code: match.dial }));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
                    <option value="">Select</option>
                    {COUNTRY_CODES.map((c) => <option key={c.code + c.dial} value={c.dial}>{c.flag} +{c.dial} {c.code}</option>)}
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
