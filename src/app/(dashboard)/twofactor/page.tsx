'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Shield, ShieldCheck, ShieldOff, Smartphone, Key, Info } from 'lucide-react';

export default function TwoFactorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [data, setData] = useState<{ secret: string; uri: string; enabled: boolean } | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/user/twofactor')
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .finally(() => setFetching(false));
  }, []);

  const showMsg = (type: string, text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  const handleEnable = async () => {
    if (!data || !code || code.length !== 6) {
      showMsg('error', 'Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/user/twofactor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enable', secret: data.secret, code }),
    });
    const result = await res.json();
    showMsg(result.success ? 'success' : 'error', result.message);
    setLoading(false);
    if (result.success) { setCode(''); setTimeout(() => router.refresh(), 1500); }
  };

  const handleDisable = async () => {
    if (!code || code.length !== 6) {
      showMsg('error', 'Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/user/twofactor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disable', code }),
    });
    const result = await res.json();
    showMsg(result.success ? 'success' : 'error', result.message);
    setLoading(false);
    if (result.success) { setCode(''); setTimeout(() => router.refresh(), 1500); }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-center py-12 text-gray-500">Failed to load 2FA settings</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <p className="mt-1 text-sm text-gray-500">Add an extra layer of security to your account (optional)</p>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Status Card */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.enabled ? 'bg-emerald-50' : 'bg-gray-100'}`}>
              {data.enabled ? <ShieldCheck size={28} className="text-emerald-600" /> : <ShieldOff size={28} className="text-gray-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {data.enabled ? '2FA is Active' : '2FA is Disabled'}
                </h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${data.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {data.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {data.enabled
                  ? 'Your account is protected with two-factor authentication.'
                  : 'Two-factor authentication is not enabled. You can enable it anytime for extra security.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Two-factor authentication is completely optional.</p>
          <p className="text-xs text-blue-600 mt-1">
            When enabled, you&apos;ll need to enter a code from your authenticator app each time you perform sensitive actions. 
            You can disable it anytime.
          </p>
        </div>
      </div>

      {data.enabled ? (
        /* Disable Section */
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-4">
              <Key size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">Disable 2FA</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Enter the 6-digit code from your authenticator app to disable two-factor authentication.
            </p>
            <div className="max-w-xs space-y-3">
              <Input
                id="code"
                label="Verification Code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <button
                onClick={handleDisable}
                disabled={loading || code.length !== 6}
                className="w-full px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Enable Section */
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-5">
              <Smartphone size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Setup Two-Factor Authentication</h3>
            </div>

            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                <p className="text-sm font-medium text-gray-700">Scan QR Code</p>
              </div>
              <p className="text-xs text-gray-500 ml-8 mb-3">
                Open Google Authenticator, Microsoft Authenticator, or any TOTP app and scan this QR code:
              </p>
              <div className="ml-8 p-4 bg-white border border-gray-200 rounded-xl inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.uri)}`}
                  alt="2FA QR Code"
                  width={180}
                  height={180}
                  className="rounded"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                <p className="text-sm font-medium text-gray-700">Or enter this key manually</p>
              </div>
              <div className="ml-8">
                <code className="block p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono break-all select-all">
                  {data.secret}
                </code>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
                <p className="text-sm font-medium text-gray-700">Enter verification code</p>
              </div>
              <p className="text-xs text-gray-500 ml-8 mb-3">
                Enter the 6-digit code shown in your authenticator app:
              </p>
              <div className="ml-8 max-w-xs space-y-3">
                <Input
                  id="code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <Button onClick={handleEnable} loading={loading} disabled={code.length !== 6} className="w-full">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
