'use client';

import Link from 'next/link';
import { Check, Eye, EyeOff, Gift, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function PasswordField({ name, label, autoComplete, onValue }: { name: string; label: string; autoComplete: string; onValue?: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <label className="field password-field"><span>{label}</span><div className="password-input"><input name={name} type={visible ? 'text' : 'password'} required minLength={8} autoComplete={autoComplete} onChange={(event) => onValue?.(event.target.value)} /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{visible ? <EyeOff /> : <Eye />}</button></div></label>;
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const router = useRouter();
  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const data = await response.json() as { error?: string };
    setLoading(false);
    if (!response.ok) { setError(data.error ?? 'Please try again.'); return; }
    router.push('/account');
    router.refresh();
  }

  return <div className="auth-wrap"><section className="auth-aside"><span><Gift /> GiftsByRashii</span><blockquote>“The best gifts don’t just say something. They make someone feel seen.”</blockquote><div>Thoughtful gifting · Secure checkout · Made in India</div></section><main className="auth-main"><Link href="/" className="back-link">← Back to GiftsByRashii</Link><div className="auth-card"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE JOY'}</span><h1>{mode === 'login' ? 'Your thoughtful corner awaits.' : 'Make gifting feel effortless.'}</h1><p>{mode === 'login' ? 'Sign in to see orders, saved gifts and delivery updates.' : 'Create your account and start instantly—no email confirmation needed.'}</p><form onSubmit={submit}>{mode === 'signup' && <><label className="field"><span>Full name</span><input name="fullName" required autoComplete="name" /></label><label className="field"><span>Mobile number</span><input name="mobile" required autoComplete="tel" inputMode="tel" pattern="\+?[1-9][0-9]{9,14}" title="Enter a valid 10–15 digit mobile number" /></label><label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label></>}{mode === 'login' && <label className="field"><span>Email or mobile</span><input name="identifier" required autoComplete="username" /></label>}<PasswordField name="password" label="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onValue={mode === 'signup' ? setPassword : undefined} />{mode === 'signup' && <><ul className="password-rules" aria-label="Password requirements">{passwordRules.map((rule) => <li className={rule.valid ? 'valid' : ''} key={rule.label}><Check />{rule.label}</li>)}</ul><PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" onValue={setConfirmation} />{confirmation && <small className={`password-match ${confirmation === password ? 'valid' : ''}`}>{confirmation === password ? 'Passwords match' : 'Passwords do not match yet'}</small>}</>}{mode === 'login' && <Link href="/forgot-password" className="forgot">Forgot password?</Link>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : mode === 'login' ? 'Sign in securely' : 'Create account & continue'} →</button></form><p className="auth-switch">{mode === 'login' ? 'New to GiftsByRashii?' : 'Already have an account?'} <Link href={mode === 'login' ? '/signup' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p></div></main></div>;
}
