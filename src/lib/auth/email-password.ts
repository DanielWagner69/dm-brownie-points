/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Enabled so a self-hosted Vercel + Neon deploy works without Grok's
 * Google/X broker client. Google/X buttons still appear when the broker
 * is configured (Grok publish); email works everywhere DATABASE_URL is set.
 */
export const emailAndPasswordEnabled = true;
