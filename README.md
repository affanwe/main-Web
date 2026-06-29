# Woora Investment Management System

Private admin panel for managing investors, shares, and profit distribution at Woora Group.

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Coolify on VPS
- **Auth**: Custom email/password + 2FA (EmailJS OTP)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide, architecture details, and post-deployment checklist.

The app auto-deploys to `https://yeoproadmin.wooragroup.com` on push to `main`.

## Project Structure

```
app/            # Next.js App Router pages
components/     # React components (sidebar, modals, tables)
src/
  supabase.js   # Supabase client configuration
  db.js         # Database operations layer
  email.js      # EmailJS integration (OTP, receipts)
public/         # Static assets
```
