# Woora Investment Management System - Deployment Guide

## Architecture Overview

- **Application**: Next.js 15 (App Router, standalone output)
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Hosting**: Coolify v4.1.2 on VPS (Ubuntu, 6GB RAM)
- **Proxy**: Traefik (managed by Coolify) with automatic HTTPS
- **CI/CD**: GitHub webhook auto-deploy on push to `main`
- **Domain**: `yeoproadmin.wooragroup.com`

## Infrastructure Details

| Component        | Detail                                      |
|------------------|---------------------------------------------|
| VPS Provider     | Akamai/Linode                               |
| VPS IP           | `104.237.9.158`                             |
| Coolify Dashboard| `http://104.237.9.158:8000`                 |
| Supabase Project | `iskwvbwowfzhdbniwncd` (ap-southeast-1)    |
| GitHub Repo      | `affanwe/main-Web`                          |
| Build System     | Nixpacks (auto-detects Next.js)             |
| Node Version     | 22 (set via `NIXPACKS_NODE_VERSION`)        |

## Environment Variables (Coolify)

These are configured in Coolify's Environment Variables panel (Developer view):

| Variable                          | Purpose                        |
|-----------------------------------|--------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase API endpoint          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase anonymous key         |
| `NIXPACKS_NODE_VERSION`           | Pin Node.js version to 22      |
| `NODE_ENV`                        | Set to `production`            |
| `PORT`                            | Set to `3000`                  |

**Never commit secrets to the repository.** All sensitive values must be set exclusively through Coolify's environment variable UI.

## Deployment Workflow

### Automatic (CI/CD)

1. Push code to the `main` branch on GitHub
2. GitHub webhook triggers Coolify auto-deploy
3. Coolify pulls the latest code via Nixpacks
4. Nixpacks builds the Next.js standalone app
5. New container replaces the old one (zero-downtime)
6. App is live at `https://yeoproadmin.wooragroup.com`

### Manual Deploy

1. Log into Coolify at `http://104.237.9.158:8000`
2. Navigate to Projects > Default Project > production
3. Click "Deploy" button on the application

### Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Supabase credentials fall back to hardcoded values in `src/supabase.js` for local dev (see Security Notes).

## Authentication

- Custom email/password authentication (not Supabase Auth)
- 2FA via EmailJS OTP sent to admin email
- Admin users stored in `admin_users` table
- Session persisted in `localStorage`
- Access restricted to founders/CEO/co-founders only

## Database Schema (Supabase)

| Table              | Purpose                                    |
|--------------------|--------------------------------------------|
| `admin_users`      | Admin login credentials                    |
| `investors`        | Investor profiles and contact info         |
| `shares`           | Share ownership records                    |
| `share_transactions` | BUY/SELL/TRANSFER history               |
| `pnl_records`      | Profit & loss entries                      |
| `fund_records`     | Fund deposit/withdrawal tracking           |

Profit distribution: 45% company, 25% investor, 20% reserve, 10% marketing.

## Monitoring

### Server Metrics (Coolify Dashboard)
- CPU and Memory usage charts (live, 5-minute interval)
- Sentinel agent active with 10-second metrics rate, 7-day history
- Docker cleanup runs daily at midnight (`0 0 * * *`)

### Notification Events Enabled
- Deployment Success/Failure
- Container Status Changes
- Backup Failure
- Server Disk Usage alerts
- Server Reachable/Unreachable
- Docker Cleanup Failure
- Server Patching
- Traefik Proxy Outdated

### Setting Up Email Alerts
Email notifications require SMTP configuration in Coolify:
1. Go to Notifications > Email
2. Fill in From Name, From Address
3. Configure SMTP Server (Host, Port, Encryption, Username, Password/API Key)
4. Click "Send Test Email" to verify
5. The notification events above will then deliver to the configured email

## Security Notes

1. **Credential Rotation**: Rotate the Coolify admin password and VPS root password after initial setup
2. **Supabase Fallback Keys**: `src/supabase.js` contains hardcoded fallback credentials for local dev. In production, environment variables override these. Consider removing the fallbacks in a future update.
3. **Password Storage**: The `admin_users` table stores passwords in the `password_hash` column. Ensure these are properly hashed (not plaintext).
4. **RLS Policies**: All Supabase tables have Row-Level Security enabled with permissive policies. Review and tighten these for production use.
5. **HTTPS**: Traefik handles TLS termination automatically via Let's Encrypt.

## Troubleshooting

### App not loading after deploy
1. Check Coolify deployment logs for build errors
2. Verify environment variables are set correctly
3. Check container status in Coolify dashboard

### Database connection issues
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Check Supabase project status at `https://supabase.com/dashboard`
3. Ensure RLS policies allow the required operations

### Webhook not triggering
1. Verify webhook exists: `gh api repos/affanwe/main-Web/hooks`
2. Check webhook deliveries on GitHub (Settings > Webhooks)
3. Ensure Auto Deploy is enabled in Coolify (Application > Advanced)

### Container keeps restarting
1. Check logs in Coolify for runtime errors
2. Verify `PORT=3000` environment variable is set
3. Ensure `standalone` output mode is in `next.config.js`

## Post-Deployment Checklist

- [x] Application deployed and accessible at `https://yeoproadmin.wooragroup.com`
- [x] HTTPS/TLS certificate active (Traefik + Let's Encrypt)
- [x] GitHub webhook configured for auto-deploy on push to `main`
- [x] Environment variables set in Coolify (not in code)
- [x] Supabase database connected with 3 admin users
- [x] Server metrics enabled (CPU, Memory monitoring)
- [x] Sentinel active and in sync
- [x] Docker cleanup scheduled daily
- [x] Notification events configured for critical alerts
- [ ] SMTP configured for email notifications (requires SMTP provider)
- [ ] Rotate VPS root password
- [ ] Rotate Coolify admin password
- [ ] Hash admin user passwords (currently plaintext)
- [ ] Tighten Supabase RLS policies
- [ ] Remove hardcoded Supabase fallback keys from `src/supabase.js`
