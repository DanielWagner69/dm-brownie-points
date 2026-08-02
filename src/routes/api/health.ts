import { createFileRoute } from "@tanstack/react-router";
import {
  getSql,
  dbSource,
  isServerlessRuntime,
  MISSING_DATABASE_URL_MESSAGE,
} from "@/lib/db";

/**
 * Deploy diagnostics. Open /api/health on the published URL.
 *
 * Healthy published app should look like:
 *   hasDatabaseUrl: true, dbSource: "neon", db: "up", ok: true
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const serverless = isServerlessRuntime();
        const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
        const result: Record<string, unknown> = {
          ok: true,
          dbSource,
          serverless,
          time: new Date().toISOString(),
          hasDatabaseUrl,
          hasBetterAuthUrl: Boolean(process.env.BETTER_AUTH_URL?.trim()),
          hasGrokClient: Boolean(process.env.GROK_AUTH_CLIENT_ID?.trim()),
          hasAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET?.trim()),
        };

        if (!hasDatabaseUrl && serverless) {
          result.ok = false;
          result.db = "missing";
          result.dbError = MISSING_DATABASE_URL_MESSAGE;
          result.fix =
            "Your auth is ready, but no Postgres was attached on publish. " +
            "Republish and ensure the platform injects DATABASE_URL (Neon), " +
            "or add your own Neon connection string as DATABASE_URL in the deploy env. " +
            "You do NOT need a separate always-on server — Vercel + Neon is permanent.";
          return json(result, 503);
        }

        try {
          const sql = await getSql();
          const one = await sql<{ n: number }>`select 1::int as n`;
          result.db = one[0]?.n === 1 ? "up" : "unexpected";

          const tables = await sql<{ name: string }>`
            select table_name as name from information_schema.tables
            where table_schema = 'public'
              and table_name in ('user', 'session', 'verification', 'account', 'profiles', 'couples')
            order by table_name`;
          result.tables = tables.map((t) => t.name);

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
