# OnlineBuzz Mall - Next.js Full Stack E-Commerce MLM Platform

A full-stack e-commerce MLM (Multi-Level Marketing) platform built with Next.js 16, featuring a binary tree referral system, order management, crypto deposits/withdrawals, and a comprehensive admin panel.

## Live Demo

- **Production**: [https://onlinebuzzmall-nextjs.vercel.app](https://onlinebuzzmall-nextjs.vercel.app)

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Database** | MySQL (TiDB Cloud) via Prisma ORM |
| **Authentication** | NextAuth.js v5 (Auth.js) |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand |
| **File Uploads** | Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **Charts** | Recharts |
| **Language** | TypeScript |
| **Deployment** | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register, OTP verification
│   ├── (dashboard)/         # User dashboard pages
│   │   ├── dashboard/       # Main dashboard with stats & charts
│   │   ├── orders/          # Platform orders & task completion
│   │   │   └── [platformId]/ # Individual platform tasks
│   │   ├── deposit/         # Deposit funds
│   │   ├── withdraw/        # Withdraw funds
│   │   ├── transactions/    # Transaction history
│   │   ├── profile/         # User profile & security
│   │   ├── support/         # Support tickets
│   │   ├── invite/          # Referral system
│   │   ├── tree/            # Binary tree visualization
│   │   └── transfer/        # Balance transfer
│   ├── admin/               # Admin panel
│   │   ├── users/           # User management
│   │   ├── deposits/        # Deposit approval/rejection
│   │   ├── withdrawals/     # Withdrawal management
│   │   ├── platforms/       # Platform CRUD
│   │   ├── order-sets/      # Order set management
│   │   └── ...              # Other admin pages
│   └── api/                 # API routes
│       ├── auth/            # Authentication endpoints
│       ├── admin/           # Admin API routes
│       ├── deposit/         # Deposit processing
│       ├── withdraw/        # Withdrawal processing
│       ├── orders/          # Order start/submit
│       ├── upload/          # File upload (Cloudinary)
│       └── user/            # User profile/settings
├── components/
│   ├── ui/                  # Reusable UI components (Button, Card, Badge, etc.)
│   ├── layout/             # Layout components (Sidebar, BottomNav)
│   ├── dashboard/          # User dashboard components
│   └── admin/              # Admin panel components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client
│   ├── mlm.ts              # MLM/binary tree logic
│   ├── email.ts            # Email utilities (Nodemailer)
│   ├── utils.ts            # Helper functions
│   ├── security.ts         # Security middleware
│   ├── rate-limit.ts       # Rate limiting
│   └── validations/        # Zod validation schemas
├── types/                   # TypeScript type definitions
├── store/                   # Zustand stores
├── hooks/                   # Custom React hooks
└── middleware.ts            # Route protection & security headers
```

## Features

### User Features

- ✅ User registration with referral system (binary tree)
- ✅ User login (compatible with existing Laravel bcrypt passwords)
- ✅ Dashboard with balance, stats, charts, quick actions
- ✅ Order system with platform-based tasks (VIP levels)
- ✅ Order confirmation popup & success popup
- ✅ Deposit system with multiple payment gateways
- ✅ Withdrawal system
- ✅ Transaction history
- ✅ Referral/invite system (multi-level with user ID)
- ✅ Profile management & password change
- ✅ Profile picture upload (Cloudinary)
- ✅ Balance transfer between users
- ✅ KYC submission system
- ✅ Support ticket system (create, reply, view)
- ✅ 2FA (Google Authenticator) with TOTP verification
- ✅ Binary tree visualization (3-level visual tree)
- ✅ Mobile bottom navigation + Desktop sidebar
- ✅ Responsive design (mobile-first)

### Admin Features

- ✅ Admin dashboard with statistics & graphs
- ✅ User management (ban/unban, delete, balance adjust, freeze, password change)
- ✅ Order set management + CSV bulk upload
- ✅ Order set assignment to users
- ✅ Platform CRUD with on/off toggle switch
- ✅ Deposit approval/rejection with full user transaction history
- ✅ Withdrawal approval/rejection with auto-refund
- ✅ Support ticket management (reply, close)
- ✅ Commission levels (deposit + withdrawal)
- ✅ Reports (transactions, login history, commissions)
- ✅ Plan management
- ✅ VIP rank management & assignment
- ✅ Impersonate user (login as user)

### Payment & Crypto

- ✅ Manual crypto deposit (wallet address, admin approval)
- ✅ CoinGate payment gateway
- ✅ NOWPayments gateway
- ✅ Coinbase Commerce gateway
- ✅ Webhook handlers for all 3 crypto gateways
- ✅ Payment proof upload

### Security

- ✅ JWT-based authentication with role separation
- ✅ Rate limiting on sensitive endpoints
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Password hashing with bcrypt
- ✅ File upload validation (type, size, magic bytes)
- ✅ Input validation with Zod schemas
- ✅ CSRF protection via NextAuth
- ✅ Account deletion (soft delete with login block)

## Setup Instructions

### Prerequisites

- Node.js 18+
- MySQL database (local or cloud)
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
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
AUTH_SECRET="your-secret-key"
AUTH_TRUST_HOST=true
AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_NAME="OnlineBuzz Mall"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="noreply@example.com"
SMTP_FROM_NAME="OnlineBuzz Mall"

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Cron Secret
CRON_SECRET="your-cron-secret"

# Crypto Wallet Addresses (for manual deposits)
CRYPTO_BTC_ADDRESS="your-btc-wallet"
CRYPTO_ETH_ADDRESS="your-eth-wallet"
CRYPTO_USDT_TRC20_ADDRESS="your-trc20-wallet"
CRYPTO_USDT_ERC20_ADDRESS="your-erc20-wallet"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Setup Database

If using an existing database, pull the schema:
```bash
npx prisma db pull
```

Or push the provided schema:
```bash
npx prisma db push
```

Generate the Prisma Client:
```bash
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Run with Turbopack (faster)

```bash
npm run dev:turbo
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add all environment variables (use production URLs)
4. Deploy

The `postinstall` script automatically runs `prisma generate` during build.

### Database (TiDB Cloud - Free)

1. Create account at [tidbcloud.com](https://tidbcloud.com)
2. Create a Serverless cluster
3. Import your database using MySQL CLI:
```bash
mysql -u USER -p -h HOST -P 4000 --ssl DATABASE < export.sql
```
4. Use the connection string as `DATABASE_URL`

### Cloudinary Setup (Free)

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get Cloud Name, API Key, API Secret from Dashboard
3. Add to environment variables

### VPS Deployment (Alternative)

```bash
# Build
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name "onlinebuzzmall" -- start
pm2 save
pm2 startup
```

Nginx reverse proxy:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Order Flow

1. **Admin** creates an Order Set with products (manually or via CSV upload)
2. **Admin** assigns the Order Set to a user
3. **User** sees platforms on `/orders` page (VIP 1, VIP 2, VIP 3)
4. **User** clicks "Order Now" → sees task list
5. **User** starts a task → confirms order in popup → completes task
6. **Balance** is deducted then credited back with commission
7. **Success popup** shows profit earned

### CSV Upload Format

```
product_name,price,profit_percent,type
USB Cable,25.99,4,single
Phone Case|Screen Protector,45.00,5,combo
```

- Use `|` as separator for combo products
- Products are matched by name from existing database records

## User Roles

| Role | Access |
|------|--------|
| **User** | Dashboard, orders, deposits, withdrawals, profile |
| **Admin** | Full admin panel, user management, financial operations |

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/check-email` - Pre-login email/status check
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### User
- `GET /api/user/balance` - Get user balance
- `POST /api/user/profile` - Update profile
- `POST /api/user/otp` - Send/verify OTP
- `POST /api/user/twofactor` - 2FA setup/verify
- `POST /api/user/transfer` - Balance transfer
- `POST /api/user/support` - Create/reply support tickets

### Orders
- `POST /api/orders/start` - Start a task
- `POST /api/orders/submit` - Complete a task

### Financial
- `GET/POST /api/deposit/gateway` - Get gateways / submit deposit
- `POST /api/withdraw/submit` - Submit withdrawal

### Admin
- `POST /api/admin/users` - User actions (ban, delete, adjust balance, etc.)
- `POST /api/admin/deposits/action` - Approve/reject deposits
- `POST /api/admin/withdrawals/action` - Approve/reject withdrawals
- `GET/POST/PUT/DELETE /api/admin/platforms` - Platform CRUD
- `GET /api/admin/order-sets/list` - List order sets (paginated)
- `POST /api/admin/order-sets/upload-csv` - Bulk upload orders via CSV

### File Upload
- `POST /api/upload` - Upload file to Cloudinary (profile, kyc, deposit proof)

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

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Auth encryption key |
| `AUTH_SECRET` | ✅ | Same as NEXTAUTH_SECRET (Auth.js v5) |
| `AUTH_TRUST_HOST` | ✅ | Set to `true` for Vercel |
| `NEXTAUTH_URL` | ✅ | App base URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL (for referral links) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `SMTP_HOST` | ✅ | SMTP server host |
| `SMTP_PORT` | ✅ | SMTP port |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASSWORD` | ✅ | SMTP password |
| `SMTP_FROM` | ✅ | From email address |
| `CRON_SECRET` | ❌ | Secret for cron API calls |
| `CRYPTO_*_ADDRESS` | ❌ | Wallet addresses for manual deposits |

## License

Private - All rights reserved.
