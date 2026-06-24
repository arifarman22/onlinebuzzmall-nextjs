import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import CreatePageForm from '@/components/admin/CreatePageForm';

export default async function AdminPagesPage() {
  const pages = await db.page.findMany({ orderBy: { id: 'asc' } });
  const frontendContent = await db.frontend.findMany({ orderBy: { id: 'desc' }, take: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pages & CMS</h2>
        <CreatePageForm />
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">Pages</h3></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Slug</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Default</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{p.name}</td>
                    <td className="py-3 px-3 text-gray-500 font-mono text-xs">/{p.slug}</td>
                    <td className="py-3 px-3"><Badge variant={p.is_default === 1 ? 'success' : 'default'}>{p.is_default ? 'Yes' : 'No'}</Badge></td>
                    <td className="py-3 px-3"><Link href={`/admin/pages/${p.id}`} className="text-indigo-600 text-xs font-medium">Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">Frontend Content Sections</h3></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Data Key</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Template</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">ID</th>
                </tr>
              </thead>
              <tbody>
                {frontendContent.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50">
                    <td className="py-3 px-3 font-mono text-xs">{f.data_keys}</td>
                    <td className="py-3 px-3 text-gray-500">{f.tempname || '-'}</td>
                    <td className="py-3 px-3 text-gray-500">{f.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
