'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, Save, Key, User, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function AdminProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [avatar, setAvatar] = useState(user?.image || '');
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'profile');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) { alert(data.message || 'Upload failed'); return; }

      const imageUrl = data.data.path;
      const saveRes = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_image', image: imageUrl }),
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        setAvatar(imageUrl);
        await update({ image: imageUrl });
      } else {
        alert(saveData.message || 'Failed to save avatar');
      }
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const handleNameSave = async () => {
    if (!name.trim()) return;
    setNameSaving(true);
    const res = await fetch('/api/admin/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_name', name }),
    });
    const data = await res.json();
    if (data.success) {
      await update({ name });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } else {
      alert(data.message);
    }
    setNameSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || newPw.length < 6) {
      setPwMsg('New password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    setPwMsg('');
    const res = await fetch('/api/admin/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_password', current_password: currentPw, new_password: newPw }),
    });
    const data = await res.json();
    setPwMsg(data.message);
    if (data.success) { setCurrentPw(''); setNewPw(''); }
    setPwSaving(false);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Update your admin account details</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="py-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Profile Picture</p>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-indigo-200">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-indigo-400" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-2 text-xs text-indigo-600 hover:underline disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Change photo'}
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }}
          />
        </CardContent>
      </Card>

      {/* Name */}
      <Card>
        <CardContent className="py-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Display Name</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-gray-50"
              placeholder="Your name"
            />
            <button
              onClick={handleNameSave}
              disabled={nameSaving || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {nameSaved ? 'Saved!' : nameSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardContent className="py-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Change Password</p>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-gray-50"
              />
              <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-gray-50"
              />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pwMsg && (
              <p className={`text-xs ${pwMsg.includes('success') || pwMsg.includes('changed') ? 'text-emerald-600' : 'text-red-500'}`}>{pwMsg}</p>
            )}
            <button
              onClick={handlePasswordChange}
              disabled={pwSaving || !currentPw || !newPw}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Key size={14} />
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
