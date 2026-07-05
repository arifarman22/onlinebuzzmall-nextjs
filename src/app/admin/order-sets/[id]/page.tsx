'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, Edit2, X, Layers, ArrowLeft, Package, Upload } from 'lucide-react';

interface Order {
  id: number;
  type: string | null;
  profit: number;
  status: number;
  orderDetails: { id: number; product: { id: number; name: string; price: number }; price: number; quantity: number }[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  platform_id: number;
}

interface Platform {
  id: number;
  name: string;
}

interface OrderSet {
  id: number;
  name: string | null;
  platform_id: number | null;
  platform?: Platform | null;
  orders: Order[];
}

export default function ManageOrderSetPage() {
  const params = useParams();
  const router = useRouter();
  const orderSetId = Number(params.id);

  const [orderSet, setOrderSet] = useState<OrderSet | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({ name: '', platform_id: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Modals
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showComboOrder, setShowComboOrder] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  // Inline profit edit
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingProfit, setEditingProfit] = useState('');

  // Edit order modal
  const [editOrderModal, setEditOrderModal] = useState<Order | null>(null);
  const [editOrderForm, setEditOrderForm] = useState<{ profit: string; platform_id: string; type: string; products: { product_id: string; quantity: string; price: string }[] }>({ profit: '', platform_id: '', type: 'single', products: [] });

  // Add Order form
  const [orderForm, setOrderForm] = useState({ platform_id: '', product_id: '', profit: '5', price: 0, quantity: '1' });

  // Combo Order form
  const [comboForm, setComboForm] = useState({ platform_id: '', profit: '5', products: [{ product_id: '' }] as { product_id: string }[] });

  const showMessage = (type: string, text: string) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [osRes, platRes, prodRes] = await Promise.all([
        fetch(`/api/admin/order-sets/manage?id=${orderSetId}`),
        fetch('/api/admin/order-sets/platforms'),
        fetch('/api/admin/order-sets/products'),
      ]);
      const osData = await osRes.json();
      const platData = await platRes.json();
      const prodData = await prodRes.json();

      if (osData.success) {
        setOrderSet(osData.data);
        setEditForm({ name: osData.data.name || '', platform_id: String(osData.data.platform_id || '') });
      }
      if (platData.success) setPlatforms(platData.data);
      if (prodData.success) setProducts(prodData.data);
    } catch {}
    setLoading(false);
  }, [orderSetId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Update order set name/platform
  const handleUpdateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/order-sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderSetId, name: editForm.name, platform_id: Number(editForm.platform_id) }),
      });
      const data = await res.json();
      if (data.success) showMessage('success', 'Updated');
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed'); }
    setSaving(false);
  };

  // Add single order
  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.product_id || !orderForm.profit) { showMessage('error', 'All fields required'); return; }
    const profitNum = orderForm.profit === '' ? 0 : Number(orderForm.profit);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/order-sets/add-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_set_id: orderSetId,
          product_ids: [Number(orderForm.product_id)],
          profit_percent: profitNum,
          type: 'single',
        }),
      });
      const data = await res.json();
      if (data.success) { showMessage('success', 'Order added'); setShowAddOrder(false); setOrderForm({ platform_id: '', product_id: '', profit: '5', price: 0, quantity: '1' }); fetchData(); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed'); }
    setSaving(false);
  };

  // Add combo order
  const handleAddCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    const productIds = comboForm.products.map((p) => Number(p.product_id)).filter(Boolean);
    if (productIds.length === 0) { showMessage('error', 'Add at least one product'); return; }
    const comboProfitNum = comboForm.profit === '' ? 0 : Number(comboForm.profit);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/order-sets/add-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_set_id: orderSetId,
          product_ids: productIds,
          profit_percent: comboProfitNum,
          type: 'combo',
        }),
      });
      const data = await res.json();
      if (data.success) { showMessage('success', 'Combo order added'); setShowComboOrder(false); setComboForm({ platform_id: '', profit: '5', products: [{ product_id: '' }] }); fetchData(); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed'); }
    setSaving(false);
  };

  // Inline profit save
  const handleSaveProfit = async (orderId: number) => {
    const profit = parseFloat(editingProfit);
    if (isNaN(profit)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/order-sets/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, profit }),
      });
      const data = await res.json();
      if (data.success) { setEditingOrderId(null); fetchData(); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed'); }
    setSaving(false);
  };

  // Edit order save
  const handleEditOrderSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrderModal) return;
    const productIds = editOrderForm.products.map((p) => Number(p.product_id)).filter(Boolean);
    if (productIds.length === 0) { showMessage('error', 'Select at least one product'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/order-sets/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: editOrderModal.id,
          profit: Number(editOrderForm.profit),
          type: editOrderForm.type,
          product_ids: productIds,
          quantities: editOrderForm.products.filter((p) => p.product_id).map((p) => Number(p.quantity) || 1),
          prices: editOrderForm.products.filter((p) => p.product_id).map((p) => Number(p.price) || 0),
        }),
      });
      const data = await res.json();
      if (data.success) { setEditOrderModal(null); fetchData(); showMessage('success', 'Order updated'); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed'); }
    setSaving(false);
  };

  // Delete order
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Delete this order?')) return;
    try {
      const res = await fetch('/api/admin/order-sets/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.message);
    } catch {}
  };

  // Calculations for Add Order
  const selectedProduct = products.find((p) => p.id === Number(orderForm.product_id));
  const qtyNum = orderForm.quantity === '' ? 0 : Number(orderForm.quantity);
  const profitPctNum = orderForm.profit === '' ? 0 : Number(orderForm.profit);
  const orderAmount = (selectedProduct?.price || orderForm.price) * qtyNum;
  const profitAmount = orderAmount * (profitPctNum / 100);
  const expectedIncome = orderAmount + profitAmount;

  // Filter products by selected platform
  const filteredProducts = orderForm.platform_id ? products.filter((p) => p.platform_id === Number(orderForm.platform_id)) : products;
  const comboFilteredProducts = comboForm.platform_id ? products.filter((p) => p.platform_id === Number(comboForm.platform_id)) : products;

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!orderSet) return <div className="text-center py-20 text-gray-500">Order set not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/order-sets')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} className="text-gray-500" /></button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage: {orderSet.name}</h2>
          <p className="text-sm text-gray-500">{orderSet.platform?.name || 'No platform'} · {orderSet.orders.length} orders</p>
        </div>
      </div>

      {msg.text && <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}

      {/* Edit Order Set */}
      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleUpdateSet} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Platform</label>
              <select value={editForm.platform_id} onChange={(e) => setEditForm({ ...editForm, platform_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select...</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
          </form>
        </CardContent>
      </Card>

      {/* Order List */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Order List</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowCsvUpload(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">
            <Upload size={13} /> Upload CSV
          </button>
          <button onClick={() => setShowComboOrder(true)} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700">
            <Layers size={13} /> Add Combo Order
          </button>
          <button onClick={() => setShowAddOrder(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">
            <Plus size={13} /> Add Order
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="py-0 px-0">
          {orderSet.orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Package size={28} className="mx-auto mb-2 text-gray-200" /><p className="text-sm">No orders yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">SR</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Order Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Profit %</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Profit Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderSet.orders.map((order, i) => {
                    const totalPrice = order.orderDetails.reduce((s, d) => s + d.price * d.quantity, 0);
                    const profitAmt = totalPrice * (order.profit / 100);
                    const productNames = order.orderDetails.map((d) => d.product.name).join(', ');
                    return (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${order.type === 'combo' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                            {order.type === 'combo' ? 'Combo' : 'Single'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <div className="space-y-0.5">
                            {order.orderDetails.map((d, di) => (
                              <div key={di} className="text-xs">
                                <span className="text-gray-800 font-medium">{d.product.name}</span>
                                <span className="text-gray-400 ml-1">${d.price} × {d.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">${totalPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-indigo-600">
                          {editingOrderId === order.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" step="0.01" autoFocus
                                value={editingProfit}
                                onChange={(e) => setEditingProfit(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveProfit(order.id); if (e.key === 'Escape') setEditingOrderId(null); }}
                                className="w-16 px-1.5 py-0.5 border border-indigo-400 rounded text-xs focus:outline-none"
                              />
                              <button onClick={() => handleSaveProfit(order.id)} disabled={saving} className="text-xs text-emerald-600 font-medium hover:underline">Save</button>
                              <button onClick={() => setEditingOrderId(null)} className="text-xs text-gray-400 hover:underline">✕</button>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1 cursor-pointer group" onClick={() => { setEditingOrderId(order.id); setEditingProfit(String(order.profit)); }}>
                              {order.profit}%
                              <Edit2 size={11} className="text-gray-300 group-hover:text-indigo-400" />
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-emerald-600">${profitAmt.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold">${(totalPrice + profitAmt).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs rounded ${order.status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {order.status === 1 ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditOrderModal(order);
                                setEditOrderForm({
                                  profit: String(order.profit),
                                  platform_id: '',
                                  type: order.type || 'single',
                                  products: order.orderDetails.map((d) => ({ product_id: String(d.product.id), quantity: String(d.quantity), price: String(d.price) })),
                                });
                              }}
                              className="p-1 text-indigo-400 hover:text-indigo-600"
                            ><Edit2 size={13} /></button>
                            <button onClick={() => handleDeleteOrder(order.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Order Modal */}
      {editOrderModal && (
        <Modal title={`Edit Order #${editOrderModal.id}`} onClose={() => setEditOrderModal(null)}>
          <form onSubmit={handleEditOrderSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Type</label>
              <div className="flex gap-2">
                {(['single', 'combo'] as const).map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => setEditOrderForm((f) => ({
                      ...f, type: t,
                      products: t === 'single' ? [f.products[0] || { product_id: '', quantity: '1', price: '' }] : f.products,
                    }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      editOrderForm.type === t
                        ? t === 'combo' ? 'bg-purple-600 text-white border-purple-600' : 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'combo' ? 'Combo' : 'Single'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Profit %</label>
              <input type="number" step="0.01" value={editOrderForm.profit} onChange={(e) => setEditOrderForm({ ...editOrderForm, profit: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Platform (filter products)</label>
              <select value={editOrderForm.platform_id} onChange={(e) => setEditOrderForm({ ...editOrderForm, platform_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500">
                <option value="">All Platforms</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-700">Products</label>
                {editOrderForm.type === 'combo' && (
                  <button type="button" onClick={() => setEditOrderForm({ ...editOrderForm, products: [...editOrderForm.products, { product_id: '', quantity: '1', price: '' }] })} className="text-xs text-indigo-600 hover:underline">+ Add</button>
                )}
              </div>
              <div className="space-y-2">
                {editOrderForm.products.map((ep, idx) => {
                  const filtered = editOrderForm.platform_id ? products.filter((p) => p.platform_id === Number(editOrderForm.platform_id)) : products;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={ep.product_id}
                        onChange={(e) => {
                          const u = [...editOrderForm.products];
                          const prod = products.find((p) => p.id === Number(e.target.value));
                          u[idx] = { ...u[idx], product_id: e.target.value, price: u[idx].price || String(prod?.price ?? '') };
                          setEditOrderForm({ ...editOrderForm, products: u });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Select Product...</option>
                        {filtered.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                      </select>
                      <input type="number" min="0" step="0.01" value={ep.price} onChange={(e) => { const u = [...editOrderForm.products]; u[idx].price = e.target.value; setEditOrderForm({ ...editOrderForm, products: u }); }} className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-indigo-500" placeholder="Price" />
                      <input type="number" min="1" value={ep.quantity} onChange={(e) => { const u = [...editOrderForm.products]; u[idx].quantity = e.target.value; setEditOrderForm({ ...editOrderForm, products: u }); }} className="w-14 px-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-indigo-500" placeholder="Qty" />
                      {editOrderForm.products.length > 1 && (
                        <button type="button" onClick={() => setEditOrderForm({ ...editOrderForm, products: editOrderForm.products.filter((_, i) => i !== idx) })} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Summary */}
            {editOrderForm.products.some((p) => p.product_id) && (() => {
              const total = editOrderForm.products.reduce((s, ep) => {
                const customPrice = Number(ep.price);
                const prod = products.find((p) => p.id === Number(ep.product_id));
                const unitPrice = customPrice > 0 ? customPrice : (prod?.price || 0);
                return s + unitPrice * (Number(ep.quantity) || 1);
              }, 0);
              const profitAmt = total * (Number(editOrderForm.profit) / 100);
              return (
                <div className="p-3 bg-indigo-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-gray-600">Order Amount</span><span className="font-medium">${total.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Profit ({editOrderForm.profit}%)</span><span className="text-emerald-600 font-medium">+${profitAmt.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-indigo-200 pt-1"><span className="font-semibold">Total Income</span><span className="font-bold text-indigo-700">${(total + profitAmt).toFixed(2)}</span></div>
                </div>
              );
            })()}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditOrderModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Order Modal */}
      {showAddOrder && (
        <Modal title="Add Order" onClose={() => setShowAddOrder(false)}>
          <form onSubmit={handleAddOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
              <select value={orderForm.platform_id} onChange={(e) => setOrderForm({ ...orderForm, platform_id: e.target.value, product_id: '' })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500">
                <option value="">All Platforms</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
              <select value={orderForm.product_id} onChange={(e) => { const prod = products.find((p) => p.id === Number(e.target.value)); setOrderForm({ ...orderForm, product_id: e.target.value, price: prod?.price || 0 }); }} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500" required>
                <option value="">Select Product...</option>
                {filteredProducts.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Profit %</label>
                <input type="number" step="0.1" value={orderForm.profit} onChange={(e) => setOrderForm({ ...orderForm, profit: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            {/* Live Calculations */}
            {selectedProduct && (
              <div className="p-3 bg-indigo-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-600">Price</span><span className="font-medium">${selectedProduct.price.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Order Amount</span><span className="font-medium">${orderAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Profit ({orderForm.profit || 0}%)</span><span className="font-medium text-emerald-600">+${profitAmount.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-indigo-200 pt-1.5"><span className="font-semibold text-gray-900">Expected Income</span><span className="font-bold text-indigo-700">${expectedIncome.toFixed(2)}</span></div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddOrder(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Adding...' : 'Add Order'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Upload CSV Modal */}
      {showCsvUpload && (
        <CsvUploadModal
          orderSetId={orderSetId}
          onClose={() => setShowCsvUpload(false)}
          onSuccess={() => { setShowCsvUpload(false); fetchData(); }}
          showMessage={showMessage}
        />
      )}

      {/* Add Combo Order Modal */}
      {showComboOrder && (
        <Modal title="Add Combo Order" onClose={() => setShowComboOrder(false)}>
          <form onSubmit={handleAddCombo} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
              <select value={comboForm.platform_id} onChange={(e) => setComboForm({ ...comboForm, platform_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500">
                <option value="">All Platforms</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Profit %</label>
              <input type="number" step="0.1" value={comboForm.profit} onChange={(e) => setComboForm({ ...comboForm, profit: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500" />
            </div>

            {/* Product Rows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-700">Products</label>
                <button type="button" onClick={() => setComboForm({ ...comboForm, products: [...comboForm.products, { product_id: '' }] })} className="text-xs text-indigo-600 hover:underline">+ Add Product</button>
              </div>
              <div className="space-y-2">
                {comboForm.products.map((cp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                    <select value={cp.product_id} onChange={(e) => { const updated = [...comboForm.products]; updated[idx].product_id = e.target.value; setComboForm({ ...comboForm, products: updated }); }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-indigo-500">
                      <option value="">Select Product...</option>
                      {comboFilteredProducts.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                    </select>
                    {comboForm.products.length > 1 && (
                      <button type="button" onClick={() => setComboForm({ ...comboForm, products: comboForm.products.filter((_, i) => i !== idx) })} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Combo Summary */}
            {comboForm.products.some((p) => p.product_id) && (
              <div className="p-3 bg-purple-50 rounded-xl space-y-1 text-xs">
                <p className="font-medium text-purple-700">Combo Summary</p>
                {comboForm.products.filter((p) => p.product_id).map((cp, i) => {
                  const prod = products.find((p) => p.id === Number(cp.product_id));
                  return prod ? <div key={i} className="flex justify-between"><span>{prod.name}</span><span>${prod.price}</span></div> : null;
                })}
                <div className="border-t border-purple-200 pt-1 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${comboForm.products.reduce((s, cp) => { const p = products.find((pr) => pr.id === Number(cp.product_id)); return s + (p?.price || 0); }, 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowComboOrder(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">{saving ? 'Adding...' : 'Add Combo Order'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// CSV Upload Modal
function CsvUploadModal({ orderSetId, onClose, onSuccess, showMessage }: {
  orderSetId: number; onClose: () => void; onSuccess: () => void;
  showMessage: (type: string, text: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('order_set_id', String(orderSetId));
      const res = await fetch('/api/admin/order-sets/upload-csv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        showMessage('success', data.message);
        if (data.errors) setErrors(data.errors);
        else onSuccess();
      } else {
        showMessage('error', data.message);
      }
    } catch { showMessage('error', 'Upload failed'); }
    setUploading(false);
  };

  return (
    <Modal title="Upload CSV" onClose={onClose}>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required
          />
        </div>
        <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-700">CSV Format:</p>
          <code className="block bg-white p-2 rounded border text-[11px]">product_name,price,profit_percent,type</code>
          <p>• <strong>product_name</strong>: Exact product name (use | for combo: "Product A|Product B")</p>
          <p>• <strong>price</strong>: Optional, overrides product price for single orders</p>
          <p>• <strong>profit_percent</strong>: Commission percentage</p>
          <p>• <strong>type</strong>: "single" or "combo" (auto-detected if omitted)</p>
        </div>
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 rounded-xl text-xs text-red-600 max-h-32 overflow-y-auto space-y-0.5">
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={uploading || !file} className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload & Import'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Reusable Modal
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
