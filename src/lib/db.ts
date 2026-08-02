/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

// An empty/whitespace DATABASE_URL (an easy misconfig in deploy UIs) must mean
// "unset" — otherwise production would silently run on the PGLite fallback.
const rawDatabaseUrl =
  typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
const databaseUrl =
  rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : undefined;

/**
 * True on Vercel / AWS Lambda / other serverless hosts where the embedded
 * PGLite WASM DB cannot open files under `/var/task`.
 */
export function isServerlessRuntime(): boolean {
  if (typeof process === "undefined") return false;
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.CF_PAGES,
  );
}

/**
 * Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
 * sandbox), otherwise a local embedded **PGLite** (preview only).
 * On serverless without DATABASE_URL we do NOT fall back to PGLite — that path
 * crashes and makes Google sign-in bounce back to login with no explanation.
 */
export const dbSource: DbSource = databaseUrl ? "neon" : "pglite";

/** Human-readable reason when production has no durable database. */
export const MISSING_DATABASE_URL_MESSAGE =
  "This published app has no DATABASE_URL (Postgres). Auth is set up, but there is nowhere to store accounts or couple data. The platform must attach a Neon database on publish, or you set DATABASE_URL yourself. Preview PGLite cannot run on the live host.";

export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
};

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

async function ensurePglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (isServerlessRuntime()) {
    throw new Error(MISSING_DATABASE_URL_MESSAGE);
  }

  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });

  const pg = await globalRef.__pgliteInstance__;

  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = new Set(doneRows.rows.map((r) => r.name));
    for (const [path, text] of Object.entries(migrations).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const name = path.split("/").pop() as string;
      if (done.has(name)) continue;
      await pg.transaction(async (tx) => {
        await tx.exec(text);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined)
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return pg;
}

async function createPgliteSql(): Promise<Sql> {
  const pg = await ensurePglite();
  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}

export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null;
    throw err;
  });
  return sqlPromise;
}

/** Shared PGLite instance (preview only), migrations applied. */
export function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (dbSource !== "pglite") {
    return Promise.reject(
      new Error("getPglite() is only available when DATABASE_URL is unset (preview)"),
    );
  }
  return ensurePglite();
}

/**
 * Kick schema bootstrap early in dev (and for Better Auth's PGLite dialect).
 * On serverless without DATABASE_URL this is a no-op (we fail clearly on first query).
 */
export async function ensureDbReady(): Promise<void> {
  if (dbSource === "pglite" && isServerlessRuntime()) return;
  await getSql();
}
