import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  getDashboard,
  listActionTypes,
  listHistory,
  listMyPreferenceTargets,
  listRewards,
  settleExpired,
} from "./server";
import type { ActionType } from "./types";

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        await settleExpired();
      } catch {
        /* ignore settle errors */
      }
      return getDashboard();
    },
    enabled,
    refetchInterval: 4000,
    staleTime: 2000,
  });
}

export function useActionTypes(enabled = true) {
  return useQuery({
    queryKey: ["action-types"],
    queryFn: async (): Promise<ActionType[]> => {
      const [partnerView, myView] = await Promise.all([
        listActionTypes(),
        listMyPreferenceTargets(),
      ]);
      const myById = new Map(myView.map((a) => [a.id, a.my_points ?? null]));
      return partnerView.map((a) => ({
        ...a,
        // partner's rating (when you performed for them)
        preferred_points: a.preferred_points,
        // your rating (when they performed for you)
        my_points: myById.get(a.id) ?? a.my_points ?? null,
      }));
    },
    enabled,
    staleTime: 10_000,
  });
}

export function useHistory(
  filters: { search?: string; kind?: string; status?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ["history", filters],
    queryFn: () => listHistory({ data: filters }),
    enabled,
    staleTime: 3000,
  });
}

export function useRewards(enabled = true) {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: () => listRewards(),
    enabled,
    staleTime: 5000,
  });
}

export function useInvalidatePaws() {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
    void qc.invalidateQueries({ queryKey: ["action-types"] });
    void qc.invalidateQueries({ queryKey: ["history"] });
    void qc.invalidateQueries({ queryKey: ["rewards"] });
    void qc.invalidateQueries({ queryKey: ["pref-targets"] });
    void qc.invalidateQueries({ queryKey: ["pref-targets-settings"] });
    void qc.invalidateQueries({ queryKey: ["me"] });
  }, [qc]);
}
