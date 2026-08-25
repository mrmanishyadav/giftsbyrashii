import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  return NextResponse.json({
    authenticated: true,
    fullName: profile?.full_name || user.user_metadata.full_name || user.email?.split('@')[0] || 'My account',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
