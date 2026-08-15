import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { clampBasePoints } from "@/lib/utils";
import type { ActionAppliesTo, ActionCategory, ActionType } from "../types";
import { isLockedCategory } from "../defaults";
import {
  getActiveCouple,
  partnerIdOf,
  syncDefaultActions,
  syncCategories,
} from "./helpers";

type Ctx = { userId: string };

function normalizeAppliesTo(v: unknown): ActionAppliesTo {
  if (v === "user_a" || v === "user_b" || v === "both") return v;
  return "both";
}

export const savePreferences = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((prefs: { action_type_id: number; preferred_points: number }[]) => prefs)
  .handler(async ({ context, data: prefs }) => {
    const { userId } = context as Ctx;
    const sql = await getSql();
    for (const p of prefs) {
      const pts = clampBasePoints(p.preferred_points);
      await sql`
        insert into action_preferences (user_id, action_type_id, preferred_points)
        values (${userId}, ${p.action_type_id}, ${pts})
        on conflict (user_id, action_type_id)
        do update set preferred_points = excluded.preferred_points`;
    }
    return { ok: true };
  });

export const listActionTypes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c || !c.user_b) return [] as ActionType[];
    await syncDefaultActions(c.id, userId);
    await syncCategories(c.id);
    const sql = await getSql();
    const partner = partnerIdOf(c, userId);
    const rows = await sql<ActionType>`
      select at.id, at.couple_id, at.name, at.kind, at.base_points, at.category,
             at.is_default, at.archived,
             coalesce(at.applies_to, 'both') as applies_to,
             ap.preferred_points
      from action_types at
      left join action_preferences ap
        on ap.action_type_id = at.id and ap.user_id = ${partner}
      where at.couple_id = ${c.id} and at.archived = false
      order by at.kind desc, at.base_points desc, at.name`;
    return rows.map((r) => ({
      ...r,
      applies_to: normalizeAppliesTo(r.applies_to),
    }));
  });

export const listMyPreferenceTargets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) return [] as (ActionType & { my_points: number | null })[];
    await syncDefaultActions(c.id, userId);
    await syncCategories(c.id);
    const sql = await getSql();
    const rows = await sql<ActionType & { my_points: number | null }>`
      select at.id, at.couple_id, at.name, at.kind, at.base_points, at.category,
             at.is_default, at.archived,
             coalesce(at.applies_to, 'both') as applies_to,
             at.base_points as preferred_points,
             ap.preferred_points as my_points
      from action_types at
      left join action_preferences ap
        on ap.action_type_id = at.id and ap.user_id = ${userId}
      where at.couple_id = ${c.id} and at.archived = false
      order by at.kind desc, at.base_points desc, at.name`;
    return rows.map((r) => ({
      ...r,
      applies_to: normalizeAppliesTo(r.applies_to),
    }));
  });

export const upsertActionType = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id?: number;
      name: string;
      kind: "positive" | "negative";
      base_points: number;
      category?: string;
      archive?: boolean;
      applies_to?: ActionAppliesTo;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Pair first");
    const sql = await getSql();
    const points = clampBasePoints(data.base_points);
    const category = (data.category ?? "general").trim() || "general";
    const applies = normalizeAppliesTo(data.applies_to);
    await syncCategories(c.id);
    if (data.id) {
      await sql`
        update action_types set
          name = ${data.name},
          kind = ${data.kind},
          base_points = ${points},
          category = ${category},
          archived = ${data.archive ?? false},
          applies_to = ${applies}
        where id = ${data.id} and couple_id = ${c.id}`;
      return { id: data.id };
    }
    const rows = await sql<{ id: number }>`
      insert into action_types (couple_id, name, kind, base_points, category, created_by, applies_to)
      values (${c.id}, ${data.name}, ${data.kind}, ${points}, ${category}, ${userId}, ${applies})
      returning id`;
    return { id: rows[0].id };
  });

export const listCategories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) return [] as ActionCategory[];
    await syncCategories(c.id);
    const sql = await getSql();
    return sql<ActionCategory>`
      select ac.id, ac.couple_id, ac.name, ac.archived,
        (
          select count(*)::int from action_types at
          where at.couple_id = ac.couple_id
            and lower(at.category) = lower(ac.name)
            and at.archived = false
        ) as action_count
      from action_categories ac
      where ac.couple_id = ${c.id} and ac.archived = false
      order by ac.name`;
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: { id?: number; name: string; archive?: boolean }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Pair first");
    const sql = await getSql();
    const name = data.name.trim();
    if (!name) throw new Error("Give the group a name");
    if (name.length > 40) throw new Error("Keep group names under 40 characters");

    if (data.id && data.archive) {
      const rows = await sql<{ name: string }>`
        select name from action_categories
        where id = ${data.id} and couple_id = ${c.id}`;
      const old = rows[0]?.name;
      if (!old) throw new Error("Group not found");
      if (isLockedCategory(old)) {
        throw new Error(
          old.toLowerCase() === "general"
            ? "\u201cgeneral\u201d stays \u2014 it\u2019s the fallback group"
            : `\u201c${old}\u201d is a love-language group and can\u2019t be removed (badges use it)`,
        );
      }
      await sql`
        update action_types set category = 'general'
        where couple_id = ${c.id} and lower(category) = lower(${old})`;
      await sql`
        update logged_actions set category = 'general'
        where couple_id = ${c.id} and lower(category) = lower(${old})`;
      await sql`
        update action_categories set archived = true
        where id = ${data.id} and couple_id = ${c.id}`;
      const general = await sql<{ id: number }>`
        select id from action_categories
        where couple_id = ${c.id} and lower(name) = 'general' and archived = false`;
      if (!general[0]) {
        await sql`
          insert into action_categories (couple_id, name)
          values (${c.id}, 'general')`;
      }
      return { id: data.id, archived: true as const };
    }

    if (data.id) {
      const rows = await sql<{ name: string }>`
        select name from action_categories
        where id = ${data.id} and couple_id = ${c.id}`;
      const old = rows[0]?.name;
      if (!old) throw new Error("Group not found");
      if (isLockedCategory(old)) {
        throw new Error(
          old.toLowerCase() === "general"
            ? "\u201cgeneral\u201d can\u2019t be renamed"
            : `\u201c${old}\u201d is a love-language group and can\u2019t be renamed (badges use it)`,
        );
      }
      if (old.toLowerCase() === name.toLowerCase()) return { id: data.id };
      const clash = await sql<{ id: number }>`
        select id from action_categories
        where couple_id = ${c.id} and lower(name) = lower(${name}) and archived = false
          and id != ${data.id}`;
      if (clash[0]) throw new Error("That group name is already in use");
      await sql`
        update action_categories set name = ${name}
        where id = ${data.id} and couple_id = ${c.id}`;
      await sql`
        update action_types set category = ${name}
        where couple_id = ${c.id} and lower(category) = lower(${old})`;
      await sql`
        update logged_actions set category = ${name}
        where couple_id = ${c.id} and lower(category) = lower(${old})`;
      return { id: data.id };
    }

    const clash = await sql<{ id: number }>`
      select id from action_categories
      where couple_id = ${c.id} and lower(name) = lower(${name}) and archived = false`;
    if (clash[0]) throw new Error("That group already exists");
    const inserted = await sql<{ id: number }>`
      insert into action_categories (couple_id, name)
      values (${c.id}, ${name})
      returning id`;
    return { id: inserted[0].id };
  });
