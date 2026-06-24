import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({ where: { id: Number(params.id) } });
  if (!product) return notFound();

  const platforms = await db.platform.findMany({ where: { status: 1 } });
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
      <ProductForm platforms={platforms} product={product} />
    </div>
  );
}
