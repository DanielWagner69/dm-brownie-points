import { createFileRoute } from "@tanstack/react-router";
import {
  getSql,
  dbSource,
  isServerlessRuntime,
  MISSING_DATABASE_URL_MESSAGE,
} from "@/lib/db";

/**
 * Deploy diagnostics. Healthy permanent app:
 *   hasDatabaseUrl: true, dbSource: "neon", db: "up", tables include user+profiles,
 *   hasBetterAuthUrl: true, hasAuthSecret: true
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const serverless = isServerlessRuntime();
        const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
        const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim() || null;
        const result: Record<string, unknown> = {
          ok: true,
          dbSource,
          serverless,
          time: new Date().toISOString(),
          hasDatabaseUrl,
          hasBetterAuthUrl: Boolean(betterAuthUrl),
          betterAuthUrl,
          hasGrokClient: Boolean(process.env.GROK_AUTH_CLIENT_ID?.trim()),
          hasAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET?.trim()),
          tip: "Use email sign-in on Vercel. Google needs Grok broker keys (hasGrokClient). Set BETTER_AUTH_URL to your exact https://….vercel.app URL (no trailing slash).",
        };

        if (!hasDatabaseUrl && serverless) {
          result.ok = false;
          result.db = "missing";
          result.dbError = MISSING_DATABASE_URL_MESSAGE;
          return json(result, 503);
        }

        try {
          // getSql() also runs migrations on Neon
          const sql = await getSql();
          const one = await sql<{ n: number }>`select 1::int as n`;
          result.db = one[0]?.n === 1 ? "up" : "unexpected";

          const tables = await sql<{ name: string }>`
            select table_name as name from information_schema.tables
            where table_schema = 'public'
              and table_name in (
                'user', 'session', 'verification', 'account',
                'profiles', 'couples', '_migrations'
              )
            order by table_name`;
          result.tables = tables.map((t) => t.name);

          const migs = await sql<{ name: string }>`
            select name from _migrations order by name`.catch(() => [] as { name: string }[]);
          result.migrations = migs.map((m) => m.name);

          if (!tables.some((t) => t.name === "user")) {
            result.ok = false;
            result.schemaError =
              "Auth tables missing after migrate. Redeploy with latest code, or check build logs for migrate errors.";
          }

          try {
            await sql`
              insert into "verification" ("id", "identifier", "value", "expiresAt", "createdAt", "updatedAt")
              values (
                ${"health_" + Date.now()},
                ${"health-check"},
                ${"ok"},
                ${new Date(Date.now() + 60_000).toISOString()}::timestamptz,
                now(),
                now()
              )`;
            await sql`delete from "verification" where "identifier" = 'health-check'`;
            result.verificationWrite = "ok";
          } catch (e) {
            result.verificationWrite = "fail";
            result.verificationError = e instanceof Error ? e.message : String(e);
            result.ok = false;
          }
        } catch (e) {
          result.ok = false;
          result.db = "down";
          result.dbError = e instanceof Error ? e.message : String(e);
        }

        if (!betterAuthUrl && serverless) {
          result.ok = false;
          result.authUrlError =
            "BETTER_AUTH_URL is not set. Set it to https://YOUR-APP.vercel.app (no trailing slash) and redeploy. Missing this causes OAuth state_mismatch / invalid redirect.";
        }

        return json(result, result.ok ? 200 : 503);
      },
    },
  },
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
