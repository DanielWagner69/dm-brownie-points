import { i as createServerFn } from "./ssr.mjs";
import { o as isServerlessRuntime } from "./db-BWLI4Tr_.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/deploy-status-q7kK_48H.js
var getDeployStatus_createServerFn_handler = createServerRpc({
	id: "d347aaeeb82d29969007741f7e1b31b26a2214aaedf9ede5a96bc54cdbe173e6",
	name: "getDeployStatus",
	filename: "src/lib/paws/deploy-status.ts"
}, (opts) => getDeployStatus.__executeServer(opts));
var getDeployStatus = createServerFn({ method: "GET" }).handler(getDeployStatus_createServerFn_handler, async () => {
	const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
	const hasBetterAuthUrl = Boolean(process.env.BETTER_AUTH_URL?.trim());
	const hasGrokClient = Boolean(process.env.GROK_AUTH_CLIENT_ID?.trim());
	const serverless = isServerlessRuntime();
	const needsDatabase = serverless && !hasDatabaseUrl;
	const oauthLikelyBroken = serverless && !hasGrokClient;
	return {
		hasDatabaseUrl,
		hasBetterAuthUrl,
		hasGrokClient,
		serverless,
		needsDatabase,
		oauthLikelyBroken,
		message: needsDatabase ? "Published app is missing a database (DATABASE_URL). Set it on Vercel and redeploy." : null,
		oauthHint: oauthLikelyBroken ? "Google / X sign-in is not configured for this host (Invalid redirect URI). Use email + password below — that is the permanent path on Vercel + Neon." : !hasBetterAuthUrl && serverless ? "Set BETTER_AUTH_URL to your exact site URL (https://….vercel.app, no trailing slash) and redeploy." : null
	};
});
//#endregion
export { getDeployStatus_createServerFn_handler };
