import { getSql } from "@/lib/db";
import { id } from "@/lib/utils";

type VapidPair = { publicKey: string; privateKey: string };

async function loadWebPush() {
  return import("web-push");
}

export async function getVapidKeys(): Promise<VapidPair> {
  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };

  const sql = await getSql();
  const rows = await sql<{ key: string; value: string }>`
    select key, value from app_config where key in ('vapid_public', 'vapid_private')`;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (map.vapid_public && map.vapid_private) {
    return { publicKey: map.vapid_public, privateKey: map.vapid_private };
  }

  const webpush = await loadWebPush();
  const generated = webpush.generateVAPIDKeys();
  await sql`
    insert into app_config (key, value) values ('vapid_public', ${generated.publicKey})
    on conflict (key) do nothing`;
  await sql`
    insert into app_config (key, value) values ('vapid_private', ${generated.privateKey})
    on conflict (key) do nothing`;
  const again = await sql<{ key: string; value: string }>`
    select key, value from app_config where key in ('vapid_public', 'vapid_private')`;
  const saved = Object.fromEntries(again.map((r) => [r.key, r.value]));
  return {
    publicKey: saved.vapid_public ?? generated.publicKey,
    privateKey: saved.vapid_private ?? generated.privateKey,
  };
}

export async function saveSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const sql = await getSql();
  await sql`
    insert into push_subscriptions (id, user_id, endpoint, p256dh, auth)
    values (${id("ps")}, ${input.userId}, ${input.endpoint}, ${input.p256dh}, ${input.auth})
    on conflict (endpoint) do update set
      user_id = excluded.user_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth`;
}

export async function removeSubscription(userId: string, endpoint?: string) {
  const sql = await getSql();
  if (endpoint) {
    await sql`
      delete from push_subscriptions
      where user_id = ${userId} and endpoint = ${endpoint}`;
    return;
  }
  await sql`delete from push_subscriptions where user_id = ${userId}`;
}

export async function hasSubscription(userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from push_subscriptions where user_id = ${userId}`;
  return (rows[0]?.n ?? 0) > 0;
}

export async function sendPushToUser(userId: string, title: string, body: string) {
  const sql = await getSql();
  const subs = await sql<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>`select id, endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`;
  if (subs.length === 0) return;

  let keys: VapidPair;
  try {
    keys = await getVapidKeys();
  } catch {
    return;
  }

  let webpush: Awaited<ReturnType<typeof loadWebPush>>;
  try {
    webpush = await loadWebPush();
  } catch {
    return;
  }

  const payload = JSON.stringify({
    title,
    body,
    url: "/app",
  });

  webpush.setVapidDetails("mailto:hello@pawmise.app", keys.publicKey, keys.privateKey);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await sql`delete from push_subscriptions where id = ${sub.id}`;
      }
    }
  }
}
