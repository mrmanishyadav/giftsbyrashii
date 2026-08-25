import type { SupabaseClient } from '@supabase/supabase-js';

export type CouponLine = {
  productId: string | null;
  categoryId: string | null;
  price: number;
  quantity: number;
};

export type ValidatedCoupon = {
  id: string;
  code: string;
  description: string | null;
  discount: number;
};

export class CouponValidationError extends Error {}

const amount = (value: unknown) => Number(value ?? 0);
const ids = (value: unknown) => Array.isArray(value) ? value.map(String) : [];

export async function validateCoupon(
  admin: SupabaseClient,
  input: {
    code: string;
    lines: CouponLine[];
    paymentMethod?: 'razorpay' | 'cod';
    userId?: string | null;
  },
): Promise<ValidatedCoupon> {
  const code = input.code.trim();
  if (!code) throw new CouponValidationError('Enter a coupon code.');

  const { data: coupon, error } = await admin
    .from('coupons')
    .select('*')
    .ilike('code', code)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!coupon) throw new CouponValidationError('This coupon is invalid.');

  const now = Date.now();
  if (new Date(coupon.starts_at).getTime() > now || (coupon.ends_at && new Date(coupon.ends_at).getTime() < now)) {
    throw new CouponValidationError('This coupon is not active right now.');
  }

  const subtotal = input.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const quantity = input.lines.reduce((sum, line) => sum + line.quantity, 0);
  if (subtotal < amount(coupon.minimum_amount)) {
    throw new CouponValidationError(`Add ₹${Math.ceil(amount(coupon.minimum_amount) - subtotal)} more to use this coupon.`);
  }
  if (quantity < Number(coupon.minimum_quantity ?? 1)) {
    throw new CouponValidationError(`This coupon needs at least ${coupon.minimum_quantity} items.`);
  }
  if (coupon.prepaid_only && input.paymentMethod === 'cod') {
    throw new CouponValidationError('This offer is available only on prepaid orders.');
  }

  const totalLimit = coupon.total_usage_limit === null ? null : Number(coupon.total_usage_limit);
  if (totalLimit !== null) {
    const { count } = await admin.from('coupon_redemptions').select('*', { count: 'exact', head: true }).eq('coupon_id', coupon.id);
    if ((count ?? 0) >= totalLimit) throw new CouponValidationError('This coupon has reached its usage limit.');
  }

  if (input.userId) {
    const [{ count: usedByCustomer }, { count: previousOrders }] = await Promise.all([
      admin.from('coupon_redemptions').select('*', { count: 'exact', head: true }).eq('coupon_id', coupon.id).eq('user_id', input.userId),
      admin.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', input.userId).neq('status', 'cancelled'),
    ]);
    if ((usedByCustomer ?? 0) >= Number(coupon.usage_per_user ?? 1)) {
      throw new CouponValidationError('You have already used this coupon.');
    }
    if (coupon.first_order_only && (previousOrders ?? 0) > 0) {
      throw new CouponValidationError('This coupon is only for a first order.');
    }
  } else if (coupon.first_order_only) {
    throw new CouponValidationError('Sign in to use this first-order coupon.');
  }

  const applicableProducts = ids(coupon.applicable_products);
  const applicableCategories = ids(coupon.applicable_categories);
  const excludedProducts = ids(coupon.excluded_products);
  const eligibleLines = input.lines.filter((line) => {
    if (line.productId && excludedProducts.includes(line.productId)) return false;
    if (!applicableProducts.length && !applicableCategories.length) return true;
    return Boolean(
      (line.productId && applicableProducts.includes(line.productId)) ||
      (line.categoryId && applicableCategories.includes(line.categoryId)),
    );
  });
  const eligibleSubtotal = eligibleLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  if (eligibleSubtotal <= 0) throw new CouponValidationError('This coupon does not apply to the gifts in your bag.');

  let discount = coupon.discount_type === 'percentage'
    ? eligibleSubtotal * amount(coupon.value) / 100
    : amount(coupon.value);
  if (coupon.maximum_discount !== null) discount = Math.min(discount, amount(coupon.maximum_discount));
  discount = Math.min(eligibleSubtotal, Math.round(discount * 100) / 100);
  if (discount <= 0) throw new CouponValidationError('This coupon does not provide a discount for this bag.');

  return { id: coupon.id, code: coupon.code, description: coupon.description, discount };
}
