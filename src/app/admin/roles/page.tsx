'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface Permission {
  id: number;
  name: string;
  slug: string;
  group: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions: { permission: Permission }[];
  _count: { admins: number };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', permissions: [] as string[] });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  async function fetchRoles() {
    const res = await fetch('/api/admin/roles');
    const data = await res.json();
    if (data.success) setRoles(data.data);
    setLoading(false);
  }

  async function fetchPermissions() {
    const res = await fetch('/api/admin/roles?action=permissions');
    const data = await res.json();
    if (data.success) setPermissions(data.data.permissions);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) {
      setShowCreate(false);
      setForm({ name: '', slug: '', description: '', permissions: [] });
      fetchRoles();
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;
    const res = await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingRole.id, ...form }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) {
      setEditingRole(null);
      fetchRoles();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure?')) return;
    const res = await fetch('/api/admin/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) fetchRoles();
  }

  function startEdit(role: Role) {
    setEditingRole(role);
    setShowCreate(false);
    setForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions.map((rp) => rp.permission.slug),
    });
  }

  function togglePermission(slug: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(slug)
        ? prev.permissions.filter((p) => p !== slug)
        : [...prev.permissions, slug],
    }));
  }

  // Group permissions by group
  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <Button onClick={() => { setShowCreate(true); setEditingRole(null); setForm({ name: '', slug: '', description: '', permissions: [] }); }}>
          Create Role
        </Button>
      </div>

      {message && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {message}
        </div>
      )}

      {/* Roles List */}
      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-500">{role.description || 'No description'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {role.permissions.length} permissions · {role._count.admins} admin(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  {role.slug !== 'super-admin' && (
                    <>
                      <Button onClick={() => startEdit(role)} className="text-xs px-3 py-1">
                        Edit
                      </Button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {role.slug === 'super-admin' && (
                    <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg">Full Access</span>
                  )}
                </div>
              </div>
              {role.slug !== 'super-admin' && role.permissions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {role.permissions.map((rp) => (
                    <span key={rp.permission.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {rp.permission.slug}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit Form */}
      {(showCreate || editingRole) && (
        <Card>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingRole ? `Edit: ${editingRole.name}` : 'Create New Role'}
            </h3>
            <form onSubmit={editingRole ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                    disabled={!!editingRole}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Permissions Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {Object.entries(grouped).map(([group, perms]) => (
                    <div key={group}>
                      <h4 className="text-sm font-semibold text-gray-800 capitalize mb-2">{group.replace(/_/g, ' ')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((perm) => (
                          <label key={perm.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(perm.slug)}
                              onChange={() => togglePermission(perm.slug)}
                              className="rounded border-gray-300 text-indigo-600"
                            />
                            <span className="text-gray-700">{perm.slug.split('.')[1]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingRole ? 'Update Role' : 'Create Role'}</Button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setEditingRole(null); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
