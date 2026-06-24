'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Copy, CheckCircle } from 'lucide-react';

interface WalletAddress {
  id: string;
  label: string;
  address: string;
  network: string;
}

export default function WalletActions() {
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: '', address: '', network: 'TRC20' });
  const [copied, setCopied] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('wallet_addresses');
    if (saved) setAddresses(JSON.parse(saved));
  }, []);

  const save = (list: WalletAddress[]) => {
    setAddresses(list);
    localStorage.setItem('wallet_addresses', JSON.stringify(list));
  };

  const handleAdd = () => {
    if (!form.label || !form.address) return;
    const newAddr: WalletAddress = { id: Date.now().toString(), ...form };
    save([...addresses, newAddr]);
    setForm({ label: '', address: '', network: 'TRC20' });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    save(addresses.filter(a => a.id !== id));
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">My Wallet Addresses</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/20 transition-colors">
          <Plus size={11} /> Add
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-4 p-3 bg-slate-800 rounded-lg space-y-2">
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Label (e.g. My BTC Wallet)"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500"
          />
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Wallet address"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500 font-mono"
          />
          <select
            value={form.network}
            onChange={(e) => setForm({ ...form, network: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="TRC20">USDT (TRC20)</option>
            <option value="ERC20">USDT (ERC20)</option>
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="BNB">BNB (BSC)</option>
            <option value="LTC">Litecoin (LTC)</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-medium rounded-lg hover:bg-emerald-700">Save</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-medium rounded-lg hover:bg-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-4">No saved wallet addresses. Add one for quick withdrawals.</p>
      ) : (
        <div className="space-y-2">
          {addresses.map(addr => (
            <div key={addr.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-white">{addr.label}</p>
                  <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded font-medium">{addr.network}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{addr.address}</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => handleCopy(addr.address)} className="p-1.5 text-slate-400 hover:text-white rounded transition-colors">
                  {copied === addr.address ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
