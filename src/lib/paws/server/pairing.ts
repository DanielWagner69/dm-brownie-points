import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { STARTER_REWARDS } from "../defaults";
import { id, inviteCode } from "@/lib/utils";
import {
  getProfile,
  ensureProfile,
  getActiveCouple,
  partnerIdOf,
  seedDefaults,
  notify,
  buildExportCsv,
} from "./helpers";

type Ctx = { userId: string };

export const createInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const existing = await getActiveCouple(userId);
    if (existing) {
      if (existing.user_b) throw new Error("You’re already paired, little one");
      return existing;
    }
    const sql = await getSql();
    const code = inviteCode();
    const coupleId = id("cp");
    await sql`
      insert into couples (id, invite_code, user_a)
      values (${coupleId}, ${code}, ${userId})`;
    await seedDefaults(coupleId, userId);
    return { id: coupleId, invite_code: code, user_a: userId, user_b: null as string | null };
  });

export const joinWithCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim().toUpperCase())
  .handler(async ({ context, data: code }) => {
    const { userId } = context as Ctx;
    if (await getActiveCouple(userId)) {
      throw new Error("You’re already in a little pair");
    }
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      invite_code: string;
      user_a: string;
      user_b: string | null;
    }>`
      select id, invite_code, user_a, user_b from couples
      where invite_code = ${code} and unpaired_at is null`;
    const c = rows[0];
    if (!c) throw new Error("That invite code doesn’t match any little world");
    if (c.user_a === userId) throw new Error("That’s your own invite, softie");
    if (c.user_b) throw new Error("This pair already has two hearts");
    await sql`update couples set user_b = ${userId} where id = ${c.id} and user_b is null`;
    for (const r of STARTER_REWARDS) {
      await sql`
        insert into rewards (id, couple_id, created_by, name, description, repeatable, kind)
        values (${id("rw")}, ${c.id}, ${userId}, ${r.name}, ${r.description}, true, 'gesture')`;
    }
    const aName = (await getProfile(c.user_a))?.display_name ?? "Your partner";
    const bName = (await getProfile(userId))?.display_name ?? "Your partner";
    await notify(c.user_a, c.id, "action", "You're paired", `${bName} joined your little world.`);
    await notify(userId, c.id, "action", "You're paired", `You’re paired with ${aName}. Soft mode: on.`);
    await sql`update profiles set onboarding_step = 'done' where user_id = ${userId}`;
    await sql`update profiles set onboarding_step = 'done' where user_id = ${c.user_a}`;
    return { ok: true, couple_id: c.id };
  });

export const unpair = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { exportFirst: boolean }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) throw new Error("Not paired");
    const sql = await getSql();
    let exportCsv: string | null = null;
    if (data.exportFirst) {
      exportCsv = await buildExportCsv(c.id);
    }
    await sql`delete from notifications where couple_id = ${c.id}`;
    await sql`delete from deletion_requests where couple_id = ${c.id}`;
    await sql`delete from badges where couple_id = ${c.id}`;
    await sql`delete from streaks where couple_id = ${c.id}`;
    await sql`delete from reward_claims where couple_id = ${c.id}`;
    await sql`delete from rewards where couple_id = ${c.id}`;
    await sql`delete from logged_actions where couple_id = ${c.id}`;
    await sql`delete from action_preferences where action_type_id in (select id from action_types where couple_id = ${c.id})`;
    await sql`delete from action_types where couple_id = ${c.id}`;
    await sql`delete from action_categories where couple_id = ${c.id}`;
    await sql`delete from couples where id = ${c.id}`;
    await sql`update profiles set onboarding_step = 'pairing' where user_id = ${c.user_a}`;
    if (c.user_b) {
      await sql`update profiles set onboarding_step = 'pairing' where user_id = ${c.user_b}`;
    }
    return { ok: true, exportCsv };
  });
