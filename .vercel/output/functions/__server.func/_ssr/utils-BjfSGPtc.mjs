import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-BjfSGPtc.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function id(prefix = "") {
	const rand = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 12) : Math.random().toString(36).slice(2, 14);
	return prefix ? `${prefix}_${rand}` : rand;
}
function inviteCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "PAW";
	for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * 32)];
	return code;
}
function hoursFromNow(h) {
	return new Date(Date.now() + h * 60 * 60 * 1e3);
}
function formatPoints(n) {
	if (n > 0) return `+${n}`;
	return String(n);
}
function downloadText(filename, content, mime = "text/csv") {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
//#endregion
export { id as a, hoursFromNow as i, downloadText as n, inviteCode as o, formatPoints as r, cn as t };
