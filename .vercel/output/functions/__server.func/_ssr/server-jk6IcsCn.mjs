import { i as createServerFn } from "./ssr.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Dz_dOZX4.mjs";
import { t as authMiddleware } from "./middleware-BQKE-aXq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-jk6IcsCn.js
var getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1c773d0b3469149f9aeb188fb89afb0d5394e28e05c24a331eacd6709da216e1"));
var updateProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("1e05cae8df4813afdf7f8a46a1102f0fa051c8c3cf1c16294bafed0d22175fdf"));
var createInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("c3dd1cfce340227a234cc008aeff27afbaa073281b7fd3025f071ccd94d5098a"));
var joinWithCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((code) => code.trim().toUpperCase()).handler(createSsrRpc("c509154c64a9328da7218430403d82fcbd041ea90d9cf2c3ed2e38bf046db0ad"));
var unpair = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("996ca74147b1116cf1a29f7ea0a9aa272e6ebc0bd5af0300ee3802ec1fd8a5af"));
var savePreferences = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((prefs) => prefs).handler(createSsrRpc("ff49534305a973200ad2ef663177d30e7c9dc68d25c79c30e298c5d8110e70e8"));
var listActionTypes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e525b9d47934db21b6cdba190c89e6d660e3d97888a35c7140fd5bb27e0b62b7"));
var listMyPreferenceTargets = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7bc54821e2f231a578308a97c9dc2f2b18ce99eb878169d900d834411dc894b1"));
var upsertActionType = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("dcb4bc31d77a19e6e1f4f296a5bc5f30a282ed52a807b4f37a541e298c4501ed"));
var logAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("8e081f67e1a3ac7163d372ebb3ae6400764e3f7d4c4f3abb2f23903058ffb378"));
var reviewAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("1cc68e0b373144ec0b474769010fcf837b4400ca873d6b650a7bac30bc8bd9c0"));
var editLoggedAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("49ae19a486b3a184fac3cb8f48788b14ffcb5fb60a30ab61501c46fc317fbff4"));
var listHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((q) => q ?? {}).handler(createSsrRpc("059a3407ff2ccb383c1b40e5181f6666e70648eeb11e37301ec3c68214d46cf0"));
var exportHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("9b1df436ed6223eebcf1682aef0b6de4d85274852e2ce71051fba4bfe5afe60d"));
var requestDeleteAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("12b265f94764636f8ced42d605e048ae2aa586ffa6d7eca01e57ca4d86cc61ab"));
var listRewards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("62f91e5a82b171b97450eb9e508629fa13aef6271927fc25fd54ca2c38fa277b"));
var upsertReward = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("c29955c003d5e773d81812a67cca2f2b62b01bbb5d915a503216c60911b70d84"));
var claimReward = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("f61f7fc76838e223cb1680c28832e614cc478c5a073cdbc2c93e3031f4123aca"));
var resolveClaim = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("82ec0a7d0d5a008b332cd815677f0d215f94f398ddcdd7a75f3c6ef4b235db5e"));
var buyWishlistItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("e92058b2b0461677eca2281128f51b27956296e8e1462afcd674d85b71af7324"));
var getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7f5866b7484194273b46013b8ec35aeaab8572a97445b495054cbe8964edbacb"));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("8948e7a8bfde3ed5c0f783397133bc6530022e3196ac94444499b05d3d6b045d"));
var settleExpired = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("376197e0886179f2f0580faa726cb9f3aecaa63ac85f5e40033a9950d477de01"));
//#endregion
export { upsertReward as C, upsertActionType as S, reviewAction as _, exportHistory as a, unpair as b, joinWithCode as c, listMyPreferenceTargets as d, listRewards as f, resolveClaim as g, requestDeleteAction as h, editLoggedAction as i, listActionTypes as l, markNotificationsRead as m, claimReward as n, getDashboard as o, logAction as p, createInvite as r, getMe as s, buyWishlistItem as t, listHistory as u, savePreferences as v, updateProfile as x, settleExpired as y };
