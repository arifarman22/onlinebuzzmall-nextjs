# OnlineBuzz Mall — Next.js Full Stack E-Commerce MLM Platform

A production-ready, full-stack e-commerce MLM platform built with Next.js 16. Features a binary tree referral system, VIP-level order tasks, multi-gateway crypto payments, cookie-based admin impersonation, and a comprehensive admin panel — all secured with atomic database transactions and hardened API routes.

## Live Demo

- **Production**: [https://onlinebuzzmall-nextjs.vercel.app](https://onlinebuzzmall-nextjs.vercel.app)

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Database** | MySQL (TiDB Cloud) via Prisma ORM 6 |
| **Authentication** | NextAuth.js v5 (Auth.js) |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand |
| **File Uploads** | Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **Charts** | Recharts |
| **Caching** | Next.js `unstable_cache` (Data Cache) |
| **Validation** | Zod |
| **Language** | TypeScript 5 |
| **Deployment** | Vercel / VPS (PM2 + Nginx) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                   # Login, Register, OTP, Impersonate
│   ├── (dashboard)/              # User dashboard pages
│   │   ├── dashboard/            # Main dashboard — balance, stats, charts
│   │   ├── orders/               # Platform orders & task completion
│   │   │   └── [platformId]/     # Individual platform task list
│   │   ├── wallet/               # Wallet overview
│   │   ├── deposit/              # Deposit funds
│   │   ├── withdraw/             # Withdraw funds
│   │   ├── transactions/         # Transaction history (paginated)
│   │   ├── records/              # Order records — Completed/Incomplete/Transactions tabs
│   │   ├── profile/              # Profile management & password change
│   │   ├── kyc/                  # KYC document submission
│   │   ├── support/              # Support tickets
│   │   ├── invite/               # Referral system
│   │   ├── tree/                 # Binary tree visualization
│   │   ├── transfer/             # Balance transfer between users
│   │   ├── plan/                 # Plan purchase
│   │   ├── twofactor/            # 2FA setup
│   │   └── notifications/        # Notification center
│   ├── admin/                    # Admin panel
│   │   ├── dashboard/            # Admin stats & graphs
│   │   ├── users/                # User management
│   │   ├── deposits/             # Deposit approval/rejection
│   │   ├── withdrawals/          # Withdrawal management
│   │   ├── platforms/            # Platform CRUD
│   │   ├── order-sets/           # Order set management + CSV upload
│   │   ├── orders/               # Order history
│   │   ├── products/             # Product management
│   │   ├── plans/                # Plan management
│   │   ├── gateways/             # Payment gateway config
│   │   ├── commissions/          # Commission level config
│   │   ├── kyc/                  # KYC review
│   │   ├── support/              # Support ticket management
│   │   ├── reports/              # Transaction & login reports
│   │   ├── roles/                # Role & permission management
│   │   ├── notifications/        # Admin notifications
│   │   ├── settings/             # Site settings
│   │   └── platform-rules/       # Platform guideline cards
│   └── api/                      # API routes
│       ├── auth/                 # Registration, OTP, NextAuth handlers
│       ├── admin/                # Admin actions + impersonation
│       ├── deposit/              # Deposit gateway
│       ├── withdraw/             # Withdrawal submit
│       ├── orders/               # Order start/submit (atomic transactions)
│       ├── upload/               # Cloudinary file upload
│       ├── user/                 # Profile, transfer, support, 2FA
│       ├── webhooks/             # CoinGate, NOWPayments, Coinbase Commerce
│       ├── platform-rules/       # Cached platform guidelines API
│       ├── analytics/            # Analytics tracking
│       └── cron/                 # Matching bonus cron job
├── components/
│   ├── ui/                       # Button, Card, Badge, Input, Pagination, etc.
│   ├── layout/                   # Sidebar, BottomNav, AdminSidebar, MobileSidebar
│   ├── dashboard/                # User-facing components
│   └── admin/                    # Admin panel components
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Prisma client (connection pooling)
│   ├── session.ts                # getSessionUser() — NextAuth + imp_token fallback
│   ├── api-auth.ts               # getApiUserId() — API route auth helper
│   ├── cache.ts                  # unstable_cache wrapper + invalidateCache()
│   ├── mlm.ts                    # Binary tree / MLM commission logic
│   ├── email.ts                  # Nodemailer email utilities
│   ├── security.ts               # Security middleware (rate limit, bot block, CSP)
│   ├── rate-limit.ts             # Per-user+IP in-memory rate limiter
│   ├── branding.ts               # Cached branding settings
│   ├── settings.ts               # Site settings with 60s in-memory cache
│   ├── notifications.ts          # Admin notification helpers
│   ├── sanitize.ts               # HTML sanitizer
│   ├── audit.ts                  # Audit log helpers
│   ├── permissions.ts            # RBAC permission checks
│   └── validations/index.ts      # Zod schemas for all API inputs
├── middleware.ts                  # Route protection, imp_token validation, SSRF-safe redirects
├── types/                         # TypeScript type definitions
├── store/                         # Zustand stores
├── hooks/                         # Custom React hooks
└── messages/                      # i18n translations (en, ar, de, es, fr)
```

---

## Features

### User Features

- ✅ Registration with mandatory referral code (binary tree placement)
- ✅ Login — compatible with existing Laravel bcrypt password hashes
- ✅ Dashboard — balance card, account status, recent transactions, platform guidelines
- ✅ Order system — VIP-level platforms, task queue, confirmation popup, success popup
- ✅ Dot-style order progress bar (10 segments)
- ✅ Wallet page — balance, deposit/withdraw stats, pending transactions
- ✅ Deposit — multiple payment gateways, proof upload, payment info card
- ✅ Withdrawal — method selection, charge calculation, admin approval flow
- ✅ Transaction history — paginated (30/page)
- ✅ Records — Completed / Incomplete / Transactions tabs with pagination (25/page)
- ✅ Balance transfer between users (with charge config)
- ✅ Referral / invite system with shareable link
- ✅ Binary tree visualization (3-level)
- ✅ Profile management — name, avatar upload (Cloudinary)
- ✅ Password change
- ✅ KYC document submission
- ✅ 2FA — Google Authenticator (TOTP) setup & verification
- ✅ Support ticket system — create, reply, view status
- ✅ Notification center
- ✅ Plan purchase
- ✅ Mobile bottom navigation + desktop sidebar
- ✅ Responsive, mobile-first design
- ✅ Multi-language support (en, ar, de, es, fr)

### Admin Features

- ✅ Admin dashboard — user stats, deposit/withdrawal graphs, commission overview
- ✅ User management — ban/unban, soft delete, balance adjust, freeze, password change, order limit
- ✅ Role-based admin access (super-admin, moderator, support)
- ✅ Order set management — manual creation + CSV bulk upload
- ✅ Order set assignment to users
- ✅ Platform CRUD — name, image, VIP level, commission, on/off toggle
- ✅ Platform guidelines (rules cards) management
- ✅ Product management
- ✅ Deposit approval/rejection with transaction history
- ✅ Withdrawal approval/rejection with auto-refund on rejection
- ✅ Payment gateway configuration (wallet address, QR, charges, proof settings)
- ✅ Withdrawal method management
- ✅ Commission level configuration (deposit + withdrawal)
- ✅ Plan management
- ✅ VIP rank management & user assignment
- ✅ KYC review (approve/reject)
- ✅ Support ticket management — reply, close
- ✅ Reports — transactions, login history, commissions
- ✅ Notification system
- ✅ Site settings (branding, SMTP, financial limits, SEO, social links)
- ✅ Setting audit log
- ✅ Analytics dashboard (visits, sessions, bounce rate)
- ✅ **Cookie-based user impersonation** — open user session in new tab without affecting admin session
- ✅ Matching bonus cron job (`/api/cron`)

### Payment & Crypto

- ✅ Manual crypto deposit — wallet address display, QR code, proof upload, admin approval
- ✅ CoinGate payment gateway + webhook (IP allowlist enforced)
- ✅ NOWPayments gateway + HMAC-SHA512 webhook signature verification
- ✅ Coinbase Commerce gateway + HMAC-SHA256 webhook signature verification
- ✅ All webhook signature checks unconditional in production (not gated on env var)

### Security

- ✅ **Atomic DB transactions** — order submit, withdrawal, and balance transfer all use `db.$transaction()` to prevent race condition exploits
- ✅ JWT-based authentication with role separation (user / admin)
- ✅ Cookie-based impersonation (`imp_token`) — httpOnly, secure, sameSite lax, 8h expiry
- ✅ SSRF-safe redirects in middleware — origin pinned to `NEXTAUTH_URL`, never from request headers
- ✅ Rate limiting on all sensitive endpoints (per user + IP)
- ✅ Security headers — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.
- ✅ Password hashing with bcrypt (cost 12)
- ✅ File upload validation — MIME type, extension, magic bytes, embedded script detection
- ✅ Deposit/profile uploads restricted to images only (PDF blocked)
- ✅ Input validation with Zod on all API routes
- ✅ HTML sanitization on user-submitted content
- ✅ CSRF protection via NextAuth + Origin header check on impersonation endpoint
- ✅ Bot/scanner blocking (nikto, sqlmap, nmap, etc.)
- ✅ Suspicious URL pattern detection (SQLi, XSS, path traversal)
- ✅ Cron endpoint protected by `Authorization: Bearer` header + query param fallback
- ✅ Soft delete with login block
- ✅ Setting audit log for all admin changes

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- MySQL database (TiDB Cloud free tier recommended)
- Cloudinary account (free tier)
- SMTP email service

### 1. Clone Repository

```bash
git clone https://github.com/arifarman22/onlinebuzzmall-nextjs.git
cd onlinebuzzmall-nextjs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl={"rejectUnauthorized":true}"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_SECRET="same-as-nextauth-secret"
AUTH_TRUST_HOST=true
AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_NAME="OnlineBuzz Mall"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="noreply@example.com"
SMTP_FROM_NAME="OnlineBuzz Mall"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Cron
CRON_SECRET="generate-with-openssl-rand-base64-32"

# Crypto Payment Gateways (optional)
COINGATE_CALLBACK_SECRET="your-coingate-callback-token"
NOWPAYMENTS_IPN_SECRET="your-nowpayments-ipn-secret"
COINBASE_WEBHOOK_SECRET="your-coinbase-webhook-secret"

# Crypto Wallet Addresses (for manual deposits)
CRYPTO_BTC_ADDRESS="your-btc-wallet"
CRYPTO_ETH_ADDRESS="your-eth-wallet"
CRYPTO_USDT_TRC20_ADDRESS="your-trc20-wallet"
CRYPTO_USDT_ERC20_ADDRESS="your-erc20-wallet"
```

Generate secrets:
```bash
openssl rand -base64 32   # run once for NEXTAUTH_SECRET, once for CRON_SECRET
```

### 4. Setup Database

Pull schema from existing database:
```bash
npx prisma db pull
```

Or push the provided schema:
```bash
npx prisma db push
```

Generate Prisma Client:
```bash
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev          # webpack (stable)
npm run dev:turbo    # turbopack (faster)
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Option A — Vercel

1. Push code to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add all environment variables (use production URLs)
4. Deploy — `postinstall` runs `prisma generate` automatically

> **Note**: Vercel free tier has cold starts (~3–5s after idle). Vercel Pro reduces this to ~1–2s but does not eliminate it. For zero cold starts, use VPS.

### Option B — VPS (Recommended for performance)

Tested on **Hostinger KVM 2** (Ubuntu 22.04 LTS). No cold starts, persistent DB connections, ~0.3–0.6s page loads.

```bash
# 1. Install Node.js 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc && nvm install 20 && nvm alias default 20

# 2. Install PM2 + Nginx
npm install -g pm2
apt install -y nginx certbot python3-certbot-nginx

# 3. Clone & configure
cd /var/www
git clone https://github.com/arifarman22/onlinebuzzmall-nextjs.git
cd onlinebuzzmall-nextjs
# create .env with production values

# 4. Build & start
npm install
npm run build
pm2 start npm --name "onlinebuzzmall" -- start
pm2 save && pm2 startup
```

Nginx config (`/etc/nginx/sites-available/onlinebuzzmall`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

SSL (free Let's Encrypt):
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Deploy updates:
```bash
cd /var/www/onlinebuzzmall-nextjs
git pull origin main
npm install --omit=dev
npm run build
pm2 restart onlinebuzzmall
```

### Database — TiDB Cloud (Free)

1. Create account at [tidbcloud.com](https://tidbcloud.com)
2. Create a Serverless cluster — pick the **same region** as your Vercel/VPS deployment
3. Import database: `mysql -u USER -p -h HOST -P 4000 --ssl DATABASE < export.sql`
4. Use the connection string as `DATABASE_URL`

### Cloudinary (Free)

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret from Dashboard
3. Add to `.env`

---

## Order Flow

1. **Admin** creates an Order Set with products (manually or via CSV)
2. **Admin** assigns the Order Set to a user
3. **User** visits `/orders` — sees VIP platforms with assigned tasks
4. **User** clicks "Order Now" → task list appears
5. **User** starts a task → confirmation popup → submits
6. **Balance** is atomically deducted then credited back with profit (inside `db.$transaction`)
7. **Success popup** shows profit earned and updated balance

### CSV Upload Format

```csv
product_name,price,profit_percent,type
USB Cable,25.99,4,single
Phone Case|Screen Protector,45.00,5,combo
```

- Use `|` as separator for combo products
- Products matched by name from existing database records

---

## Impersonation System

Admins can open a user session in a new tab without affecting their own admin session.

**Flow:**
1. Admin clicks "Login as User" on any user in the admin panel
2. New tab opens → `/impersonate?token=...`
3. Page calls `/api/admin/impersonate/set-cookie` — validates JWT, sets `imp_token` httpOnly cookie
4. Redirects to `/dashboard` — user dashboard loads with impersonated user's data
5. Yellow banner shows "Impersonating [username]" with a "Close Tab" button
6. Close Tab → clears `imp_token` cookie → closes tab

**Security:**
- `imp_token` is httpOnly, secure (prod), sameSite lax, 8h expiry
- Admin's NextAuth session is untouched — both sessions coexist
- `imp_token` does NOT grant access to admin routes
- Origin header verified on set-cookie endpoint to prevent CSRF
- All financial operations (withdraw, transfer) require real NextAuth session — impersonation cannot perform them

---

## User Roles

| Role | Access |
|---|---|
| **User** | Dashboard, orders, deposits, withdrawals, wallet, profile, support |
| **Admin** | Full admin panel, user management, all financial operations |
| **Moderator** | Admin panel minus password change, delete user |
| **Support** | Read-only admin access |

---

## API Routes

### Authentication
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/check-email` | Pre-login status check |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handlers |
| `POST` | `/api/auth/otp` | Send/verify OTP |

### User
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/user/balance` | Get current balance |
| `POST` | `/api/user/profile` | Update profile |
| `POST` | `/api/user/twofactor` | 2FA setup/verify |
| `POST` | `/api/user/transfer` | Balance transfer (atomic) |
| `POST` | `/api/user/support` | Create/reply support ticket |

### Orders
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/orders/start` | Start a task |
| `POST` | `/api/orders/submit` | Complete a task (atomic transaction) |

### Financial
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/deposit/gateway` | List payment gateways |
| `POST` | `/api/deposit/gateway` | Submit deposit request |
| `POST` | `/api/withdraw/submit` | Submit withdrawal (atomic transaction) |

### Webhooks
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/webhooks/coingate` | CoinGate payment callback |
| `POST` | `/api/webhooks/nowpayments` | NOWPayments IPN |
| `POST` | `/api/webhooks/coinbase` | Coinbase Commerce webhook |

### Admin
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/admin/users` | User actions (ban, balance, password, etc.) |
| `POST` | `/api/admin/deposits/action` | Approve/reject deposit |
| `POST` | `/api/admin/withdrawals/action` | Approve/reject withdrawal |
| `GET/POST/PUT/DELETE` | `/api/admin/platforms` | Platform CRUD |
| `GET` | `/api/admin/order-sets/list` | List order sets (paginated) |
| `POST` | `/api/admin/order-sets/upload-csv` | Bulk upload via CSV |
| `POST` | `/api/admin/impersonate` | Generate impersonation token |
| `POST` | `/api/admin/impersonate/set-cookie` | Set imp_token cookie |
| `GET/DELETE` | `/api/admin/impersonate/check` | Check/clear impersonation |

### Other
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload to Cloudinary |
| `GET` | `/api/platform-rules` | Cached platform guidelines |
| `GET` | `/api/cron` | Matching bonus distribution |

---

## Scripts

```json
{
  "dev": "next dev --webpack",
  "dev:turbo": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "eslint",
  "postinstall": "prisma generate"
}
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Auth + JWT encryption key |
| `AUTH_SECRET` | ✅ | Same as `NEXTAUTH_SECRET` (Auth.js v5) |
| `AUTH_TRUST_HOST` | ✅ | Set `true` for Vercel/VPS behind proxy |
| `NEXTAUTH_URL` | ✅ | Full app base URL (e.g. `https://yourdomain.com`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL for referral links |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `SMTP_HOST` | ✅ | SMTP server host |
| `SMTP_PORT` | ✅ | SMTP port (465 or 587) |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASSWORD` | ✅ | SMTP password |
| `SMTP_FROM` | ✅ | From email address |
| `CRON_SECRET` | ✅ | Secret for cron job authorization |
| `COINGATE_CALLBACK_SECRET` | ❌ | CoinGate callback token |
| `NOWPAYMENTS_IPN_SECRET` | ❌ | NOWPayments HMAC secret |
| `COINBASE_WEBHOOK_SECRET` | ❌ | Coinbase Commerce webhook secret |
| `CRYPTO_BTC_ADDRESS` | ❌ | BTC wallet for manual deposits |
| `CRYPTO_ETH_ADDRESS` | ❌ | ETH wallet for manual deposits |
| `CRYPTO_USDT_TRC20_ADDRESS` | ❌ | USDT TRC20 wallet |
| `CRYPTO_USDT_ERC20_ADDRESS` | ❌ | USDT ERC20 wallet |

---

## Performance Notes

- **`unstable_cache`** used for platform rules and branding — cached 5 minutes, survives cold starts
- **`Promise.all`** used on all dashboard pages — DB queries run in parallel
- **`optimizePackageImports`** for `lucide-react` and `recharts` — tree-shakes unused icons/components
- **Connection pooling** — production: 5 connections, `socket_timeout=30`
- **`next/image`** used for all user avatars — automatic WebP, lazy loading, proper sizing
- On VPS: zero cold starts, persistent Prisma connection pool, ~0.3–0.6s page loads

---

## License

Private — All rights reserved.
