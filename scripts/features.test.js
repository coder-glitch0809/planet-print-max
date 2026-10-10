const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const jwt = require("jsonwebtoken");
const root = path.resolve(__dirname, "..");

test("permissions, MAX-equivalent payment and Telegram staff registration", async t => {
  const now = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit" }).format(new Date());
  const sent = [];
  const env = { JWT_SECRET: "isolated-test-secret", TELEGRAM_WEBHOOK_SECRET: "isolated-webhook-secret", TELEGRAM_BOT_TOKEN: "fake-test-token", SUPER_PASS: "isolated-super-pass" };
  const previousEnv = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => { for (const [key, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const context = {
    require: createRequire(path.join(root, "server.js")), __dirname: root, module: { exports: {} },
    process: { env }, console: { log() {}, warn() {}, error() {} }, Buffer, setTimeout, clearTimeout,
    URL, AbortSignal, global: {}, fetch: async (_url, request) => {
      sent.push(JSON.parse(request.body));
      return { ok: true, json: async () => ({ ok: true, result: { message_id: sent.length } }) };
    }
  };
  let source = fs.readFileSync(path.join(root, "server.js"), "utf8");
  source = source.replace('require("dotenv").config();', "").replace('const dbReady = initDb().catch', 'const dbReady = Promise.resolve().catch');
  source += '\nmodule.exports.setTestFirestore = value => { firestore = value; };';
  vm.runInNewContext(source, context, { filename: "server.js" });
  const store = context.global.__planetPrintMemoryStore;
  store.finance = { projects: [{ id: "p1", name: "Banner", amount: 1000, advance: 200 }], payments: [], workers: [{ id: "w1", name: "Ali", phone: "+998 90 123 45 67", notifications: ["payments", "designs"] }], payment: { currentMonth: now, lastPaidMonth: now } };
  store.users.push({ id: "a1", username: "admin", phone: "998901234567", role: "admin", permissions: JSON.stringify(["payments"]) });
  const server = context.module.exports.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = id => jwt.sign({ id, role: "super_admin", permissions: ["settings", "workers", "projects"] }, env.JWT_SECRET);
  const request = async (url, method = "GET", body, id = "a1", extra = {}) => {
    // Moliya PUT so'rovi oxirgi revision bilan yuboriladi (eskirgan sahifa himoyasi).
    if (url === "/api/finance" && method === "PUT" && body && body.revision === undefined) {
      body = { ...body, revision: (await request("/api/finance", "GET", null, "fallback-super-admin")).body.revision };
    }
    const response = await fetch(base + url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token(id)}`, ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  };
  await t.test("server ignores forged stale role claims and enforces stored permissions", async () => {
    const result = await request("/api/finance");
    assert.equal(result.status, 200);
    assert.equal(result.body.finance.projects.length, 1);
    assert.equal(result.body.finance.workers.length, 0);
    assert.equal((await request("/api/users")).status, 403);
  });
  await t.test("superadmin can edit permissions and old token loses access immediately", async () => {
    assert.equal((await request("/api/users/a1", "PUT", { role: "admin", permissions: [] }, "fallback-super-admin")).status, 200);
    assert.equal((await request("/api/finance")).body.finance.projects.length, 0);
    await request("/api/users/a1", "PUT", { role: "accountant", permissions: ["payments"] }, "fallback-super-admin");
  });
  await t.test("MAX payment closes exact remaining balance without changing other project fields", async () => {
    const finance = (await request("/api/finance")).body.finance;
    finance.payments.push({ id: "pay1", projectId: "p1", amount: 800 });
    finance.projects[0].advance = 1000;
    finance.projects[0].name = "unauthorized edit";
    assert.equal((await request("/api/finance", "PUT", { finance })).status, 200);
    assert.equal(store.finance.projects[0].advance, 1000);
    assert.equal(store.finance.projects[0].name, "Banner");
    finance.projects[0].advance = 1001;
    assert.equal((await request("/api/finance", "PUT", { finance })).status, 400);
    finance.projects[0].advance = 900;
    assert.equal((await request("/api/finance", "PUT", { finance })).status, 400);
    finance.projects[0].advance = 1000;
    finance.payments.push({ ...finance.payments[0] });
    assert.equal((await request("/api/finance", "PUT", { finance })).status, 400);
  });
  const webhook = message => request("/api/telegram/webhook", "POST", { message }, "a1", { "X-Telegram-Bot-Api-Secret-Token": env.TELEGRAM_WEBHOOK_SECRET });
  const message = { chat: { id: 123, type: "private" }, from: { id: 123 } };
  await t.test("webhook requires secret; start captures chat ID and requests own contact", async () => {
    assert.equal((await request("/api/telegram/webhook", "POST", { message })).status, 403);
    assert.equal((await webhook({ ...message, text: "/start" })).status, 200);
    assert.equal(sent.at(-1).chat_id, 123);
    assert.equal(sent.at(-1).reply_markup.keyboard[0][0].request_contact, true);
  });
  await t.test("foreign contact rejected, own normalized phone linked, notifications routed", async () => {
    await webhook({ ...message, contact: { user_id: 999, phone_number: "901234567" } });
    let result = await request("/api/telegram/staff", "GET", null, "fallback-super-admin");
    assert.equal(result.body.workers[0].chatId, "");
    await webhook({ ...message, contact: { user_id: 123, phone_number: "901234567" } });
    result = await request("/api/telegram/staff", "GET", null, "fallback-super-admin");
    assert.equal(result.body.workers[0].chatId, "123");
    const before = sent.length;
    const finance = (await request("/api/finance")).body.finance;
    finance.payments[0].note = "Paid in full";
    await request("/api/finance", "PUT", { finance });
    assert.equal(sent.length, before + 1);
    assert.match(sent.at(-1).text, /To'lov/);
    const announcement = await request("/api/telegram/announcement", "POST", { text: "test" }, "fallback-super-admin");
    assert.equal(announcement.body.sent.sent, 0);
    await request("/api/telegram/staff/a1", "DELETE", null, "fallback-super-admin");
    result = await request("/api/telegram/staff", "GET", null, "fallback-super-admin");
    assert.equal(result.body.workers[0].chatId, "");
  });
  let installerId;
  await t.test("account phone creation, editing, normalization and uniqueness", async () => {
    const body = { username: "montaj", email: "test@example.invalid", password: "test-password", phone: "+998 91 111 22 33", role: "worker", permissions: ["designs", "payments", "settings"] };
    assert.equal((await request("/api/users", "POST", body, "fallback-super-admin")).status, 200);
    const users = (await request("/api/users", "GET", null, "fallback-super-admin")).body.users;
    const installer = users.find(u => u.username === "montaj");
    installerId = installer.id;
    assert.equal(installer.phone, "998911112233");
    assert.equal((await request("/api/users", "POST", { ...body, username: "duplicate", phone: "911112233" }, "fallback-super-admin")).status, 409);
    assert.equal((await request(`/api/users/${installerId}`, "PUT", { role: "worker", permissions: ["designs"], phone: "901234567" }, "fallback-super-admin")).status, 409);
    assert.equal((await request(`/api/users/${installerId}`, "PUT", { role: "worker", permissions: ["designs"], phone: "invalid123" }, "fallback-super-admin")).status, 400);
  });
  await t.test("installer gets only approved image with dimensions and task; draft and payment events stay hidden", async () => {
    const installerMessage = { chat: { id: 456, type: "private" }, from: { id: 456 }, contact: { user_id: 456, phone_number: "911112233" } };
    assert.equal((await webhook(installerMessage)).status, 200);
    assert.match(sent.at(-1).text, /Montajnik/);
    const before = sent.length;
    let finance = (await request("/api/finance", "GET", null, "fallback-super-admin")).body.finance;
    finance.designs.push({ id: "design1", projectId: "p1", photoFileId: "fake-photo-id", approved: false, note: "Fasadga o'rnatish" });
    finance.payments[0].note = "Installer must not see this";
    await request("/api/finance", "PUT", { finance }, "fallback-super-admin");
    await request("/api/telegram/announcement", "POST", { text: "Not for installer" }, "fallback-super-admin");
    assert.equal(sent.length, before);
    assert.equal((await request("/api/telegram/send-design", "POST", { designId: "design1", approved: true, caption: "forged" }, "fallback-super-admin")).status, 400);
    finance.designs[0].approved = true;
    await request("/api/finance", "PUT", { finance }, "fallback-super-admin");
    assert.equal((await request("/api/telegram/send-design", "POST", { designId: "design1" }, "fallback-super-admin")).status, 400);
    finance.designs[0].dimensions = "200 x 100 sm, 2 dona";
    await request("/api/finance", "PUT", { finance }, "fallback-super-admin");
    assert.equal(sent.length, before);
    const delivery = await request("/api/telegram/send-design", "POST", { designId: "design1" }, "fallback-super-admin");
    assert.equal(delivery.status, 200);
    assert.equal(delivery.body.delivery.sent, 1);
    assert.equal(sent.at(-1).chat_id, "456");
    assert.equal(sent.at(-1).photo, "fake-photo-id");
    assert.match(sent.at(-1).caption, /200 x 100 sm, 2 dona/);
    assert.match(sent.at(-1).caption, /Fasadga ornatish/);
    assert.equal(sent.length, before + 1);
    assert.equal((await request("/api/telegram/send-design", "POST", { designId: "design1" }, installerId)).status, 403);
    // Current permissions, not those recorded at binding time, control delivery.
    await request(`/api/users/${installerId}`, "PUT", { role: "worker", permissions: [] }, "fallback-super-admin");
    assert.equal((await request("/api/telegram/send-design", "POST", { designId: "design1" }, "fallback-super-admin")).status, 502);
    assert.equal(sent.length, before + 1);
  });
  await t.test("changing account phone disables the old Telegram binding", async () => {
    await request(`/api/users/${installerId}`, "PUT", { role: "worker", permissions: ["designs"], phone: "+998 93 111 22 33" }, "fallback-super-admin");
    const result = await request("/api/telegram/staff", "GET", null, "fallback-super-admin");
    assert.equal(result.body.workers.find(w => w.id === installerId).chatId, "");
    assert.equal((await request("/api/telegram/send-design", "POST", { designId: "design1" }, "fallback-super-admin")).status, 502);
  });
  await t.test("admins sign in with normalized phone and password, while login and email still work", async () => {
    const account = store.users.find(u => u.id === "a1");
    account.role = "admin";
    account.email = "admin@example.invalid";
    account.passHash = await require("bcryptjs").hash("phone-login-test", 4);
    for (const username of ["+998 90 123 45 67", "998901234567", "901234567", "admin", "admin@example.invalid"]) {
      const result = await request("/api/auth/login", "POST", { username, password: "phone-login-test" });
      assert.equal(result.status, 200, username);
      assert.equal(result.body.user.id, "a1");
      assert.equal(result.body.user.role, "admin");
      assert.ok(result.body.token);
    }
    assert.equal((await request("/api/auth/login", "POST", { username: "901234567", password: "wrong-password" })).status, 401);
    assert.equal((await request("/api/auth/login", "POST", { username: "901234567" })).status, 400);
    assert.equal((await request("/api/auth/login", "POST", { username: "abc901234567", password: "phone-login-test" })).status, 401);
  });
  await t.test("Firestore phone login queries canonical number and rejects duplicates", async () => {
    const account = store.users.find(u => u.id === "a1");
    let duplicate = false;
    const queries = [];
    context.module.exports.setTestFirestore({ collection: () => ({ where: (field, operator, value) => {
      queries.push({ field, value });
      return { limit: () => ({ get: async () => ({ empty: false, docs: Array.from({ length: duplicate ? 2 : 1 }, (_, i) => ({ id: `db${i}`, data: () => account })) }) }) };
    } }) });
    try {
      const result = await request("/api/auth/login", "POST", { username: "+998 (90) 123-45-67", password: "phone-login-test" });
      assert.equal(result.status, 200);
      assert.deepEqual(queries, [{ field: "phone", value: "998901234567" }]);
      duplicate = true;
      assert.equal((await request("/api/auth/login", "POST", { username: "901234567", password: "phone-login-test" })).status, 401);
    } finally { context.module.exports.setTestFirestore(null); }
  });
  await t.test("deleted users cannot reuse tokens", async () => {
    store.users.length = 0;
    assert.equal((await request("/api/finance")).status, 401);
  });
});

test("Telegram role and section policy", () => {
  const { canReceive } = require("../telegram-staff");
  assert.equal(canReceive({ role: "worker", permissions: ["designs", "payments", "settings"] }, "payments"), false);
  assert.equal(canReceive({ role: "worker", permissions: ["designs"] }, "designs"), false);
  assert.equal(canReceive({ role: "worker", permissions: ["designs"] }, "approved_designs"), true);
  assert.equal(canReceive({ role: "designer", permissions: '["designs"]' }, "designs"), true);
  assert.equal(canReceive({ role: "designer", permissions: ["designs"] }, "payments"), false);
  assert.equal(canReceive({ role: "accountant", permissions: ["payments", "expenses"] }, "expenses"), true);
  assert.equal(canReceive({ role: "manager", permissions: ["projects"] }, "projects"), true);
  assert.equal(canReceive({ role: "admin", permissions: [] }, "payments"), false);
});
