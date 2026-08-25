# GiftsByRashii

GiftsByRashii is a production-oriented Indian gifting commerce platform built with Next.js App Router, React, strict TypeScript, Supabase, Razorpay, Zod, Motion and Tailwind CSS. It includes a CMS-driven storefront, customer accounts, secure checkout, admin operations, corporate gifting and an eight-step custom hamper builder.

## 1. Prerequisites

- Node.js 22.13 or newer
- npm 10 or newer
- A Supabase project
- A Razorpay account for live or test payments
- A Vercel account for deployment

## 2. Install and run

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With `NEXT_PUBLIC_DEMO_MODE=true`, original seed-style preview products are displayed until Supabase is connected. This fallback is for local preview only; production commerce content comes from Supabase and the admin panel.

## 3. Supabase setup

1. Create a Supabase project and copy the project URL and public anon key into `.env.local`.
2. Copy the service-role key to `SUPABASE_SERVICE_ROLE_KEY`. This key is used only by server routes; never expose it through a `NEXT_PUBLIC_` variable.
3. Run migrations in filename order:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

4. Apply `supabase/seed.sql` only when you want initial development content:

```bash
supabase db reset
```

The initial migration creates normalized commerce, CMS, RBAC, payments, reviews, hamper, audit and shipping-ready structures with foreign keys, checks, indexes, triggers and Row Level Security. The second migration creates the validated `giftmitra-media` Storage bucket. The third migration is the requested admin/catalog upgrade: it adds full product content fields, no-code commerce/theme settings, 8 categories, **10 products per category (80 total)**, separate main/gallery image URLs, two homepage slider banners and starter FAQs.

The ready-to-run catalog query is [`supabase/migrations/202608250003_catalog_admin_upgrade.sql`](supabase/migrations/202608250003_catalog_admin_upgrade.sql). Image sources and replaceable direct URLs are documented in [`docs/product-image-links.md`](docs/product-image-links.md).

## 4. Storage buckets

`202608250002_storage.sql` creates the main bucket and policies. The application uses logical folders:

- `products`, `categories`, `banners`, `homepage`
- `reels`, `reviews`, `corporate`, `avatars`
- `personalization`

Admin upload routes validate MIME type, file size and collision-resistant filenames. Personalisation uploads require an authenticated owner.

## 5. Environment variables

Copy `.env.example` and fill:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged database operations |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser-safe Razorpay checkout key |
| `RAZORPAY_KEY_ID` | Server-side Razorpay account key |
| `RAZORPAY_KEY_SECRET` | Server-only order/signature secret |
| `RAZORPAY_WEBHOOK_SECRET` | Server-only webhook HMAC secret |
| `NEXT_PUBLIC_SITE_URL` | Canonical production origin |
| `ADMIN_EMAILS` | Operational bootstrap allowlist if used by an onboarding script |
| `NEXT_PUBLIC_GA_ID` | Optional analytics identifier |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional Meta pixel identifier |

`.env.local` is ignored by Git.

## 6. Create the first admin

1. Sign up normally through `/signup` so Supabase creates `auth.users` and `profiles` rows.
2. In Supabase SQL Editor, promote the known user explicitly:

```sql
insert into public.admin_users (user_id, role_id)
select u.id, r.id
from auth.users u
cross join public.roles r
where u.email = 'owner@example.com'
  and r.name = 'SUPER_ADMIN'
on conflict (user_id) do update set role_id = excluded.role_id, is_active = true;
```

Admin permission is always checked server-side. A customer cannot self-promote through browser requests.

## 7. Razorpay setup

1. Add test-mode keys locally, then live keys only in Vercel production environment variables.
2. Configure the webhook endpoint as:

```text
https://YOUR_DOMAIN/api/webhooks/razorpay
```

3. Subscribe to payment captured, payment failed and refund events.
4. Set the same webhook signing secret as `RAZORPAY_WEBHOOK_SECRET`.

The checkout route reads current product prices and stock from the database, creates a pending GiftsByRashii order, then creates the Razorpay Order server-side. `/api/payments/verify` uses timing-safe HMAC verification. The webhook is signature-verified and payment identifiers are unique for idempotency. A browser callback alone never marks an order paid.

## 8. Local development and validation

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

Critical flows to verify with configured test credentials:

- customer sign-up → immediate secure login (no email confirmation link)
- product → personalisation → cart → coupon → checkout
- Razorpay test payment → signature verification → order timeline
- custom hamper steps 1–8 → cart → order item configuration
- admin product publish → product appears on storefront
- order status change → customer timeline update
- non-admin request to `/admin` redirects safely
- invalid payment/webhook signatures return 401 and do not change payment state

## 9. Vercel deployment

1. Import the repository in Vercel.
2. Keep Framework Preset as Next.js and Build Command as `npm run build`.
3. Add every production environment variable; set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin.
4. Deploy, then add the production Razorpay webhook URL.
5. Confirm Supabase Auth redirect URLs include the Vercel production origin and `/reset-password`.

The primary scripts use the native Next.js runtime for Vercel. The scaffold’s optional `sites:dev` and `sites:build` scripts are retained separately and do not affect Vercel.

## 10. Architecture

- `app/` — storefront, account, checkout, admin, API routes, metadata and error states
- `components/` — reusable commerce, account, CMS and admin surfaces
- `lib/` — database clients, catalog repository, validation, pricing, auth, payment, analytics and notifications
- `supabase/migrations/` — reproducible schema, RLS, triggers and storage
- `supabase/seed.sql` — clearly separated development content

Pricing, coupon eligibility, authorization, payment verification and inventory updates are server-owned. Device storage is used only as an anonymous pre-login cart/wishlist convenience; durable signed-in data belongs in Supabase.

## 11. Troubleshooting

- **“Supabase is not configured”** — confirm the three Supabase variables and restart the server.
- **Admin redirects to account** — create an active `admin_users` row for the authenticated user.
- **Razorpay order saved but checkout disabled** — add all four Razorpay variables; use matching test/live modes.
- **Upload rejected** — use JPG, PNG, WebP, AVIF or MP4 under 20 MB and apply the storage migration.
- **Product missing on storefront** — set `is_active`, stock, category relations and media in admin; verify RLS migrations ran.
- **Auth callback rejected** — add the exact local and production origins to Supabase Auth URL configuration.
