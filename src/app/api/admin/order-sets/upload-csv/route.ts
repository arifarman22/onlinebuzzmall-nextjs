import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderSetId = Number(formData.get('order_set_id'));

    if (!file || !orderSetId) {
      return NextResponse.json({ success: false, message: 'File and order_set_id required' }, { status: 400 });
    }

    const orderSet = await db.orderSet.findUnique({ where: { id: orderSetId } });
    if (!orderSet) {
      return NextResponse.json({ success: false, message: 'Order set not found' }, { status: 404 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ success: false, message: 'CSV must have a header row and at least one data row' }, { status: 400 });
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = header.indexOf('product_name');
    const priceIdx = header.indexOf('price');
    const profitIdx = header.indexOf('profit_percent');
    const typeIdx = header.indexOf('type');

    if (nameIdx === -1 || profitIdx === -1) {
      return NextResponse.json({ success: false, message: 'CSV must have columns: product_name, profit_percent. Optional: price, type' }, { status: 400 });
    }

    // Fetch all products for matching
    const allProducts = await db.product.findMany({ where: { status: 1 } });
    const productMap = new Map<string, typeof allProducts[0]>(allProducts.map((p) => [p.name.toLowerCase().trim(), p]));

    let created = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0) continue;

      const productNames = (cols[nameIdx] || '').split('|').map((n) => n.trim()).filter(Boolean);
      const profitPercent = parseFloat(cols[profitIdx]) || 0;
      const type = typeIdx !== -1 ? (cols[typeIdx]?.trim() || 'single') : (productNames.length > 1 ? 'combo' : 'single');

      if (productNames.length === 0) {
        errors.push(`Row ${i + 1}: No product name`);
        continue;
      }

      // Match products by name
      const matchedProducts: { id: number; price: number }[] = [];
      let rowError = false;
      for (const name of productNames) {
        const product = productMap.get(name.toLowerCase());
        if (!product) {
          errors.push(`Row ${i + 1}: Product "${name}" not found`);
          rowError = true;
          break;
        }
        matchedProducts.push({ id: product.id, price: product.price });
      }
      if (rowError) continue;

      // Use CSV price if provided, otherwise use product price
      const csvPrice = priceIdx !== -1 ? parseFloat(cols[priceIdx]) : NaN;

      // Create order
      const order = await db.order.create({
        data: {
          order_set_id: orderSetId,
          platform_id: orderSet.platform_id,
          type,
          profit: profitPercent,
          status: 1,
        },
      });

      // Create order details
      for (const mp of matchedProducts) {
        const price = matchedProducts.length === 1 && !isNaN(csvPrice) ? csvPrice : mp.price;
        await db.orderDetail.create({
          data: { order_id: order.id, product_id: mp.id, price, quantity: 1 },
        });
      }

      created++;
    }

    return NextResponse.json({
      success: true,
      message: `${created} order(s) created successfully${errors.length > 0 ? `. ${errors.length} row(s) skipped.` : ''}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to process CSV' }, { status: 500 });
  }
}

// Handle quoted CSV fields (e.g. "Product A | Product B")
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
