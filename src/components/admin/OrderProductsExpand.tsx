'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Package, X } from 'lucide-react';

interface Product {
  name: string;
  quantity: number;
  price: number;
  image: string | null;
}

interface Props {
  orderId: number;
  products: Product[];
}

export default function OrderProductsExpand({ orderId, products }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 320),
      });
    }
    setOpen(true);
  };

  if (products.length === 0) return <span className="text-xs text-gray-400">—</span>;

  const dropdown = open && mounted ? createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className="absolute z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
        style={{ top: pos.top, left: pos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product Details</p>
          <button onClick={() => setOpen(false)} className="p-0.5 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-white">
              <th className="text-left py-2 px-4 font-medium text-gray-500">Name</th>
              <th className="text-center py-2 px-3 font-medium text-gray-500">Qty</th>
              <th className="text-right py-2 px-4 font-medium text-gray-500">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    {p.image ? (
                      <img
                        src={p.image.startsWith('http') ? p.image : `/${p.image}`}
                        alt={p.name}
                        className="w-7 h-7 rounded object-cover border border-gray-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package size={10} className="text-gray-400" />
                      </div>
                    )}
                    <span className="font-medium text-gray-800 leading-tight">{p.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center text-gray-600 font-medium">{p.quantity}</td>
                <td className="py-2.5 px-4 text-right font-semibold text-gray-900">${p.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 border-t border-indigo-100">
              <td colSpan={2} className="py-2.5 px-4 text-xs font-semibold text-gray-600">Total</td>
              <td className="py-2.5 px-4 text-right text-xs font-bold text-indigo-600">
                ${products.reduce((s, p) => s + p.price * p.quantity, 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-xs font-medium rounded-lg transition-colors"
      >
        <Package size={12} />
        {products.length} item{products.length > 1 ? 's' : ''}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {dropdown}
    </div>
  );
}
