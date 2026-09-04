# TemplateHaus — Canva Template Store

A Next.js (App Router) storefront for selling Canva templates as digital
downloads, with UPI + international payments and auto-delivery.

## Stack
- **Next.js 14** (React, server + API routes in one app)
- **Prisma + SQLite** for dev (swap `DATABASE_URL` to Postgres for production —
  Vercel Postgres, Supabase, or Railway all work with zero code changes)
- **Stripe Checkout** — cards + PayPal, for international customers
- **Razorpay Checkout** — UPI (Google Pay, PhonePe, Paytm), Indian cards, netbanking
- **Nodemailer** (via Resend/SMTP) for the auto-delivery email

## 1. Install & configure
```bash
cd canva-store
npm install
cp .env.example .env
```
Fill in `.env`:
- `ADMIN_EMAIL` — your login email
- `ADMIN_PASSWORD_HASH` — run `node scripts/hash-password.js "YourStrongPassword"` and paste the output
- `ADMIN_SLUG` — a random string only you know, e.g. `x7k9p2q8`. This becomes your login URL: `https://yourdomain.com/x7k9p2q8`
- Stripe keys from the Stripe Dashboard, Razorpay keys from the Razorpay Dashboard
- SMTP credentials (Resend, Postmark, SES, or Gmail app password all work)

```bash
npx prisma migrate dev --name init
npm run dev
```
Visit `http://localhost:3000` for the storefront.

## 2. How the admin login/upload flow works
- There is **no visible link anywhere** on the site to the admin page. The
  route is a Next.js dynamic segment `app/[admin]/page.js` that checks the URL
  segment against `process.env.ADMIN_SLUG`. Any other value (`/admin`,
  `/login`, `/wp-admin`, etc.) returns a plain 404 — identical to a page that
  doesn't exist, so it can't be discovered by guessing or crawling.
- Going to `https://yourdomain.com/<ADMIN_SLUG>` shows a plain email/password
  form. Credentials are checked against `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`
  in your environment variables — there's intentionally no "admin" database
  table or sign-up flow, since you're the only admin.
- On success, an `httpOnly`, `Secure`, `SameSite=Strict` JWT cookie is set.
  It can't be read by JavaScript (so it's safe from XSS) and expires after
  12 hours.
- `/<ADMIN_SLUG>/dashboard` is protected twice: once by edge `middleware.js`
  (redirects to `/` if there's no session cookie) and again inside the page
  itself (verifies the JWT signature server-side). Failing either check just
  looks like a normal redirect/404 — it never reveals that an admin area exists.
- The dashboard has a form to add a template: title, caption, full
  description, price in ₹ and $, a cover image, and the actual template file
  (zip, PDF, or however you export from Canva).
  - The **cover image** is saved to `/public/uploads` (needs to be publicly
    reachable so it can render on the product card and as the image in social
    share previews).
  - The **template file** is saved to `/secure-files`, which is never served
    directly by Next.js — it can only be downloaded through the signed,
    single-order `/api/download/[token]` route after payment is confirmed.
  - Rate limiting (5 attempts / 15 min per IP) is applied to the login route.

## 3. How auto-delivery works
1. Customer clicks "Pay via UPI" or "Pay via Card/PayPal" and enters their email.
2. An `Order` row is created with `status: "pending"` and a random
   `downloadToken` — *before* payment happens, so nothing is trusted from the
   client afterward.
3. Stripe/Razorpay's hosted checkout handles the actual payment.
4. When payment succeeds, **Stripe/Razorpay calls your webhook** (server to
   server, not the browser) — `/api/webhooks/stripe` or
   `/api/webhooks/razorpay`. The webhook verifies the cryptographic signature,
   marks the order `paid`, and immediately emails the customer a link to
   `/api/download/[token]`.
5. That download route checks the order is `paid` before ever touching the
   file on disk, then streams it back. The link is unique per order, so it
   can't be reused for other products, and each open is counted.

This webhook-first design matters: payment confirmation must never depend on
the customer's browser successfully redirecting back to your success page —
they might close the tab, lose connection, or the redirect might fail. The
webhook is the one thing you can rely on.

## 4. Payment setup checklist
**Stripe** (cards + PayPal, international):
1. Create a Stripe account, get API keys from Dashboard → Developers → API keys.
2. Enable PayPal as a payment method: Dashboard → Settings → Payment methods.
3. Add a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe`,
   subscribed to `checkout.session.completed`. Copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.

**Razorpay** (UPI/GPay/PhonePe/Paytm, Indian cards, netbanking):
1. Create a Razorpay account and complete KYC (required to accept live payments).
2. Get API keys from Dashboard → Settings → API Keys.
3. Add a webhook pointing to `https://yourdomain.com/api/webhooks/razorpay`,
   subscribed to `payment.captured`. Set the same secret as
   `RAZORPAY_WEBHOOK_SECRET`.
4. UPI apps (Google Pay, PhonePe, Paytm) appear automatically in Razorpay's
   checkout widget — there's nothing extra to integrate per-app.

## 5. Social sharing previews
`app/products/[slug]/page.js` exports `generateMetadata()`, which sets
Open Graph and Twitter Card tags (title, description, and the product's cover
image) server-side for every product page. That's what makes WhatsApp,
iMessage, Facebook, and Twitter/X render a rich preview card when a customer
pastes or shares the product link — no extra service needed. You can verify
any live URL with Facebook's Sharing Debugger or LinkedIn's Post Inspector
before launch.

## 6. Deployment (Netlify)
1. Push this project to a GitHub/GitLab repo.
2. **Database**: create a free Postgres instance (Neon.tech is the quickest —
   or use Netlify's own "Netlify DB", which is Neon under the hood). Copy the
   connection string into `DATABASE_URL`, then run `npx prisma migrate deploy`
   once against it.
3. **File storage**: create a Cloudflare R2 account (free tier is generous).
   Make two buckets — one public (`templatetreasury-public`, for cover images)
   and one private (`templatetreasury-private`, for the actual template
   files). Generate an R2 API token and fill in the `S3_*` variables in
   `.env.example`. Turn on public access / a custom domain for the public
   bucket only.
4. In Netlify: **Add new site → Import from Git**, pick the repo.
   `netlify.toml` (included) already tells Netlify to run `npm run build` and
   use `@netlify/plugin-nextjs`, so no manual build settings are needed.
5. In **Site settings → Environment variables**, paste in every variable from
   `.env.example` with real values — this is exactly like a `.env` file, just
   entered through Netlify's UI instead of a file.
6. Deploy. Netlify gives you a URL like `templatetreasury.netlify.app`
   (or attach a custom domain under Domain management).
7. **Point your webhooks at the live URL**: in the Stripe and Razorpay
   dashboards, update the webhook endpoints to
   `https://yourdomain.com/api/webhooks/stripe` and `.../razorpay` — a
   webhook aimed at `localhost` obviously can't reach a live server.
8. Visit `https://yourdomain.com/<ADMIN_SLUG>` and log in with the
   `ADMIN_EMAIL` / password you hashed into `ADMIN_PASSWORD_HASH` to start
   uploading real templates.

## Project structure
```
app/
  page.js                        storefront home
  products/[slug]/page.js        product detail + OG tags for share previews
  products/[slug]/BuyButtons.jsx UPI + card/PayPal buttons
  [admin]/page.js                hidden admin login (matches ADMIN_SLUG only)
  [admin]/dashboard/page.js      admin panel: add/publish/delete templates
  api/checkout/stripe/route.js   creates Stripe Checkout session
  api/checkout/razorpay/route.js creates Razorpay order
  api/webhooks/stripe/route.js   confirms payment, triggers delivery
  api/webhooks/razorpay/route.js confirms payment, triggers delivery
  api/download/[token]/route.js  serves the file only to a paid order
  api/admin/*                    admin auth + product CRUD
lib/                             prisma client, auth, email, tokens
prisma/schema.prisma             Product / Order / AdminSession models
secure-files/                    real template files (never public)
```
