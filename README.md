# Pawmise

A light-hearted, private PWA for couples to track soft positive and negative “paws” toward each other — playful accountability with bulochka energy, never a scoreboard.

## Stack

- **Frontend:** React 19 + TanStack Start + Tailwind v4 (installable PWA)
- **Auth:** Better Auth — Continue with Google / X (no email-password required)
- **Database:** Postgres (Neon in production; PGLite in live preview)
- **API:** Authenticated TanStack server functions + couple-scoped access checks
- **Deploy:** Vercel-ready Nitro output

## Setup

See **[SETUP.md](./SETUP.md)** for a full beginner-friendly guide (accounts, deploy, pairing, Android install).

## App map

| Path | Purpose |
| --- | --- |
| `/login` | Google / X sign-in |
| `/onboarding` | Profile → invite/join → preference ratings |
| `/app` | Balance, weekly letter, reviews, badges |
| `/app/log` | Log “What I did” / “What partner did” |
| `/app/history` | Searchable history, export, mutual delete |
| `/app/rewards` | Gestures + wishlist buy-points |
| `/app/settings` | Themes, prefs, custom actions, unpair |

## Schema

- `migrations/0001_auth.sql` — auth (do not edit)
- `migrations/0002_paws.sql` — profiles, couples, actions, rewards, badges, notifications
