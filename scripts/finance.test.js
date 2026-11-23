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
  const env = { JWT_SECRET: "finance-test-secret", SUPER_PASS: "finance-super-pass", ALLOW_MEMORY_STORE: "1" };
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

  await t.test("news is visible only to the super admin", async () => {
    const admin = await request("/api/news");
    assert.equal(admin.status, 200);
    assert.ok(admin.body.changelog.length >= 1);
    assert.ok(admin.body.activity.some(entry => entry.category === "payments" && entry.action === "added"));
    assert.ok(admin.body.activity.some(entry => entry.category === "archive" && /qarzi yopildi/.test(entry.text)));
    // Yangiliklar faqat superadminga: boshqa lavozimlar umuman olmaydi.
    assert.equal((await request("/api/news", "GET", null, "acc1")).status, 403);
    assert.equal((await request("/api/news", "GET", null, "des1")).status, 403);
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
  assert.equal(stored.data.projects.length, 0);
  assert.equal(stored.data.archives[0].projects[0].advance, 400);

  const finance = first.body.finance;
  finance.projects.push({ id: "new-order", name: "New", client: "Ali", amount: 1000, advance: 600 });
  finance.payments.push({ id: "x3", projectId: "new-order", amount: 600 });
  assert.equal((await request("/api/finance", "PUT", { finance, revision: 1 }, "u1")).status, 200);
  assert.equal(db.data.get("settings/finance").revision, 2);
  assert.equal(db.data.get("settings/finance").data.projects[0].advance, 600);
  assert.equal((await request("/api/finance", "PUT", { finance, revision: 1 }, "u1")).status, 409);

  const news = await request("/api/news", "GET", null, "u1");
  assert.ok(news.body.activity.some(entry => /2020-01 oyi arxivlandi/.test(entry.text)));
  assert.ok(news.body.activity.some(entry => entry.category === "payments" && /600/.test(entry.text)));
  assert.ok([...db.data.keys()].some(key => key.startsWith("activityLog/")));
});

test("month rollover archives all orders including unpaid and unfinished orders", async t => {
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
  assert.equal(next.projects.length, 0);
  assert.equal(next.archives[0].projects.length, 2);
  assert.equal(next.archives[0].projects[0].amount, 1000);
  assert.equal(next.archives[0].projects[0].advance, 200);
  assert.equal(next.archives[0].projects[0].outstandingBalance, 800);
  assert.equal(next.archives[0].projects[0].debtClosed, false);
  assert.equal(exports.archiveOpenCycle(next).archives.length, 1);
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

test('report controls always select the current Tashkent month', () => {
  const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const body = source.match(/function ensureReportPeriods\(\) \{[\s\S]*?\n    \}/)[0];
  const el = { reportYear: {}, reportMonth: {} };
  let date = '2026-12-01';
  const context = { el, today: () => date, ledgerRows: () => [{ month: '2025-01' }], MONTH_LABELS: Array.from({ length: 12 }, (_, i) => String(i + 1)) };
  vm.runInNewContext(body + '; ensureReportPeriods();', context);
  assert.equal(el.reportYear.innerHTML, '<option value="2026">2026</option>');
  assert.equal(el.reportMonth.innerHTML, '<option value="12">12</option>');
  date = '2027-01-01';
  context.ensureReportPeriods();
  assert.equal(el.reportYear.innerHTML, '<option value="2027">2027</option>');
  assert.equal(el.reportMonth.innerHTML, '<option value="01">1</option>');
});

test('existing carried orders are archived mid-month without losing updates or duplicating records', async t => {
  const { exports, store, request } = await startServer(t);
  const now = monthKey(new Date());
  const finance = {
    payment: { currentMonth: now, lastPaidMonth: now },
    projects: [
      { id: 'old', name: 'Old order', originMonth: '2020-01', carriedFromMonth: '2020-02', amount: 1000, advance: 700, status: 'Yakunlangan' },
      { id: 'new', name: 'Current order', startDate: now + '-01', amount: 500, advance: 0 }
    ],
    payments: [{ id: 'later', projectId: 'old', amount: 500, date: now + '-01' }],
    designs: [{ id: 'design', projectId: 'old' }],
    archives: [{ id: 'archive-2020-01', month: '2020-01', projects: [{ id: 'old', amount: 1000, advance: 200 }], payments: [{ id: 'initial', projectId: 'old', amount: 200, date: '2020-01-01' }] }]
  };
  const original = JSON.stringify(finance);
  const fixed = exports.archiveOpenCycle(finance);
  assert.equal(JSON.stringify(finance), original, 'migration must not mutate the input snapshot');
  assert.deepEqual(Array.from(fixed.projects, p => p.id), ['new']);
  assert.equal(fixed.archives[0].projects.length, 1);
  assert.equal(fixed.archives[0].projects[0].advance, 700);
  assert.equal(fixed.archives[0].projects[0].outstandingBalance, 300);
  assert.equal(fixed.archives[0].projects[0].status, 'Yakunlangan');
  assert.equal(fixed.archives[0].payments.length, 2);
  assert.equal(fixed.archives[0].payments[1].date, now + '-01');
  assert.equal(fixed.archives[0].designs.length, 1);
  assert.equal(fixed.payments.length, 0);
  assert.equal(JSON.stringify(exports.archiveOpenCycle(fixed)), JSON.stringify(fixed));
  store.finance = finance;
  const response = await request('/api/finance');
  assert.equal(response.status, 200);
  assert.equal(store.finance.projects.length, 1, 'GET persists the repair');
  assert.equal(store.finance.archives[0].projects[0].advance, 700);
});

test('monthly income follows the order month while payment dates and weekly cash flow remain intact', () => {
  const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const body = source.match(/function ledgerRows\(\) \{[\s\S]*?\n    \}/)[0];
  const state = { finance: {
    archives: [{ month: '2026-10', projects: [{ id: 'old', originMonth: '2026-10' }], payments: [{ id: 'p1', projectId: 'old', amount: 7800000, date: '2026-11-17' }] }],
    projects: [{ id: 'new', startDate: '2026-11-01' }],
    payments: [{ id: 'p2', projectId: 'new', date: '2026-11-20', amount: 100 }],
    expenses: [{ id: 'e', date: '2026-11-20', amount: 10 }]
  } };
  const rows = vm.runInNewContext(body + '; ledgerRows();', { state });
  assert.equal(rows.find(r => r.record.id === 'p1').month, '2026-10');
  assert.equal(rows.find(r => r.record.id === 'p1').record.date, '2026-11-17');
  assert.equal(rows.filter(r => r.month === '2026-11' && r.kind === 'income').reduce((sum, r) => sum + r.record.amount, 0), 100);
  assert.equal(rows.find(r => r.record.id === 'e').month, '2026-11');
});

test('admins and accountants can give founder advances without founder or expense permissions', async t => {
  const { store, request } = await startServer(t);
  const now = monthKey(new Date());
  store.finance = { payment: { currentMonth: now, lastPaidMonth: now }, founders: [{ id: 'f1', name: 'Founder', share: 100 }], expenses: [{ id: 'original', type: 'custom', amount: 20 }] };
  for (const role of ['admin', 'accountant']) {
    store.users.push({ id: role, username: role, role, permissions: '[]' });
    const current = await request('/api/finance', 'GET', null, role);
    assert.equal(current.status, 200);
    assert.equal(current.body.finance.founders.length, 0);
    assert.deepEqual(current.body.finance.founderOptions, [{ id: 'f1', name: 'Founder' }]);
    const finance = current.body.finance;
    finance.expenses.push({ id: role + '-advance', type: 'founder_avans', founderId: 'f1', amount: 100, date: now + '-01', paymentType: 'naqd', allocations: [] });
    const saved = await request('/api/finance', 'PUT', { finance, revision: current.body.revision }, role);
    assert.equal(saved.status, 200);
    assert.ok(store.finance.expenses.some(e => e.id === role + '-advance'));
    assert.ok(store.finance.expenses.some(e => e.id === 'original'));
    const fresh = await request('/api/finance', 'GET', null, role);
    fresh.body.finance.expenses.push({ id: role + '-forbidden', type: 'custom', amount: 100 });
    assert.equal((await request('/api/finance', 'PUT', { finance: fresh.body.finance, revision: fresh.body.revision }, role)).status, 403);
    fresh.body.finance.expenses.pop();
    fresh.body.finance.expenses.push({ id: role + '-invalid', type: 'founder_avans', founderId: 'missing', amount: 100, allocations: [] });
    assert.equal((await request('/api/finance', 'PUT', { finance: fresh.body.finance, revision: fresh.body.revision }, role)).status, 400);
  }
  store.users.push({ id: 'viewer', username: 'viewer', role: 'viewer', permissions: '[]' });
  assert.equal((await request('/api/finance', 'PUT', { finance: store.finance, revision: store.revision }, 'viewer')).status, 403);
});
