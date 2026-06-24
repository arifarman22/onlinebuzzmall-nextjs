import { db } from '@/lib/db';
import ProductForm from '@/components/admin/ProductForm';

export default async function CreateProductPage() {
  const platforms = await db.platform.findMany({ where: { status: 1 } });
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Product</h2>
      <ProductForm platforms={platforms} />
    </div>
  );
}
