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
  const env = { JWT_SECRET: "isolated-test-secret", TELEGRAM_WEBHOOK_SECRET: "isolated-webhook-secret", TELEGRAM_BOT_TOKEN: "fake-test-token" };
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
  vm.runInNewContext(source, context, { filename: "server.js" });
  const store = context.global.__planetPrintMemoryStore;
  store.finance = { projects: [{ id: "p1", name: "Banner", amount: 1000, advance: 200 }], payments: [], workers: [{ id: "w1", name: "Ali", phone: "+998 90 123 45 67", notifications: ["payments", "designs"] }], payment: { currentMonth: now, lastPaidMonth: now } };
  store.users.push({ id: "a1", username: "admin", role: "admin", permissions: JSON.stringify(["payments"]) });
  const server = context.module.exports.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = id => jwt.sign({ id, role: "super_admin", permissions: ["settings", "workers", "projects"] }, env.JWT_SECRET);
  const request = async (url, method = "GET", body, id = "a1", extra = {}) => {
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
    await request("/api/telegram/staff/w1", "DELETE", null, "fallback-super-admin");
    result = await request("/api/telegram/staff", "GET", null, "fallback-super-admin");
    assert.equal(result.body.workers[0].chatId, "");
  });
  await t.test("deleted users cannot reuse tokens", async () => {
    store.users.length = 0;
    assert.equal((await request("/api/finance")).status, 401);
  });
});
