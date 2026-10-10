const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const jwt = require("jsonwebtoken");
const root = path.resolve(__dirname, "..");

// Serverni Firebase'siz (xotira rejimida) va haqiqiy Telegramsiz yuklaydi.
async function startServer(t) {
  const env = { JWT_SECRET: "finance-test-secret", SUPER_PASS: "finance-super-pass" };
  const context = {
    require: createRequire(path.join(root, "server.js")), __dirname: root, module: { exports: {} },
    process: { env }, console: { log() {}, warn() {}, error() {} }, Buffer, setTimeout, clearTimeout,
    URL, AbortSignal, global: {}, fetch: async () => ({ ok: true, json: async () => ({ ok: true, result: {} }) })
  };
  let source = fs.readFileSync(path.join(root, "server.js"), "utf8");
  source = source.replace('require("dotenv").config();', "").replace("const dbReady = initDb().catch", "const dbReady = Promise.resolve().catch");
  source += "\nmodule.exports.archiveOpenCycle = archiveOpenCycle;";
  source += "\nmodule.exports.setTestFirestore = value => { firestore = value; };";
  vm.runInNewContext(source, context, { filename: "server.js" });
  const store = context.global.__planetPrintMemoryStore;
  const server = context.module.exports.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (url, method = "GET", body, id = "fallback-super-admin") => {
    const response = await fetch(base + url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt.sign({ id }, env.JWT_SECRET)}` },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  };
  return { store, request, exports: context.module.exports };
}

const monthKey = date => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit" }).format(date);

test("finance safety: stale saves, archive protection and validation", async t => {
  const { store, request } = await startServer(t);
  const now = monthKey(new Date());
  store.finance = {
    projects: [{ id: "p1", name: "Banner", client: "Ali", amount: 1000, advance: 200 }],
    payments: [{ id: "pay0", projectId: "p1", projectName: "Banner", amount: 200 }],
    archives: [{ id: "archive-2026-01", month: "2026-01", projects: [{ id: "old1", name: "Eski", amount: 500, advance: 100, debtClosed: false }] }],
    payment: { currentMonth: now, lastPaidMonth: now }
  };
  store.users.push({ id: "acc1", username: "buxgalter", role: "accountant", permissions: JSON.stringify(["payments"]) });
  store.users.push({ id: "des1", username: "dizayner", role: "designer", permissions: JSON.stringify(["designs"]) });

  await t.test("a save from a stale page is rejected instead of wiping another user's payment", async () => {
    const first = await request("/api/finance");
    const second = await request("/api/finance");
    const a = first.body.finance;
    a.projects[0].advance = 700;
    a.payments.push({ id: "pay1", projectId: "p1", amount: 500 });
    assert.equal((await request("/api/finance", "PUT", { finance: a, revision: first.body.revision })).status, 200);
    // Ikkinchi oyna eski ma'lumot bilan xarajat qo'shmoqchi: to'lov o'chib ketmasligi kerak.
    const b = second.body.finance;
    b.settings.tax = 12;
    const stale = await request("/api/finance", "PUT", { finance: b, revision: second.body.revision });
    assert.equal(stale.status, 409);
    assert.equal(store.finance.payments.length, 2);
    assert.equal(store.finance.projects[0].advance, 700);
    assert.equal((await request("/api/finance", "PUT", { finance: b })).status, 409, "revision is required");
  });

  await t.test("super admin page cannot overwrite archives or payment state, only close a debt", async () => {
    const current = await request("/api/finance");
    const finance = current.body.finance;
    finance.archives = [{ ...finance.archives[0], projects: [{ ...finance.archives[0].projects[0], amount: 1, debtClosed: true }] }, { id: "fake", month: "2020-01", projects: [] }];
    finance.payment = { currentMonth: "2020-01", lastPaidMonth: "2020-01" };
    assert.equal((await request("/api/finance", "PUT", { finance, revision: current.body.revision })).status, 200);
    assert.equal(store.finance.archives.length, 1);
    assert.equal(store.finance.archives[0].projects[0].amount, 500);
    assert.equal(store.finance.archives[0].projects[0].debtClosed, true);
    assert.equal(store.finance.payment.currentMonth, now);
  });

  await t.test("new project advance must be backed by an equal payment record", async () => {
    const current = await request("/api/finance");
    const finance = current.body.finance;
    finance.projects.push({ id: "p2", name: "Lightbox", client: "Vali", amount: 2000, advance: 500 });
    let result = await request("/api/finance", "PUT", { finance, revision: current.body.revision });
    assert.equal(result.status, 400);
    finance.payments.push({ id: "pay2", projectId: "p2", amount: 500 });
    result = await request("/api/finance", "PUT", { finance, revision: current.body.revision });
    assert.equal(result.status, 200);
  });

  await t.test("unsafe ids, bad amounts and over-100% founder shares are rejected", async () => {
    let current = await request("/api/finance");
    let finance = current.body.finance;
    finance.expenses.push({ id: '"><img src=x onerror=alert(1)>', type: "banner", amount: 10, allocations: [{ projectId: "p1", amount: 10 }] });
    assert.equal((await request("/api/finance", "PUT", { finance, revision: current.body.revision })).status, 400);
    finance.expenses = [{ id: "e1", type: "banner", amount: "abc", allocations: [{ projectId: "p1", amount: 10 }] }];
    assert.equal((await request("/api/finance", "PUT", { finance, revision: current.body.revision })).status, 400);
    finance.expenses = [];
    finance.founders = [{ id: "f1", name: "A", share: 60 }, { id: "f2", name: "B", share: 50 }];
    assert.equal((await request("/api/finance", "PUT", { finance, revision: current.body.revision })).status, 400);
    finance.founders = [{ id: "f1", name: "A", share: 60 }, { id: "f2", name: "B", share: 40 }];
    assert.equal((await request("/api/finance", "PUT", { finance, revision: current.body.revision })).status, 200);
  });

  await t.test("expense paid from another order's money is accepted only for a real order", async () => {
    const current = await request("/api/finance");
    const finance = current.body.finance;
    finance.expenses.push({ id: "eb1", type: "banner", amount: 300, allocations: [{ projectId: "p2", amount: 300, fundedByProjectId: "nope" }] });
    assert.equal((await request("/api/finance", "PUT", { finance, revision: current.body.revision })).status, 400);
    finance.expenses[finance.expenses.length - 1].allocations[0].fundedByProjectId = "p1";
    assert.equal((await request("/api/finance", "PUT", { finance, revision: current.body.revision })).status, 200);
    assert.equal(store.finance.expenses.find(e => e.id === "eb1").allocations[0].fundedByProjectId, "p1");
  });

  await t.test("news shows changes only to users allowed to see that section", async () => {
    const admin = await request("/api/news");
    assert.equal(admin.status, 200);
    assert.ok(admin.body.changelog.length >= 1);
    assert.ok(admin.body.activity.some(entry => entry.category === "payments" && entry.action === "added"));
    assert.ok(admin.body.activity.some(entry => entry.category === "archive" && /qarzi yopildi/.test(entry.text)));
    const accountant = await request("/api/news", "GET", null, "acc1");
    assert.ok(accountant.body.activity.length > 0);
    assert.ok(accountant.body.activity.every(entry => entry.category === "payments"));
    const designer = await request("/api/news", "GET", null, "des1");
    assert.ok(designer.body.activity.every(entry => entry.category === "designs"));
    assert.ok(!designer.body.activity.some(entry => /UZS/.test(entry.text)));
  });

  await t.test("default super admin password no longer works", async () => {
    const result = await request("/api/auth/login", "POST", { username: "Superadmin", password: "Planet2026" });
    assert.equal(result.status, 401);
  });
});

// Firestore'ning testda kerak bo'ladigan qismi: hujjatlar, tranzaksiya, batch va saralash.
function fakeFirestore() {
  const data = new Map();
  const snap = key => ({ exists: data.has(key), id: key.split("/").pop(), data: () => structuredClone(data.get(key)) });
  const ref = key => ({ key, get: async () => snap(key), set: async value => { data.set(key, structuredClone(value)); }, delete: async () => { data.delete(key); } });
  const docs = name => [...data.keys()].filter(key => key.startsWith(`${name}/`)).map(snap);
  return {
    data,
    collection: name => ({
      doc: id => ref(`${name}/${id}`),
      get: async () => ({ docs: docs(name) }),
      orderBy: (field, direction) => ({ limit: count => ({ get: async () => ({
        docs: docs(name).sort((a, b) => (direction === "desc" ? -1 : 1) * (a.data()[field] - b.data()[field])).slice(0, count)
      }) }) })
    }),
    runTransaction: async fn => {
      const writes = [];
      const result = await fn({ get: r => r.get(), set: (r, value) => writes.push([r, value]) });
      for (const [r, value] of writes) await r.set(value);
      return result;
    },
    batch: () => {
      const writes = [];
      return { set: (r, value) => writes.push([r, value]), commit: async () => { for (const [r, value] of writes) await r.set(value); } };
    }
  };
}

test("Firestore mode: transaction, revision, month archive and activity log", async t => {
  const { request, exports } = await startServer(t);
  const db = fakeFirestore();
  // Hozirgi production hujjati kabi: revision maydoni yo'q, o'tgan oy ochiq qolgan.
  db.data.set("users/u1", { username: "boss", role: "super_admin", permissions: "[]" });
  db.data.set("settings/finance", { data: {
    projects: [{ id: "p1", name: "Qarzli", client: "A", amount: 1000, advance: 400 }, { id: "p2", name: "Yopilgan", client: "B", amount: 500, advance: 500 }],
    payments: [{ id: "x1", projectId: "p1", amount: 400 }, { id: "x2", projectId: "p2", amount: 500 }],
    payment: { currentMonth: "2020-01", lastPaidMonth: monthKey(new Date()) }
  } });
  exports.setTestFirestore(db);
  t.after(() => exports.setTestFirestore(null));

  const first = await request("/api/finance", "GET", null, "u1");
  assert.equal(first.status, 200);
  assert.equal(first.body.revision, 1, "archiving the old month is saved as a new revision");
  const stored = db.data.get("settings/finance");
  assert.equal(stored.revision, 1);
  assert.equal(stored.data.archives[0].month, "2020-01");
  assert.deepEqual(stored.data.projects.map(p => [p.id, p.amount, p.advance, p.carriedFromMonth]), [["p1", 1000, 400, "2020-01"]]);

  const finance = first.body.finance;
  finance.projects[0].advance = 1000;
  finance.payments.push({ id: "x3", projectId: "p1", amount: 600 });
  assert.equal((await request("/api/finance", "PUT", { finance, revision: 1 }, "u1")).status, 200);
  assert.equal(db.data.get("settings/finance").revision, 2);
  assert.equal(db.data.get("settings/finance").data.projects[0].advance, 1000);
  assert.equal((await request("/api/finance", "PUT", { finance, revision: 1 }, "u1")).status, 409);

  const news = await request("/api/news", "GET", null, "u1");
  assert.ok(news.body.activity.some(entry => /2020-01 oyi arxivlandi/.test(entry.text)));
  assert.ok(news.body.activity.some(entry => entry.category === "payments" && /600/.test(entry.text)));
  assert.ok([...db.data.keys()].some(key => key.startsWith("activityLog/")));
});

test("month rollover keeps the real contract amount of unpaid orders", async t => {
  const { exports } = await startServer(t);
  const finance = {
    projects: [
      { id: "p1", name: "Qarzli", amount: 1000, advance: 200 },
      { id: "p2", name: "To'langan", amount: 300, advance: 300 }
    ],
    payments: [{ id: "x", projectId: "p1", amount: 200 }],
    expenses: [{ id: "e", amount: 50 }],
    payment: { currentMonth: "2020-01" }
  };
  const next = exports.archiveOpenCycle(finance);
  assert.equal(next.archives[0].month, "2020-01");
  assert.equal(next.archives[0].payments.length, 1);
  assert.equal(next.projects.length, 1);
  assert.equal(next.projects[0].amount, 1000);
  assert.equal(next.projects[0].advance, 200);
  assert.equal(next.projects[0].carriedFromMonth, "2020-01");
  assert.equal(next.payments.length, 0);
  assert.equal(next.expenses.length, 0);
});

test("money input parsing does not silently change amounts", () => {
  const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const body = source.match(/function parseMoney\(value\) \{[\s\S]*?\n    \}/)[0];
  const parseMoney = vm.runInNewContext(`(${body})`);
  assert.equal(parseMoney("1 500 000"), 1500000);
  assert.equal(parseMoney("1.500.000"), 1500000);
  assert.equal(parseMoney("1,500,000"), 1500000);
  assert.equal(parseMoney("500.000"), 500000);
  assert.equal(parseMoney("1500000"), 1500000);
  assert.equal(parseMoney("1500,50"), 1500.5);
  assert.equal(parseMoney("250 000 so'm"), 250000);
  assert.ok(Number.isNaN(parseMoney("")));
  assert.ok(Number.isNaN(parseMoney("12abc")));
  assert.ok(Number.isNaN(parseMoney("-500")));
  assert.ok(Number.isNaN(parseMoney("1.5.0")));
});
