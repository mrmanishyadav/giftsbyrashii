import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCoupon } from '@/lib/coupons';
import { calculateTotals } from '@/lib/pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const hamper = z.object({ recipient: z.string(), occasion: z.string(), packaging: z.string(), items: z.array(z.string()), recipientName: z.string().optional(), message: z.string().optional(), deliveryDate: z.string().optional(), total: z.number().positive() });
const schema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(20), personalization: z.record(z.string(), z.string()).optional(), hamper: hamper.optional(), name: z.string().optional(), price: z.number().optional(), mrp: z.number().optional() })).min(1),
  address: z.object({ name: z.string().min(2), mobile: z.string().min(10), line1: z.string().min(5), city: z.string().min(2), state: z.string().min(2), postalCode: z.string().regex(/^\d{6}$/) }),
  paymentMethod: z.enum(['razorpay', 'cod']),
  couponCode: z.string().max(50).optional(),
  deliveryDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = await createClient();
    const admin = createAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: 'Checkout is ready but Supabase environment variables are not configured.' }, { status: 503 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 });

    const normal = input.items.filter((item) => !item.hamper);
    const productIds = [...new Set(normal.map((item) => item.productId))];
    const { data: products, error } = productIds.length
      ? await admin.from('products').select('id,name,slug,sku,price,mrp,stock,is_cod_enabled,category_id').in('id', productIds).eq('is_active', true)
      : { data: [], error: null };
    if (error || !products || products.length !== productIds.length) return NextResponse.json({ error: 'One or more gifts are no longer available.' }, { status: 409 });

    const lines = input.items.map((item) => {
      if (item.hamper) {
        if (Math.abs(item.hamper.total - (item.price ?? 0)) > .01) throw new Error('Hamper price mismatch. Please rebuild the hamper.');
        return { id: null, categoryId: null, price: item.hamper.total, mrp: item.hamper.total, quantity: 1, product: { name: item.name ?? 'Custom Hamper', slug: 'custom-hamper', sku: 'CUSTOM-HAMPER' }, personalization: item.personalization ?? {}, hamper: item.hamper };
      }
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product || product.stock < item.quantity) throw new Error(`${product?.name ?? 'Gift'} does not have enough stock.`);
      if (input.paymentMethod === 'cod' && !product.is_cod_enabled) throw new Error(`${product.name} is prepaid only.`);
      return { id: product.id, categoryId: product.category_id, price: Number(product.price), mrp: Number(product.mrp), quantity: item.quantity, product, personalization: item.personalization ?? {}, hamper: undefined };
    });

    const baseTotals = calculateTotals(lines.map((line) => ({ id: line.id ?? 'hamper', price: line.price, mrp: line.mrp, quantity: line.quantity })));
    const coupon = input.couponCode?.trim()
      ? await validateCoupon(admin, { code: input.couponCode, paymentMethod: input.paymentMethod, userId: user.id, lines: lines.map((line) => ({ productId: line.id, categoryId: line.categoryId, price: line.price, quantity: line.quantity })) })
      : null;
    const discount = coupon?.discount ?? 0;

    const { data: settingRows } = await admin.from('site_settings').select('key,value').in('key', ['payments', 'shipping']);
    const setting = Object.fromEntries((settingRows ?? []).map((row) => [row.key, row.value as Record<string, unknown>]));
    const payments = setting.payments ?? {};
    const shippingConfig = setting.shipping ?? {};
    if (input.paymentMethod === 'cod' && !Boolean(payments.codEnabled ?? true)) throw new Error('Cash on delivery is currently disabled.');
    if (input.paymentMethod === 'razorpay' && !Boolean(payments.razorpayEnabled ?? true)) throw new Error('Online payment is currently disabled.');
    const codMin = Number(payments.codMinimum ?? 0);
    const codMax = Number(payments.codMaximum ?? Number.MAX_SAFE_INTEGER);
    if (input.paymentMethod === 'cod' && (baseTotals.subtotal < codMin || baseTotals.subtotal > codMax)) throw new Error(`Cash on delivery is available for orders between ₹${codMin} and ₹${codMax}.`);
    const freeAbove = Number(shippingConfig.freeShippingAbove ?? 999);
    const shippingCharge = baseTotals.subtotal - discount >= freeAbove ? 0 : Number(shippingConfig.standardCharge ?? 99);
    const codSurcharge = input.paymentMethod === 'cod' ? Number(payments.codSurcharge ?? 0) : 0;
    const total = Math.max(0, baseTotals.subtotal - discount + shippingCharge + codSurcharge);

    const { data: order, error: orderError } = await admin.from('orders').insert({ user_id: user.id, address_snapshot: input.address, status: 'payment_pending', payment_status: 'pending', payment_method: input.paymentMethod, subtotal: baseTotals.subtotal, discount, shipping: shippingCharge, cod_surcharge: codSurcharge, total, coupon_code: coupon?.code ?? null, preferred_delivery_date: input.deliveryDate }).select('id,order_number').single();
    if (orderError) throw orderError;
    const { error: itemError } = await admin.from('order_items').insert(lines.map((line) => ({ order_id: order.id, product_id: line.id, product_snapshot: { name: line.product.name, slug: line.product.slug, sku: line.product.sku }, quantity: line.quantity, unit_price: line.price, mrp: line.mrp, personalization: line.personalization, hamper_configuration: line.hamper ?? null })));
    if (itemError) throw itemError;

    if (input.paymentMethod === 'cod') {
      const inventoryLines = lines.filter((line) => line.id).map((line) => ({ product_id: line.id, quantity: line.quantity }));
      if (inventoryLines.length) {
        const { error: reserveError } = await admin.rpc('reserve_inventory', { p_order_id: order.id, p_lines: inventoryLines });
        if (reserveError) {
          await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
          await admin.from('order_status_history').insert({ order_id: order.id, status: 'cancelled', note: 'Inventory changed during checkout' });
          throw new Error('A gift sold out during checkout. Please refresh your bag and try again.');
        }
      }
      await admin.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
      await admin.from('order_status_history').insert({ order_id: order.id, status: 'confirmed', note: 'Cash on delivery order placed' });
      if (coupon) await admin.from('coupon_redemptions').insert({ coupon_id: coupon.id, user_id: user.id, order_id: order.id, discount: coupon.discount });
      return NextResponse.json({ orderNumber: order.order_number, orderId: order.id, message: 'Cash on delivery order confirmed.', totals: { subtotal: baseTotals.subtotal, discount, shipping: shippingCharge, codSurcharge, total } });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !secret) return NextResponse.json({ orderNumber: order.order_number, orderId: order.id, error: 'Order saved, but Razorpay credentials are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' }, { status: 503 });
    const gateway = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`, 'content-type': 'application/json' }, body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', receipt: order.order_number, notes: { giftmitra_order_id: order.id } }) });
    if (!gateway.ok) throw new Error('Razorpay order creation failed.');
    const razorpay = await gateway.json() as { id: string; amount: number };
    await admin.from('payments').insert({ order_id: order.id, razorpay_order_id: razorpay.id, status: 'pending', amount: total, gateway_metadata: { receipt: order.order_number } });
    return NextResponse.json({ orderNumber: order.order_number, orderId: order.id, razorpayOrderId: razorpay.id, amount: razorpay.amount, currency: 'INR', keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? keyId, totals: { subtotal: baseTotals.subtotal, discount, shipping: shippingCharge, codSurcharge, total } });
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid checkout details.' : error instanceof Error ? error.message : 'Checkout failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
