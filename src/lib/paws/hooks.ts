import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  getDashboard,
  listActionTypes,
  listHistory,
  listRewards,
  settleExpired,
} from "./server";

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
    queryFn: () => listActionTypes(),
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
  }, [qc]);
}
