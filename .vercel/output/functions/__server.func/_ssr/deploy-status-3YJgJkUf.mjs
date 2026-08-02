import { i as createServerFn } from "./ssr.mjs";
import { o as isServerlessRuntime } from "./db-rIvx0piq.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/deploy-status-3YJgJkUf.js
var getDeployStatus_createServerFn_handler = createServerRpc({
	id: "d347aaeeb82d29969007741f7e1b31b26a2214aaedf9ede5a96bc54cdbe173e6",
	name: "getDeployStatus",
	filename: "src/lib/paws/deploy-status.ts"
}, (opts) => getDeployStatus.__executeServer(opts));
var getDeployStatus = createServerFn({ method: "GET" }).handler(getDeployStatus_createServerFn_handler, async () => {
	const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
	const serverless = isServerlessRuntime();
	const needsDatabase = serverless && !hasDatabaseUrl;
	return {
		hasDatabaseUrl,
		serverless,
		needsDatabase,
		message: needsDatabase ? "Published app is missing a database (DATABASE_URL). Google can sign you in at the broker, but this app cannot save your session or couple data — so you land back on login. Fix: attach Neon / set DATABASE_URL on publish, then republish. You do not need a separate server." : null
	};
});
//#endregion
export { getDeployStatus_createServerFn_handler };
