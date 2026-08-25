import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({ orderNumber: z.string().trim().min(5).max(40), mobile: z.string().trim().min(10).max(20) });
const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '').slice(-10);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid order number and mobile number.' }, { status: 400 });
  const client = createAdminClient();
  if (!client) return NextResponse.json({ error: 'Tracking is temporarily unavailable.' }, { status: 503 });
  const { data } = await client.from('orders').select('id,order_number,status,created_at,tracking_url,address_snapshot,order_status_history(id,status,note,created_at)').ilike('order_number', parsed.data.orderNumber).maybeSingle();
  const address = (data?.address_snapshot ?? {}) as Record<string, unknown>;
  if (!data || digits(address.mobile) !== digits(parsed.data.mobile)) return NextResponse.json({ error: 'We could not match those details. Check the order number and mobile used at checkout.' }, { status: 404 });
  return NextResponse.json({ order: { id: data.id, orderNumber: data.order_number, status: data.status, createdAt: data.created_at, trackingUrl: data.tracking_url, history: (data.order_status_history ?? []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) } });
}
