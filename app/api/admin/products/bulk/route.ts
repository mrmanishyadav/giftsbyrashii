import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(250), action: z.enum(['publish', 'draft', 'archive', 'delete']) });

export async function POST(request: Request) {
  const { admin } = await requireAdmin();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Choose at least one valid product and action.' }, { status: 400 });
  const client = createAdminClient();
  if (!client) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
  const { ids, action } = parsed.data;
  let message = '';
  if (action === 'delete') {
    const [{ data: orderLinks }, { data: inventoryLinks }] = await Promise.all([
      client.from('order_items').select('product_id').in('product_id', ids),
      client.from('inventory_movements').select('product_id').in('product_id', ids),
    ]);
    const protectedIds = new Set([...(orderLinks ?? []), ...(inventoryLinks ?? [])].map((row) => row.product_id).filter(Boolean));
    const deletable = ids.filter((id) => !protectedIds.has(id));
    const archived = ids.filter((id) => protectedIds.has(id));
    if (deletable.length) {
      const { error } = await client.from('products').delete().in('id', deletable);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (archived.length) {
      const { error } = await client.from('products').update({ publication_status: 'archived', is_active: false }).in('id', archived);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    message = `${deletable.length} deleted${archived.length ? `; ${archived.length} archived because order or inventory history must be preserved` : ''}.`;
  } else {
    const status = action === 'publish' ? 'published' : action;
    const { error } = await client.from('products').update({ publication_status: status, is_active: action === 'publish' }).in('id', ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    message = `${ids.length} product${ids.length === 1 ? '' : 's'} moved to ${status}.`;
  }
  await client.from('audit_logs').insert({ admin_user_id: admin.id, action: `product.bulk_${action}`, entity_type: 'product', metadata: { ids, count: ids.length } });
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/admin/products');
  return NextResponse.json({ ok: true, message });
}
