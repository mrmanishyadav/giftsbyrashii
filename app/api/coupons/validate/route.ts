import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CouponValidationError, validateCoupon } from '@/lib/coupons';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  code: z.string().min(1).max(50),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(20) })).min(1),
  paymentMethod: z.enum(['razorpay', 'cod']).optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const admin = createAdminClient();
    const supabase = await createClient();
    if (!admin) return NextResponse.json({ error: 'Coupon service unavailable.' }, { status: 503 });
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    const validIds = [...new Set(input.items.map((item) => item.productId).filter((id) => z.string().uuid().safeParse(id).success))];
    const { data: products, error } = validIds.length
      ? await admin.from('products').select('id,price,category_id').in('id', validIds).eq('is_active', true)
      : { data: [], error: null };
    if (error) throw error;
    const lines = (products ?? []).flatMap((product) => {
      const item = input.items.find((candidate) => candidate.productId === product.id);
      return item ? [{ productId: product.id, categoryId: product.category_id, price: Number(product.price), quantity: item.quantity }] : [];
    });
    if (!lines.length) throw new CouponValidationError('Add an eligible product before applying a coupon.');
    const coupon = await validateCoupon(admin, { code: input.code, lines, paymentMethod: input.paymentMethod, userId: user?.id });
    return NextResponse.json({ couponId: coupon.id, code: coupon.code, discount: coupon.discount, description: coupon.description });
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid coupon request.' : error instanceof Error ? error.message : 'Coupon could not be applied.';
    return NextResponse.json({ error: message }, { status: error instanceof CouponValidationError ? 400 : 500 });
  }
}
