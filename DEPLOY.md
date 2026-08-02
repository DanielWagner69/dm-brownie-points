# Permanent deploy: GitHub → Vercel + Neon

Your code lives at: https://github.com/DanielWagner69/dm-brownie-points

This makes Pawmise **permanent** (shared Postgres, not the temporary sandbox).

---

## Security first (do this before deploy)

1. Your Neon password was shared in chat earlier — **reset it** in the Neon console, then use the **new** connection string.
2. Your GitHub repo is **public**. Never put `DATABASE_URL` or secrets in any file you commit.
3. Secrets go **only** in Vercel Environment Variables.

---

## Overview

| Piece | Service | Role |
| --- | --- | --- |
| Code | GitHub | Source of truth |
| Website | Vercel (free) | Hosts the app |
| Database | Neon (free) | Stores accounts + couple data |

You do **not** need a VPS or always-on PC.

**Sign-in on your own Vercel URL:** use **email + password** (reliable).  
Google/X on a custom host need Grok’s auth broker credentials, which this DIY path does not include. Both partners create their own email account, then pair with a paw-code.

---

## Step 1 — Neon (database)

You already created Neon. Confirm you have a connection string like:

```text
postgresql://neondb_owner:PASSWORD@ep-xxxxx-pooler….neon.tech/neondb?sslmode=require
```

Prefer the **pooled** connection string.  
If Node has trouble with `channel_binding=require`, remove that part and keep `sslmode=require`.

**Reset password** if the old one was exposed, then copy the new string into a private note.

---

## Step 2 — Vercel account

1. Open https://vercel.com/signup  
2. **Continue with GitHub**  
3. Authorize Vercel to access your GitHub (at least `DanielWagner69/dm-brownie-points`)

---

## Step 3 — Import the project

1. Vercel dashboard → **Add New…** → **Project**  
2. Find **dm-brownie-points** → **Import**  
3. Framework preset: leave default (Vite / other is fine)  
4. Root directory: `.` (default)  
5. Build settings (defaults are usually fine):
   - **Build Command:** `npm run build`  
   - **Install Command:** `npm install`  
6. **Do not click Deploy yet** — add env vars first (next step).  
   If the UI only lets you deploy first, deploy once, add env vars, then **Redeploy**.

---

## Step 4 — Environment variables (critical)

In the import screen or **Project → Settings → Environment Variables**, add:

### Required

| Name | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Your Neon connection string | No quotes, no spaces |
| `BETTER_AUTH_SECRET` | Long random string (32+ chars) | e.g. from https://generate-secret.vercel.app/32 |
| `BETTER_AUTH_URL` | `https://YOUR-PROJECT.vercel.app` | No trailing slash. After first deploy, copy the real URL and set this, then redeploy if needed |

### Recommended

| Name | Value |
| --- | --- |
| `VITE_AUTH_ENABLED` | `true` |

Apply to **Production** (and Preview if you want).

**Generate a secret:** open https://generate-secret.vercel.app/32 → copy → paste as `BETTER_AUTH_SECRET`.

**`BETTER_AUTH_URL`:**  
- First deploy might create `https://dm-brownie-points.vercel.app` or similar.  
- Copy that exact `https://…` URL (from Vercel → Domains).  
- Set `BETTER_AUTH_URL` to it **without** a trailing `/`.  
- **Redeploy** so auth trusts that origin.

---

## Step 5 — Deploy

1. Click **Deploy**  
2. Wait until the build is **Ready** (green)  
3. Open the deployment URL  

During `npm run build`, migrations run against Neon and create tables automatically. You do not run SQL by hand.

---

## Step 6 — Verify database

Open:

```text
https://YOUR-PROJECT.vercel.app/api/health
```

You want:

```json
{
  "ok": true,
  "hasDatabaseUrl": true,
  "dbSource": "neon",
  "db": "up"
}
```

| If you see | Do this |
| --- | --- |
| `hasDatabaseUrl: false` | Env var missing or not applied → check name `DATABASE_URL`, redeploy |
| `db: "down"` | Wrong Neon string / password → reset Neon password, update env, redeploy |
| `ok: true` | Database is permanent — continue |

---

## Step 7 — Create accounts and pair

1. Open the Vercel site → login page  
2. **Partner A:** “Create an account” → email + password (8+) → finish onboarding → **create paw-code**  
3. **Partner B:** same site → **their own** email account → **join with the paw-code**  
4. Install as PWA on Android if you want (Chrome → Add to Home screen)

Use **only this Vercel URL** day to day (not the old Grok sandbox / broken grok.me publish without DB).

---

## Step 8 — Optional custom domain later

In Vercel → **Settings → Domains**, add `yourdomain.com` **after** the app works on `.vercel.app`.  
Then update `BETTER_AUTH_URL` to `https://yourdomain.com` and redeploy.  
(Grok’s “Custom Domain” field is not how you set the database.)

---

## Updating the app later

1. Push code to `main` on GitHub  
2. Vercel auto-redeploys  
3. New migrations in `migrations/` apply on build when `DATABASE_URL` is set  

---

## What not to do

- Do **not** commit `.env` or paste Neon passwords into GitHub  
- Do **not** use the sandbox preview for permanent couple data  
- Do **not** put secrets in `SETUP.md` or source files  

---

## Checklist

- [ ] Neon project exists; password rotated if it was shared  
- [ ] GitHub repo has the latest code  
- [ ] Vercel project imported from that repo  
- [ ] `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` set  
- [ ] Deploy green  
- [ ] `/api/health` → `hasDatabaseUrl: true`, `db: "up"`  
- [ ] Both partners registered with email and paired  
