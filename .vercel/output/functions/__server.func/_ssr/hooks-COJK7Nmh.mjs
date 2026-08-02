import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { f as listRewards, l as listActionTypes, o as getDashboard, u as listHistory, y as settleExpired } from "./server-jk6IcsCn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hooks-COJK7Nmh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useDashboard(enabled = true) {
	return useQuery({
		queryKey: ["dashboard"],
		queryFn: async () => {
			try {
				await settleExpired();
			} catch {}
			return getDashboard();
		},
		enabled,
		refetchInterval: 4e3,
		staleTime: 2e3
	});
}
function useActionTypes(enabled = true) {
	return useQuery({
		queryKey: ["action-types"],
		queryFn: () => listActionTypes(),
		enabled,
		staleTime: 1e4
	});
}
function useHistory(filters, enabled = true) {
	return useQuery({
		queryKey: ["history", filters],
		queryFn: () => listHistory({ data: filters }),
		enabled,
		staleTime: 3e3
	});
}
function useRewards(enabled = true) {
	return useQuery({
		queryKey: ["rewards"],
		queryFn: () => listRewards(),
		enabled,
		staleTime: 5e3
	});
}
function useInvalidatePaws() {
	const qc = useQueryClient();
	return (0, import_react.useCallback)(() => {
		qc.invalidateQueries({ queryKey: ["dashboard"] });
		qc.invalidateQueries({ queryKey: ["action-types"] });
		qc.invalidateQueries({ queryKey: ["history"] });
		qc.invalidateQueries({ queryKey: ["rewards"] });
	}, [qc]);
}
//#endregion
export { useRewards as a, useInvalidatePaws as i, useDashboard as n, useHistory as r, useActionTypes as t };
