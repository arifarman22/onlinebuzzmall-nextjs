import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import PlatformForm from '@/components/admin/PlatformForm';

export default async function EditPlatformPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const platform = await db.platform.findUnique({ where: { id: Number(id) } });
  if (!platform) return notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Edit Platform</h2>
      <PlatformForm platform={platform} />
    </div>
  );
}
