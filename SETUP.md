# Pawmise — Setup & permanence

## Why Google sends you straight back to login

Your `/api/health` report:

```json
"hasDatabaseUrl": false,
"dbSource": "pglite",
"hasBetterAuthUrl": true,
"hasGrokClient": true,
"hasAuthSecret": true
```

| Piece | Status | Meaning |
| --- | --- | --- |
| Google / X auth | Configured | Broker + app client are fine |
| **Postgres (`DATABASE_URL`)** | **Missing** | Nowhere to store users, sessions, or couple data |
| PGLite fallback | Breaks on publish | Only for sandbox preview, not Vercel |

Flow today: Google signs you in at the broker → app tries to create a session in the database → **no database** → session never sticks → you’re back on “Continue with Google”.

This is **not** because you need a second always-on server. It’s because **durable Postgres was not attached to this publish**.

---

## Do you need a separate server?

**No** — for a permanent couple app you need:

1. **Hosting for the web app** (already: Vercel via this Grok publish → `*.grok.me`)
2. **A managed Postgres database** (should be Neon via `DATABASE_URL` on that same publish)

Together that is permanent: both of you open the published URL, data lives in Postgres, not on the phone.

You do **not** need to rent a VPS, run Docker, or keep a laptop on.

---

## Fix path A — stay on this builder (preferred)

The platform is supposed to inject `DATABASE_URL` (Neon) when you publish, the same way it already injected auth (`hasGrokClient`, `hasBetterAuthUrl`).

1. **Republish** the app (sometimes DB is provisioned on a later publish).
2. Open `https://YOUR-APP.grok.me/api/health` again.
3. You want at least:

```json
"ok": true,
"hasDatabaseUrl": true,
"dbSource": "neon",
"db": "up"
```

4. Then Google sign-in should keep you signed in and pairing will persist.

If after several publishes `hasDatabaseUrl` is still `false`, the platform did not attach Neon for this project — use path B, or ask Grok/platform support to enable database for the app.

---

## Fix path B — bring your own free Neon + same (or own) host

Use this if the builder never injects `DATABASE_URL`.

### 1. Create a free Postgres (Neon)

1. Go to [https://neon.tech](https://neon.tech) and create a free project.
2. Copy the connection string (looks like `postgresql://user:pass@…/neondb?sslmode=require`).
3. That string is your `DATABASE_URL`.

### 2. Point the published app at it

**If the Grok publish UI lets you set env vars**, set:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | your Neon connection string |

Auth vars are already set on your current publish (`BETTER_AUTH_URL`, `GROK_AUTH_*`, `BETTER_AUTH_SECRET`). Leave those alone.

**If you cannot set env vars in Grok**, deploy the same repo to your own Vercel project:

1. Push this project to GitHub (or import the files).
2. [vercel.com](https://vercel.com) → New Project → import.
3. Environment variables:

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Neon string |
| `BETTER_AUTH_URL` | Public site URL, e.g. `https://your-app.vercel.app` |
| `BETTER_AUTH_SECRET` | Long random secret |
| `GROK_AUTH_CLIENT_ID` / `GROK_AUTH_CLIENT_SECRET` / `GROK_AUTH_ISSUER` | Only if you still use Grok’s auth broker — otherwise you’d rewire auth (harder). Prefer fixing DB on the existing Grok publish if possible. |

4. Deploy. Build runs `npm run build` → migrations apply to Neon automatically.

### 3. Confirm

Open `/api/health` → `hasDatabaseUrl: true`, `db: "up"`.  
Then sign in with Google once more and create a paw-code.

---

## What is permanent vs temporary

| Environment | Data durability |
| --- | --- |
| Sandbox / chat preview | Temporary (PGLite, can wipe) |
| Published **with** `DATABASE_URL` | Permanent couple notebook (Neon Postgres) |
| Published **without** `DATABASE_URL` | Broken for real use (your current state) |

Photos, points, pairing, history → all go in that Postgres once `DATABASE_URL` is set. Phones only keep the installable shell + login cookie.

---

## Schema

- Auth tables: `migrations/0001_auth.sql` (do not edit)
- App tables: `migrations/0002_paws.sql`
- Applied on deploy by `npm run build` → `scripts/migrate.mjs` when `DATABASE_URL` is present
