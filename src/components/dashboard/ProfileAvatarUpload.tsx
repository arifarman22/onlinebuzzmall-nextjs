'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Camera, Loader2, Eye, X, Trash2 } from 'lucide-react';

interface Props {
  user: { image: string | null; firstname: string | null; lastname: string | null; username: string };
}

export default function ProfileAvatarUpload({ user }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [currentImage, setCurrentImage] = useState(user.image);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowMenu(false);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'profile');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setCurrentImage(data.data.path);
        router.refresh();
      }
    } catch {}
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDelete = async () => {
    setShowMenu(false);
    setUploading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remove_image: true }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentImage(null);
        router.refresh();
      }
    } catch {}
    setUploading(false);
  };

  return (
    <>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-600 to-cyan-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={uploading}
                className="relative w-20 h-20 bg-slate-900 rounded-2xl border-4 border-slate-900 shadow-lg flex items-center justify-center overflow-hidden group cursor-pointer"
              >
                {currentImage ? (
                  <img src={currentImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <User size={32} className="text-slate-500" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 z-50 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    {currentImage && (
                      <button
                        onClick={() => { setShowMenu(false); setShowPhoto(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        <Eye size={15} className="text-slate-400" /> View Photo
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); inputRef.current?.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <Camera size={15} className="text-slate-400" /> Change Photo
                    </button>
                    {currentImage && (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                      >
                        <Trash2 size={15} className="text-red-400" /> Delete Photo
                      </button>
                    )}
                  </div>
                </>
              )}
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
            <div className="flex-1 pt-2">
              <h3 className="text-xl font-bold text-white">{user.firstname} {user.lastname}</h3>
              <p className="text-sm text-slate-400">@{user.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Photo Modal */}
      {showPhoto && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowPhoto(false)}>
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPhoto(false)} className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white">
              <X size={20} />
            </button>
            <img src={currentImage} alt="Profile" className="w-full rounded-2xl object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
    </>
  );
}
