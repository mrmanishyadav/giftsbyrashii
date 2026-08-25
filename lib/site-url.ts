export function getSiteUrl(): string {
  const custom = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (custom && custom.length > 0) {
    if (custom.startsWith('http://') || custom.startsWith('https://')) {
      return custom.replace(/\/+$/, '');
    }
    return `https://${custom}`.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

export function getSiteUrlObject(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL('http://localhost:3000');
  }
}
