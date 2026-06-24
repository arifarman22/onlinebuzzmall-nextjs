'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface KycField {
  key: string;
  label: string;
  type: string;
  options: string;
  required: number;
}

export default function KycForm() {
  const router = useRouter();
  const [fields, setFields] = useState<KycField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/user/kyc-fields')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        if (data.success) {
          setFields(data.data);
          const defaults: Record<string, string> = {};
          data.data.forEach((f: KycField) => { defaults[f.key] = ''; });
          setValues(defaults);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (key: string, file: File) => {
    setUploading((prev) => ({ ...prev, [key]: true }));
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'kyc');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setValues((prev) => ({ ...prev, [key]: data.data.path }));
      } else {
        setMsg({ type: 'error', text: data.message || 'Upload failed' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Upload failed' });
    }
    setUploading((prev) => ({ ...prev, [key]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      setMsg({ type: data.success ? 'success' : 'error', text: data.message });
      if (data.success) setTimeout(() => router.refresh(), 1500);
    } catch {
      setMsg({ type: 'error', text: 'Submission failed' });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (fields.length === 0) return (
    <Card><CardContent className="py-8 text-center text-gray-400"><p className="text-sm">KYC verification is not available at this time.</p></CardContent></Card>
  );

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Submit KYC Documents</h3>
        </div>

        {msg.text && (
          <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}{field.required === 1 && ' *'}
              </label>

              {field.type === 'file' && (
                <>
                  {values[field.key] ? (
                    <div className="relative">
                      <img src={values[field.key]} alt={field.label} className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                      <button type="button" onClick={() => setValues((prev) => ({ ...prev, [field.key]: '' }))} className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded-lg">Remove</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
                      {uploading[field.key] ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={22} className="text-gray-400" />
                          <p className="text-xs text-gray-500">Click to upload</p>
                          <p className="text-[10px] text-gray-400">JPG, PNG, PDF · Max 5MB</p>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(field.key, f); }} disabled={uploading[field.key]} />
                    </label>
                  )}
                </>
              )}

              {field.type === 'select' && (
                <select
                  value={values[field.key] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-gray-50"
                  required={field.required === 1}
                >
                  <option value="">Select {field.label}...</option>
                  {field.options.split(',').map((opt) => (
                    <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                  ))}
                </select>
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={values[field.key] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-y focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-gray-50"
                  required={field.required === 1}
                />
              )}

              {(field.type === 'text' || field.type === 'email') && (
                <input
                  type={field.type}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-gray-50"
                  required={field.required === 1}
                />
              )}
            </div>
          ))}

          <Button type="submit" loading={submitting} className="w-full py-3">
            Submit for Verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
