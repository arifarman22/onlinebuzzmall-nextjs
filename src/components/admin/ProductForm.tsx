'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';

interface Props {
  platforms: any[];
  product?: any;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function ProductForm({ platforms, product }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [imageUrl, setImageUrl] = useState<string>(product?.image || '');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: product?.name || '',
    platform_id: String(product?.platform_id || ''),
    price: String(product?.price || ''),
    quantity: String(product?.quantity || '1'),
    status: String(product?.status ?? '1'),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'product');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.success) {
      setImageUrl(data.data.path);
    } else {
      setMsg({ type: 'error', text: data.message || 'Image upload failed' });
    }
    // reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    const res = await fetch('/api/admin/products', {
      method: product ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        id: product?.id,
        platform_id: Number(form.platform_id),
        price: Number(form.price),
        quantity: Number(form.quantity),
        status: Number(form.status),
        image: imageUrl || '',
      }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
    if (data.success) setTimeout(() => router.push('/admin/products'), 1000);
  };

  return (
    <Card>
      <CardContent className="py-6">
        {msg.text && (
          <div className={`mb-5 p-3 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

          {/* Product Name — full width */}
          <div>
            <label className={labelCls}>Product Name <span className="text-red-500">*</span></label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. USB Cable" className={inputCls} />
          </div>

          {/* Platform + Status — 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Platform <span className="text-red-500">*</span></label>
              <select required value={form.platform_id} onChange={(e) => setForm({ ...form, platform_id: e.target.value })} className={inputCls}>
                <option value="">Select platform</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

          {/* Price + Quantity — 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Price ($) <span className="text-red-500">*</span></label>
              <input type="number" required step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Quantity <span className="text-red-500">*</span></label>
              <input type="number" required min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="1" className={inputCls} />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className={labelCls}>Product Image</label>
            <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              {/* Preview */}
              <div className="shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Product preview" className="w-20 h-20 rounded-lg object-cover border border-gray-200 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-white border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex-1 min-w-0">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                      </span>
                    ) : imageUrl ? 'Change Image' : 'Upload Image'}
                  </button>
                  {imageUrl && (
                    <button type="button" onClick={() => setImageUrl('')} className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP or GIF — max 5MB</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {product ? 'Updating...' : 'Creating...'}
                </span>
              ) : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
