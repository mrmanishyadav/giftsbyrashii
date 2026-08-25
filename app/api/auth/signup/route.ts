import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  if (body.password !== body.confirmPassword) return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid details.' }, { status: 400 });
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: 'Authentication is ready but Supabase environment variables are not configured.' }, { status: 503 });

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, mobile: parsed.data.mobile },
  });
  if (error || !data.user) {
    const message = error?.message.toLowerCase().includes('already') ? 'An account with this email already exists. Please sign in.' : error?.message ?? 'Account could not be created.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: profileError } = await admin.from('profiles').upsert({ id: data.user.id, full_name: parsed.data.fullName, mobile: parsed.data.mobile, email: parsed.data.email }, { onConflict: 'id' });
  if (profileError) return NextResponse.json({ error: 'Account was created, but the profile could not be saved. Please contact support.' }, { status: 409 });
  const { error: loginError } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (loginError) return NextResponse.json({ error: 'Account created. Please sign in with your email and password.' }, { status: 409 });
  return NextResponse.json({ ok: true, authenticated: true });
}
