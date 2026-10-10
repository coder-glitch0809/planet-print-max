const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// JWT kaliti hech qachon ochiq standart qiymat bo'lmasligi kerak: aks holda istalgan odam
// super admin tokenini yasay oladi. JWT_SECRET berilmasa, service account kalitidan barqaror
// maxfiy qiymat olinadi (Vercelning barcha instansiyalarida bir xil bo'ladi).
function resolveJwtSecret() {
  const configured = String(process.env.JWT_SECRET || "");
  const placeholders = ["", "please_change_to_long_random_secret", "planet_print_change_me"];
  if (!placeholders.includes(configured)) return configured;
  let material = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT || "";
  if (!material) {
    try { material = fs.readFileSync(path.join(__dirname, "firebase-config.json"), "utf8"); } catch { material = ""; }
  }
  console.warn("JWT_SECRET sozlanmagan yoki standart qiymatda. Hosting muhitida kuchli JWT_SECRET kiriting.");
  if (material) return crypto.createHash("sha256").update(`planet-print-jwt:${material}`).digest("hex");
  return crypto.randomBytes(48).toString("hex");
}
const JWT_SECRET = resolveJwtSecret();
// Zaxira super admin faqat SUPER_PASS muhit o'zgaruvchisi aniq berilganda ishlaydi.
const FALLBACK_ADMIN_USER = process.env.SUPER_USER || "Superadmin";
const FALLBACK_ADMIN_PASS = String(process.env.SUPER_PASS || "");
const FALLBACK_ADMIN_ENABLED = FALLBACK_ADMIN_PASS.length >= 8;

function clearDeadLocalProxy() {
  const proxyKeys = [
    "HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy",
    "ALL_PROXY", "all_proxy", "GIT_HTTP_PROXY", "GIT_HTTPS_PROXY"
  ];
  for (const key of proxyKeys) {
    if (String(process.env[key] || "").includes("127.0.0.1:9")) {
      delete process.env[key];
    }
  }
}

clearDeadLocalProxy();

const DEFAULT_FINANCE = {
  projects: [],
  payments: [],
  workers: [],
  founders: [],
  expenses: [],
  archives: [],
  measurements: [],
  designs: [],
  payment: { lastArchiveMonth: "", lastPaidMonth: "" },
  settings: { tax: 0, reserve: 0, other: 0 }
};
const FINANCE_PERMS = ["dashboard", "projects", "designs", "workers", "founders", "expenses", "payments", "reports", "measurements", "settings"];

let firestore;
const memoryStore = global.__planetPrintMemoryStore || {
  users: [],
  finance: DEFAULT_FINANCE
};
if (!Number.isFinite(memoryStore.revision)) memoryStore.revision = 0;
if (!Array.isArray(memoryStore.activity)) memoryStore.activity = [];
global.__planetPrintMemoryStore = memoryStore;
const CHANGELOG = require("./changelog");

function withTimeout(promise, ms, message = "Request timeout") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function safeJsonParse(value, fallback) {
  try {
    if (value && typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeServiceAccount(serviceAccount) {
  if (!serviceAccount || typeof serviceAccount !== "object") return serviceAccount;
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
  return serviceAccount;
}

async function initDb() {
  let serviceAccount = null;

  // 1. Environment Variable orqali tekshirish (Vercel uchun eng asosiysi)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
      serviceAccount = normalizeServiceAccount(JSON.parse(decoded));
      console.log("Firebase loaded from FIREBASE_SERVICE_ACCOUNT_BASE64");
    } catch (err) {
      console.error("FIREBASE_SERVICE_ACCOUNT_BASE64 parse xatosi:", err.message);
    }
  }

  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = normalizeServiceAccount(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
      console.log("✅ Firebase loaded from Environment Variables");
    } catch (err) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT parse xatosi:', err.message);
    }
  } 
  
  // 2. Agar ENV bo'lmasa, fayldan qidirish (Local dev uchun)
  if (!serviceAccount) {
    const configPath = path.join(__dirname, "firebase-config.json");
    if (fs.existsSync(configPath)) {
      try {
        serviceAccount = normalizeServiceAccount(require("./firebase-config.json"));
        console.log("✅ Firebase loaded from local firebase-config.json");
      } catch (err) {
        console.error("❌ local firebase-config.json o'qishda xato:", err.message);
      }
    }
  }

  // 3. Tekshiruv: Ma'lumot umuman topilmasa xato berish
  if (!serviceAccount || !serviceAccount.project_id || serviceAccount.project_id === "SIZNING_PROJECT_ID") {
    console.error("❌ Firebase config topilmadi! Vercel Settings -> Environment Variables orqali FIREBASE_SERVICE_ACCOUNT ni qo'shing.");
    throw new Error('Firebase credentials missing or invalid');
  }

  // Initsializatsiya (Faqat bir marta)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  firestore = admin.firestore();
  firestore.settings({
    ignoreUndefinedProperties: true,
    preferRest: true
  });
}

// --- Middlewares & Helpers ---

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: safeJsonParse(user.permissions, [])
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function fallbackAdminUser() {
  return {
    id: "fallback-super-admin",
    username: FALLBACK_ADMIN_USER,
    role: "super_admin",
    permissions: JSON.stringify(["dashboard", "projects", "designs", "workers", "founders", "expenses", "payments", "reports", "measurements", "users", "settings"])
  };
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    phone: normalizePhone(user.phone),
    permissions: safeJsonParse(user.permissions, []),
    createdAt: user.createdAt || Date.now()
  };
}

function normalizeFinance(finance) {
  const src = finance && typeof finance === "object" ? finance : {};
  return {
    projects: Array.isArray(src.projects) ? src.projects : [],
    payments: Array.isArray(src.payments) ? src.payments : [],
    workers: Array.isArray(src.workers) ? src.workers : [],
    founders: Array.isArray(src.founders) ? src.founders : [],
    expenses: Array.isArray(src.expenses) ? src.expenses : [],
    archives: Array.isArray(src.archives) ? src.archives : [],
    measurements: Array.isArray(src.measurements) ? src.measurements : [],
    designs: Array.isArray(src.designs) ? src.designs : [],
    payment: {
      lastArchiveMonth: sanitizeText(src.payment?.lastArchiveMonth, 12),
      lastPaidMonth: sanitizeText(src.payment?.lastPaidMonth, 12),
      currentMonth: sanitizeText(src.payment?.currentMonth, 12),
      dueDay: Number(src.payment?.dueDay) || 5,
      locked: !!src.payment?.locked,
      reminder: !!src.payment?.reminder,
      daysUntilDue: Number(src.payment?.daysUntilDue) || 0
    },
    settings: {
      tax: Number(src.settings?.tax) || 0,
      reserve: Number(src.settings?.reserve) || 0,
      other: Number(src.settings?.other) || 0
    }
  };
}

function tashkentDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return {
    year: parts.year,
    month: parts.month,
    day: Number(parts.day),
    monthKey: `${parts.year}-${parts.month}`
  };
}

function archiveOpenCycle(finance) {
  const next = normalizeFinance(finance);
  const now = tashkentDateParts();
  if (!next.payment.currentMonth) next.payment.currentMonth = now.monthKey;
  if (next.payment.currentMonth >= now.monthKey) return next;

  const archivedMonth = next.payment.currentMonth;
  const archivedAt = new Date().toISOString();
  const archivedProjects = next.projects.map((project) => {
    const debt = Math.max(Number(project.amount || 0) - Number(project.advance || 0), 0);
    return {
      ...project,
      debtClosed: debt === 0,
      debtClosedAt: debt === 0 ? archivedAt : "",
      outstandingBalance: debt
    };
  });
  if (!next.archives.some((archive) => archive.month === archivedMonth)) {
    next.archives.unshift({
      id: `archive-${archivedMonth}`,
      month: archivedMonth,
      archivedAt,
      projects: archivedProjects,
      expenses: next.expenses,
      payments: next.payments,
      workers: next.workers,
      founders: next.founders,
      measurements: next.measurements,
      designs: next.designs
    });
  }

  // Qarzi qolgan zakaz keyingi oyga asl summasi va to'langan qismi bilan o'tadi.
  // carriedFromMonth belgisi bu zakaz daromadi avvalgi oyda hisoblanganini bildiradi,
  // shuning uchun u yangi oyning ta'sischi fondi/soliq/zaxirasiga qayta qo'shilmaydi.
  next.projects = next.projects
    .map((project) => {
      const remaining = Math.max(Number(project.amount || 0) - Number(project.advance || 0), 0);
      return remaining > 0
        ? { ...project, carriedFromMonth: archivedMonth, originMonth: project.originMonth || archivedMonth }
        : null;
    })
    .filter(Boolean);
  next.expenses = [];
  next.payments = [];
  next.measurements = [];
  next.designs = [];
  next.payment.lastArchiveMonth = archivedMonth;
  next.payment.currentMonth = now.monthKey;
  return next;
}

function addPaymentLockInfo(finance) {
  const next = normalizeFinance(finance);
  const now = tashkentDateParts();
  next.payment.currentMonth = now.monthKey;
  next.payment.dueDay = 5;
  next.payment.locked = now.day >= 5 && next.payment.lastPaidMonth !== now.monthKey;
  next.payment.reminder = next.payment.lastPaidMonth !== now.monthKey;
  next.payment.daysUntilDue = Math.max(5 - now.day, 0);
  return next;
}

function canAccess(req, perm) {
  if (req.user?.role === "super_admin") return true;
  const permissions = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
  return permissions.includes(perm);
}

function clientProjectView(project) {
  return {
    id: project.id,
    name: project.name,
    client: project.client,
    clientLogin: project.clientLogin,
    startDate: project.startDate,
    dueDate: project.dueDate,
    status: project.status
  };
}

function designerProjectView(project) {
  return {
    id: project.id,
    name: project.name,
    client: project.client
  };
}

function visibleFinanceForUser(req, finance) {
  const full = normalizeFinance(finance);
  if (req.user?.role === "super_admin") return full;
  if (req.user?.role === "client") {
    const username = String(req.user.username || "").toLowerCase();
    const assignedProjects = full.projects
      .filter((project) => {
        const clientLogin = String(project.clientLogin || "").toLowerCase();
        const clientUserId = String(project.clientUserId || "");
        const clientName = String(project.client || "").toLowerCase();
        return clientUserId === req.user.id || clientLogin === username || clientName === username;
      })
      .map(clientProjectView);
    return {
      projects: assignedProjects,
      payments: [],
      workers: [],
      founders: [],
      expenses: [],
      archives: [],
      measurements: [],
      designs: [],
      payment: full.payment,
      settings: { tax: 0, reserve: 0, other: 0 }
    };
  }
  return {
    projects: canAccess(req, "projects") || canAccess(req, "dashboard") || canAccess(req, "payments") || canAccess(req, "reports")
      ? full.projects
      : canAccess(req, "designs") ? full.projects.map(designerProjectView) : [],
    workers: canAccess(req, "workers") ? full.workers : [],
    founders: canAccess(req, "founders") ? full.founders : [],
    expenses: canAccess(req, "expenses") || canAccess(req, "reports") ? full.expenses : [],
    payments: canAccess(req, "payments") || canAccess(req, "reports") ? full.payments : [],
    archives: canAccess(req, "dashboard") || canAccess(req, "projects") || canAccess(req, "expenses") || canAccess(req, "reports")
      ? full.archives.map(archive => {
        const visible = visibleFinanceForUser(req, { ...archive, archives: [] });
        return { id: archive.id, month: archive.month, archivedAt: archive.archivedAt,
          projects: visible.projects, expenses: visible.expenses, payments: visible.payments,
          workers: visible.workers, founders: visible.founders, measurements: visible.measurements, designs: visible.designs };
      }) : [],
    measurements: canAccess(req, "measurements") ? full.measurements : [],
    designs: canAccess(req, "projects") || canAccess(req, "designs") ? full.designs.filter(design => req.user.role !== "worker" || design.approved === true) : [],
    payment: full.payment,
    settings: canAccess(req, "settings") ? full.settings : { tax: 0, reserve: 0, other: 0 }
  };
}

// Arxivni brauzer qayta yoza olmaydi: faqat super admin "Qarz yopildi" belgisini qo'ya oladi.
function mergeArchiveDebtFlags(currentArchives, incomingArchives) {
  const closed = new Map();
  incomingArchives.forEach(archive => (Array.isArray(archive?.projects) ? archive.projects : []).forEach(project => {
    if (project?.debtClosed === true) closed.set(`${archive.id}|${project.id}`, sanitizeText(project.debtClosedAt, 40) || new Date().toISOString());
  }));
  return currentArchives.map(archive => ({
    ...archive,
    projects: (Array.isArray(archive.projects) ? archive.projects : []).map(project => {
      const key = `${archive.id}|${project.id}`;
      return !project.debtClosed && closed.has(key) ? { ...project, debtClosed: true, debtClosedAt: closed.get(key) } : project;
    })
  }));
}

function mergeFinanceForUser(req, currentFinance, incomingFinance) {
  const current = normalizeFinance(currentFinance);
  const incoming = normalizeFinance(incomingFinance);
  if (req.user?.role === "super_admin") {
    // To'lov holati va arxiv server tomonidan boshqariladi; eski sahifa ularni qaytarib yozmasin.
    return { ...incoming, payment: current.payment, archives: mergeArchiveDebtFlags(current.archives, incoming.archives) };
  }
  if (["client", "viewer"].includes(req.user?.role)) return current;

  const next = { ...current };
  if (canAccess(req, "projects")) next.projects = incoming.projects;
  if (canAccess(req, "payments")) {
    next.payments = incoming.payments;
    if (!canAccess(req, "projects")) next.projects = current.projects.map(project => {
      const updated = incoming.projects.find(item => item.id === project.id);
      return updated ? { ...project, advance: updated.advance } : project;
    });
  }
  if (canAccess(req, "projects") && !canAccess(req, "payments")) {
    const newIds = new Set(next.projects.filter(p => !current.projects.some(old => old.id === p.id)).map(p => p.id));
    next.payments = [...current.payments, ...incoming.payments.filter(p => newIds.has(p.projectId))];
  }
  if (canAccess(req, "workers")) next.workers = incoming.workers;
  if (canAccess(req, "founders")) next.founders = incoming.founders;
  if (canAccess(req, "expenses")) next.expenses = incoming.expenses;
  if (canAccess(req, "measurements")) next.measurements = incoming.measurements;
  if (req.user.role !== "worker" && (canAccess(req, "projects") || canAccess(req, "designs"))) next.designs = incoming.designs;
  if (canAccess(req, "settings")) next.settings = incoming.settings;
  next.archives = current.archives;
  next.payment = current.payment;
  return next;
}

const FINANCE_COLLECTIONS = ["projects", "payments", "workers", "founders", "expenses", "measurements", "designs"];
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const isMoney = (value, allowZero = true) => {
  const n = Number(value);
  return value !== "" && value !== null && Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
};

function changedRows(currentRows, nextRows) {
  const before = new Map(currentRows.map(row => [String(row.id), JSON.stringify(row)]));
  return nextRows.filter(row => before.get(String(row.id)) !== JSON.stringify(row));
}

function validateFinanceChanges(current, next) {
  for (const key of FINANCE_COLLECTIONS) {
    const ids = next[key].map(row => String(row?.id ?? ""));
    const changed = changedRows(current[key], next[key]);
    // Identifikator HTML atributlariga tushadi: faqat xavfsiz belgilar qabul qilinadi.
    if (changed.some(row => !row || typeof row !== "object" || !SAFE_ID.test(String(row.id ?? "")))) return "Yozuv identifikatori noto'g'ri.";
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (changed.some(row => duplicates.includes(String(row.id)))) return "Yozuv identifikatori takrorlangan.";
  }
  if (new Set(next.payments.map(p => p.id)).size !== next.payments.length) return "To'lov identifikatori takrorlangan.";
  const phones = next.workers.map(w => normalizePhone(w.phone)).filter(Boolean);
  if (new Set(phones).size !== phones.length) return "Xodim telefon raqami takrorlangan.";
  if (next.workers.some(w => w.phone && !/^\d{9,15}$/.test(normalizePhone(w.phone)))) return "Telefon raqami noto'g'ri.";
  const paymentTotal = (rows, projectId) => rows.filter(p => p.projectId === projectId).reduce((sum, p) => sum + Number(p.amount), 0);
  for (const project of next.projects) {
    if (!isMoney(project.amount) || !isMoney(project.advance) || Number(project.advance) > Number(project.amount) + 0.001) return "Zakaz to'lov summasi noto'g'ri.";
    const previous = current.projects.find(p => p.id === project.id);
    if (previous) {
      if (Math.abs((Number(project.advance) - Number(previous.advance)) - (paymentTotal(next.payments, project.id) - paymentTotal(current.payments, project.id))) > 0.01) return "Zakaz qoldig'i to'lov yozuvlariga mos emas.";
    } else if (Math.abs(Number(project.advance) - paymentTotal(next.payments, project.id)) > 0.01) {
      // Yangi zakazning oldindan olingan summasi albatta to'lov yozuvi bilan kelishi kerak.
      return "Yangi zakazning oldindan to'lovi to'lov yozuviga mos emas.";
    }
  }
  for (const payment of next.payments) {
    if (!isMoney(payment.amount, false)) return "To'lov summasi noto'g'ri.";
  }
  for (const expense of changedRows(current.expenses, next.expenses)) {
    if (!isMoney(expense.amount, false)) return "Xarajat summasi noto'g'ri.";
  }
  for (const worker of changedRows(current.workers, next.workers)) {
    if (!isMoney(worker.salary)) return "Ishchi oyligi noto'g'ri.";
  }
  if (changedRows(current.founders, next.founders).length || current.founders.length !== next.founders.length) {
    if (next.founders.some(f => !Number.isFinite(Number(f.share)) || Number(f.share) <= 0 || Number(f.share) > 100)) return "Ta'sischi foizi noto'g'ri.";
    if (next.founders.reduce((sum, f) => sum + Number(f.share), 0) > 100.0001) return "Ta'sischilar foizi jami 100% dan oshmasligi kerak.";
  }
  if (JSON.stringify(current.settings) !== JSON.stringify(next.settings)) {
    const { tax, reserve, other } = next.settings;
    if (tax < 0 || tax > 100 || reserve < 0 || reserve > 100 || other < 0) return "Sozlamalar qiymati noto'g'ri.";
  }
  return "";
}

// --- Faoliyat jurnali ("Yangiliklar" bo'limi uchun) ---
const ACTIVITY_SECTIONS = {
  projects: { label: "Zakaz", perms: ["projects"] },
  payments: { label: "To'lov", perms: ["payments"] },
  expenses: { label: "Xarajat", perms: ["expenses"] },
  workers: { label: "Ishchi", perms: ["workers"] },
  founders: { label: "Ta'sischi", perms: ["founders"] },
  measurements: { label: "O'lchov", perms: ["measurements"] },
  designs: { label: "Dizayn", perms: ["designs", "projects"] },
  settings: { label: "Sozlamalar", perms: ["settings"] },
  archive: { label: "Arxiv", perms: ["dashboard", "projects", "expenses", "reports"] },
  system: { label: "Tizim", perms: [] },
  users: { label: "Foydalanuvchilar", perms: [] }
};
const EXPENSE_TYPE_LABEL = {
  banner: "Banner", arakal: "Arakal", rezka: "Rezka", reyka: "Reyka", dostavka: "Dostavka", zapravka: "Zapravka",
  suv: "Suv", boshqa: "Boshqa", oylik_avans: "Oylik maosh avansi", oylik_tolov: "Ishchi oyligi", founder_avans: "Ta'sischi avansi"
};
const moneyText = value => `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value) || 0).replace(/ /g, " ")} UZS`;

// Jurnal matni ekranda escape qilinadi: apostroflar saqlanadi (sanitizeText ularni o'chirib yuborardi).
function plainText(value, max = 120) {
  return String(value ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function activityTitle(category, row) {
  const t = value => plainText(value, 80);
  if (category === "projects") return `${t(row.name)} — ${t(row.client)}, ${moneyText(row.amount)}`;
  if (category === "payments") return `${t(row.projectName) || "Zakaz"}: ${moneyText(row.amount)}${row.paymentType ? ` (${t(row.paymentType)})` : ""}`;
  if (category === "expenses") return `${EXPENSE_TYPE_LABEL[row.type] || t(row.type)}: ${moneyText(row.amount)}${row.workerName || row.founderName ? ` — ${t(row.workerName || row.founderName)}` : ""}`;
  if (category === "workers") return `${t(row.name)} (${t(row.role)}), oylik ${moneyText(row.salary)}`;
  if (category === "founders") return `${t(row.name)} — ${Number(row.share) || 0}%`;
  if (category === "measurements") return `${t(row.client)} — ${t(row.address)}`;
  if (category === "designs") return `${t(row.projectName) || "Dizayn"}${row.dimensions ? ` (${t(row.dimensions)})` : ""}${row.sent ? ", Telegramga yuborildi" : ""}`;
  return "";
}

const PROJECT_FIELD_LABELS = { name: "nomi", client: "mijoz", amount: "summa", advance: "to'langan", status: "holat", dueDate: "topshirish", startDate: "olingan sana" };
function projectChangeDetail(before, after) {
  return Object.entries(PROJECT_FIELD_LABELS)
    .filter(([field]) => String(before[field] ?? "") !== String(after[field] ?? ""))
    .map(([field, label]) => {
      const show = value => ["amount", "advance"].includes(field) ? moneyText(value) : plainText(value, 60) || "-";
      return `${label}: ${show(before[field])} → ${show(after[field])}`;
    }).join("; ");
}

function financeActivity(previousFinance, nextFinance) {
  const previous = normalizeFinance(previousFinance);
  const next = normalizeFinance(nextFinance);
  const entries = [];
  for (const category of FINANCE_COLLECTIONS) {
    const before = new Map(previous[category].map(row => [String(row.id), row]));
    const after = new Map(next[category].map(row => [String(row.id), row]));
    for (const [id, row] of after) {
      const old = before.get(id);
      if (!old) entries.push({ category, action: "added", text: activityTitle(category, row) });
      else if (JSON.stringify(old) !== JSON.stringify(row)) {
        const detail = category === "projects" ? projectChangeDetail(old, row) : "";
        entries.push({ category, action: "changed", text: activityTitle(category, row) + (detail ? ` | ${detail}` : "") });
      }
    }
    for (const [id, row] of before) {
      if (!after.has(id)) entries.push({ category, action: "deleted", text: activityTitle(category, row) });
    }
  }
  if (JSON.stringify(previous.settings) !== JSON.stringify(next.settings)) {
    entries.push({ category: "settings", action: "changed", text: `Soliq ${next.settings.tax}%, zaxira ${next.settings.reserve}%, qo'lda xarajat ${moneyText(next.settings.other)}` });
  }
  const closedBefore = new Set(previous.archives.flatMap(a => (a.projects || []).filter(p => p.debtClosed).map(p => `${a.id}|${p.id}`)));
  next.archives.forEach(archive => (archive.projects || []).forEach(project => {
    if (project.debtClosed && !closedBefore.has(`${archive.id}|${project.id}`)) {
      entries.push({ category: "archive", action: "changed", text: `${plainText(archive.month, 12)}: ${plainText(project.name, 80)} qarzi yopildi` });
    }
  }));
  const limit = 40;
  if (entries.length > limit) {
    const rest = entries.length - limit;
    return [...entries.slice(0, limit), { category: "system", action: "changed", text: `Yana ${rest} ta o'zgarish` }];
  }
  return entries;
}

function activityRecords(req, entries, asSystem = false) {
  const at = Date.now();
  return entries.map((entry, index) => ({
    id: `${at}-${index}-${crypto.randomBytes(3).toString("hex")}`,
    at,
    userId: asSystem ? "system" : req?.user?.id || "system",
    username: plainText(asSystem ? "Tizim" : req?.user?.username || "Tizim", 60),
    category: entry.category,
    action: entry.action,
    text: plainText(entry.text, 400)
  }));
}

function canSeeActivity(req, entry) {
  if (req.user?.role === "super_admin") return true;
  if (req.user?.role === "client") return false;
  const section = ACTIVITY_SECTIONS[entry.category];
  if (!section || !section.perms.length) return false;
  if (req.user?.role === "worker") return entry.category === "designs" && canAccess(req, "designs");
  return section.perms.some(perm => canAccess(req, perm));
}

async function logActivity(req, entries, { asSystem = false } = {}) {
  const records = activityRecords(req, entries, asSystem);
  if (!records.length) return;
  if (!firestore || usesMemoryStore(req)) {
    memoryStore.activity.unshift(...records);
    memoryStore.activity.length = Math.min(memoryStore.activity.length, 500);
    return;
  }
  try {
    const batch = firestore.batch();
    records.forEach(record => batch.set(firestore.collection("activityLog").doc(record.id), record));
    await withTimeout(batch.commit(), 10000);
  } catch (err) {
    console.error("Activity log write failed:", err.message);
  }
}

function validateNewExpenseAllocations(currentFinance, nextFinance) {
  const current = normalizeFinance(currentFinance);
  const next = normalizeFinance(nextFinance);
  const existingById = new Map(current.expenses.map((expense) => [String(expense.id), expense]));
  const validProjectIds = new Set(next.projects.map((project) => String(project.id)));
  for (const expense of next.expenses) {
    const allocations = Array.isArray(expense.allocations) ? expense.allocations : [];
    const total = allocations.reduce((sum, allocation) => sum + Number(allocation.amount || 0), 0);
    const previous = existingById.get(String(expense.id));
    const previousProjectIds = new Set((previous?.allocations || [])
      .flatMap((allocation) => [String(allocation.projectId || ""), String(allocation.fundedByProjectId || "")]));
    if (previous?.sourceProjectId) previousProjectIds.add(String(previous.sourceProjectId));
    const knownProject = (id) => validProjectIds.has(String(id)) || previousProjectIds.has(String(id));
    const valid = allocations.length > 0 &&
      allocations.every((allocation) => allocation.projectId && Number(allocation.amount) > 0 &&
        knownProject(allocation.projectId) &&
        // Ixtiyoriy: xarajat puli boshqa zakazdan olingan bo'lsa, u ham mavjud zakaz bo'lishi kerak.
        (!allocation.fundedByProjectId || knownProject(allocation.fundedByProjectId))) &&
      new Set(allocations.map((allocation) => allocation.projectId)).size === allocations.length &&
      Math.abs(total - Number(expense.amount || 0)) < 0.01;
    if (valid) continue;

    if (previous && JSON.stringify(previous) === JSON.stringify(expense)) continue;
    return `Xarajat "${sanitizeText(expense.type, 40)}" summasi zakazlarga to'liq taqsimlanishi shart.`;
  }
  return "";
}

function sendLogin(res, user) {
  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: safeJsonParse(user.permissions, [])
    }
  });
}

function loginPhone(login) {
  const raw = String(login || "").trim();
  if (!/^[+\d\s()-]+$/.test(raw)) return "";
  const phone = normalizePhone(raw);
  return /^\d{10,15}$/.test(phone) ? phone : "";
}

async function findMemoryUser(login, password) {
  const normalized = String(login || "").toLowerCase();
  const phone = loginPhone(login);
  const phoneMatches = phone ? memoryStore.users.filter(item => normalizePhone(item.phone) === phone) : [];
  if (phoneMatches.length > 1) return null;
  const user = phoneMatches[0] || memoryStore.users.find((item) =>
    String(item.username || "").toLowerCase() === normalized ||
    String(item.email || "").toLowerCase() === normalized
  );
  if (!user || !user.passHash) return null;
  const ok = await bcrypt.compare(password, user.passHash);
  return ok ? user : null;
}

async function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const claims = jwt.verify(token, JWT_SECRET);
    let user = memoryStore.users.find(item => item.id === claims.id);
    if (claims.id === "fallback-super-admin") user = FALLBACK_ADMIN_ENABLED ? fallbackAdminUser() : null;
    if (!user && firestore) {
      const doc = await withTimeout(firestore.collection("users").doc(claims.id).get(), 10000);
      if (doc.exists) user = { id: doc.id, ...doc.data() };
    }
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = publicUser(user);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function superAdminRequired(req, res, next) {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

function sanitizeText(text, max = 120) {
  return String(text || "")
    .replace(/[<>"'`]/g, "")
    .trim()
    .slice(0, max);
}

app.use(express.json({ limit: "8mb" }));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.get("/styles.css", (_req, res) => res.sendFile(path.join(__dirname, "styles.css")));
app.get("/app.js", (_req, res) => res.sendFile(path.join(__dirname, "app.js")));

let dbInitError = null;
const dbReady = initDb().catch((err) => {
  dbInitError = err;
  firestore = null;
  console.error("Firebase startup failed, fallback mode enabled:", err.message);
});

app.use("/api", async (_req, res, next) => {
  await dbReady;
  next();
});

function telegramToken() {
  if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan.");
  return process.env.TELEGRAM_BOT_TOKEN;
}

async function telegramApi(method, body, isForm = false) {
  const token = telegramToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(20000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram API xatosi (${response.status}).`);
  }
  return result.result;
}

function mediaChatId() {
  const chatId = String(process.env.TELEGRAM_MEDIA_CHAT_ID || "").trim();
  if (!chatId) throw new Error("TELEGRAM_MEDIA_CHAT_ID sozlanmagan; rasmlar uchun bot kiradigan yopiq media chat kerak.");
  return chatId;
}

function usesMemoryStore(req) {
  const id = req?.user?.id;
  return !firestore || id === "fallback-super-admin" || (!!id && memoryStore.users.some((item) => item.id === id));
}

function financeFromDoc(doc) {
  const raw = doc.exists ? doc.data() : {};
  let finance = doc.exists ? (raw.data ?? raw) : DEFAULT_FINANCE;
  if (typeof finance === "string") finance = safeJsonParse(finance, DEFAULT_FINANCE);
  return {
    finance,
    revision: Number(raw.revision) || 0,
    updatedAt: raw.updatedAt?.toMillis ? raw.updatedAt.toMillis() : Date.now()
  };
}

class HttpError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra; }
}

// Moliya hujjatini o'qib-yozishning yagona yo'li. Firestore'da tranzaksiya ichida bajariladi:
// bir vaqtda kelgan ikki so'rov bir-birining yozuvini yo'qotmaydi.
// mutate(current, { revision, archived }) => { next?, result?, activity? }
async function withFinance(req, mutate) {
  const run = async (current, context) => {
    try { return (await mutate(current, context)) || {}; }
    catch (error) { return { error }; }
  };
  let result;
  if (usesMemoryStore(req)) {
    const stored = memoryStore.finance;
    const prepared = archiveOpenCycle(stored);
    const archived = JSON.stringify(normalizeFinance(prepared)) !== JSON.stringify(normalizeFinance(stored));
    if (archived) {
      memoryStore.finance = normalizeFinance(prepared);
      memoryStore.revision += 1;
    }
    const outcome = await run(addPaymentLockInfo(prepared), { revision: memoryStore.revision, archived });
    if (outcome.next && !outcome.error) {
      memoryStore.finance = normalizeFinance(outcome.next);
      memoryStore.revision += 1;
    }
    result = { ...outcome, archived, archivedMonth: prepared.payment.lastArchiveMonth, revision: memoryStore.revision, updatedAt: Date.now(), storage: "memory", previous: prepared };
  } else {
    const ref = firestore.collection("settings").doc("finance");
    result = await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const { finance, revision, updatedAt } = financeFromDoc(doc);
      const prepared = archiveOpenCycle(finance);
      const archived = JSON.stringify(normalizeFinance(prepared)) !== JSON.stringify(normalizeFinance(finance));
      let nextRevision = archived ? revision + 1 : revision;
      const outcome = await run(addPaymentLockInfo(prepared), { revision: nextRevision, archived });
      // Xato bo'lsa ham oy arxivi saqlanadi; o'zgarish esa faqat xatosiz bo'lsa yoziladi.
      const changes = outcome.next && !outcome.error ? outcome.next : null;
      const toSave = changes || (archived ? prepared : null);
      if (changes) nextRevision += 1;
      if (toSave) {
        tx.set(ref, { data: normalizeFinance(toSave), revision: nextRevision, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      return { ...outcome, archived, archivedMonth: prepared.payment.lastArchiveMonth, revision: nextRevision, updatedAt: toSave ? Date.now() : updatedAt, previous: prepared };
    });
  }
  if (result.archived) {
    await logActivity(req, [{ category: "archive", action: "added", text: `${result.archivedMonth} oyi arxivlandi; qarzi qolgan zakazlar yangi oyga o'tdi` }], { asSystem: true });
  }
  if (result.error) throw result.error;
  return result;
}

async function paymentIsLockedForUser(req) {
  if (usesMemoryStore(req)) return addPaymentLockInfo(archiveOpenCycle(memoryStore.finance)).payment.locked;
  const doc = await firestore.collection("settings").doc("finance").get();
  return addPaymentLockInfo(archiveOpenCycle(financeFromDoc(doc).finance)).payment.locked;
}

// --- API Routes ---

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString(), db: !!firestore, fallback: !!dbInitError });
});

const { normalizePhone, createTelegramStaff } = require("./telegram-staff");
const telegramStaff = createTelegramStaff({ app, authRequired, superAdminRequired, telegramApi,
  getFirestore: () => firestore, memoryStore, normalizeFinance });

app.post("/api/telegram/upload-photo", authRequired, async (req, res) => {
  try {
    const kind = req.body?.kind === "measurement" ? "measurement" : "design";
    if (kind === "measurement" && !canAccess(req, "measurements")) return res.status(403).json({ error: "O'lchovlar huquqi kerak." });
    if (kind === "measurement" && ["viewer", "client"].includes(req.user.role)) return res.status(403).json({ error: "O'lchov rasmi yuklash huquqi yo'q." });
    if (kind === "design" && !canAccess(req, "designs") && !canAccess(req, "projects")) return res.status(403).json({ error: "Dizaynlar huquqi kerak." });
    if (kind === "design" && ["viewer", "client", "worker"].includes(req.user.role)) return res.status(403).json({ error: "Dizayn yuborish huquqi yo'q." });
    if (req.user.role !== "super_admin" && await paymentIsLockedForUser(req)) {
      return res.status(423).json({ error: "To'lov qilinmaguncha tizim yopiq." });
    }
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.image || ""));
    if (!match) return res.status(400).json({ error: "Faqat JPEG, PNG yoki WebP rasm qabul qilinadi." });
    const image = Buffer.from(match[2], "base64");
    if (!image.length || image.length > 3 * 1024 * 1024) return res.status(413).json({ error: "Siqilgan rasm 3 MB dan kichik bo'lishi kerak." });
    const form = new FormData();
    form.set("chat_id", mediaChatId());
    form.set("photo", new Blob([image], { type: `image/${match[1]}` }), `planet-print-${crypto.randomUUID()}.${match[1]}`);
    form.set("caption", kind === "measurement" ? "Planet Print | O'lchov rasmi" : "Planet Print | Dizayn");
    const sent = await telegramApi("sendPhoto", form, true);
    const photo = sent.photo?.at(-1);
    if (!photo?.file_id) throw new Error("Telegram rasm file_id qaytarmadi.");
    res.json({ fileId: photo.file_id });
  } catch (err) {
    console.error("Telegram photo upload failed:", err.message);
    res.status(502).json({ error: err.message || "Rasm Telegramga yuborilmadi." });
  }
});

app.post("/api/telegram/send-design", authRequired, async (req, res) => {
  try {
    if ((!canAccess(req, "designs") && !canAccess(req, "projects")) || ["viewer", "client", "worker"].includes(req.user.role)) return res.status(403).json({ error: "Dizayn yuborish huquqi yo'q." });
    if (req.user.role !== "super_admin" && await paymentIsLockedForUser(req)) return res.status(423).json({ error: "To'lov qilinmaguncha tizim yopiq." });
    const finance = await telegramStaff.finance();
    const design = finance.designs.find(item => item.id === req.body?.designId);
    if (!design) return res.status(404).json({ error: "Saqlangan dizayn topilmadi." });
    if (design.approved !== true) return res.status(400).json({ error: "Tasdiqlanmagan dizayn yuborilmaydi." });
    const fileId = String(design.photoFileId || "");
    const dimensions = sanitizeText(design.dimensions, 100);
    const instruction = sanitizeText(design.note, 400);
    if (!fileId || !dimensions || !instruction) return res.status(400).json({ error: "Dizayn rasmi, o'lchamlari va montaj vazifasini to'ldiring." });
    const project = finance.projects.find(item => item.id === design.projectId);
    if (!project) return res.status(400).json({ error: "Dizayn zakazi topilmadi." });
    const caption = `TASDIQLANGAN DIZAYN — MONTAJ VAZIFASI\nZakaz: ${sanitizeText(project.name)}\nO'lcham: ${dimensions}\nBajariladigan ish: ${instruction}`;
    const delivery = await telegramStaff.deliver("approved_designs", caption, undefined, fileId);
    if (!delivery.sent) throw new Error("Dizayn yuborilmadi. Foydalanuvchi telefoni, Telegram bog'lanishi va Dizaynlar ruxsatini tekshiring.");
    res.json({ ok: true, messageId: null, delivery });
  } catch (err) {
    console.error("Approved design Telegram delivery failed:", err.message);
    res.status(502).json({ error: err.message || "Dizayn foydalanuvchilarga yuborilmadi." });
  }
});

app.get("/api/telegram/photo/:fileId", authRequired, async (req, res) => {
  if (!canAccess(req, "measurements") && !canAccess(req, "projects") && !canAccess(req, "designs")) return res.status(403).json({ error: "Rasmni ko'rish huquqi yo'q." });
  const fileId = String(req.params.fileId || "");
  if (!/^[A-Za-z0-9_-]{10,512}$/.test(fileId)) return res.status(400).json({ error: "Rasm identifikatori noto'g'ri." });
  try {
    const file = await telegramApi("getFile", { file_id: fileId });
    if (!file.file_path) return res.status(404).json({ error: "Telegram rasmi topilmadi." });
    const response = await fetch(`https://api.telegram.org/file/bot${telegramToken()}/${file.file_path}`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Telegram faylini olishda xato (${response.status}).`);
    res.type(path.extname(file.file_path).slice(1) || "jpeg");
    res.set("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error("Telegram photo retrieval failed:", err.message);
    res.status(502).json({ error: err.message || "Rasmni olib bo'lmadi." });
  }
});

app.post("/api/telegram/announcement", authRequired, superAdminRequired, async (req, res) => {
  const text = sanitizeText(req.body?.text, 3500);
  if (!text) return res.status(400).json({ error: "E'lon matnini kiriting." });
  try {
    const result = await telegramStaff.deliver("announcements", text);
    res.json({ ok: true, sent: result });
  } catch (err) {
    console.error("Telegram announcement failed:", err.message);
    res.status(502).json({ error: err.message || "E'lon Telegramga yuborilmadi." });
  }
});

app.get("/api/auth/setup-status", async (_req, res) => {
  if (!firestore) return res.json({ needsSetup: false, fallback: true });
  try {
    const usersSnapshot = await withTimeout(firestore.collection("users").limit(1).get(), 10000);
    res.json({ needsSetup: usersSnapshot.empty });
  } catch (err) {
    console.error("Setup status failed:", err.message);
    res.json({ needsSetup: false });
  }
});

app.post("/api/auth/setup", async (req, res) => {
  if (!firestore) {
    return res.status(503).json({ error: "Firebase ulanmagan. Vaqtinchalik admin login orqali kiring." });
  }
  const usersSnapshot = await firestore.collection("users").limit(1).get();
  if (!usersSnapshot.empty) {
    return res.status(400).json({ error: "Setup already done" });
  }

  const username = sanitizeText(req.body?.username, 32);
  const password = String(req.body?.password || "");
  const email = sanitizeText(req.body?.email, 128) || (username ? `${username}@planetprint.local` : "");
  
  if (!username || password.length < 8) {
    return res.status(400).json({ error: "Invalid credentials (min 8 chars)" });
  }

  const passHash = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).slice(2, 10);
  const permissions = JSON.stringify(["dashboard", "projects", "designs", "workers", "founders", "expenses", "payments", "reports", "measurements", "users", "settings"]);

  try {
    if (email) {
      await admin.auth().createUser({ email, password });
    }
  } catch (err) {
    console.warn('Warning creating firebase auth user:', err.message);
  }

  await firestore.collection("users").doc(id).set({
    username,
    email: email || null,
    passHash,
    role: "super_admin",
    permissions,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const login = sanitizeText(req.body?.username, 128);
  const password = String(req.body?.password || "");

  if (!login && !password) return res.status(400).json({ error: "Login ham, parol ham kiritilmagan" });
  if (!login) return res.status(400).json({ error: "Telefon raqami, login yoki email kiritilmagan" });
  if (!password) return res.status(400).json({ error: "Parol kiritilmagan" });

  try {
    const loginVariants = Array.from(new Set([
      login,
      login.toLowerCase(),
      login.charAt(0).toUpperCase() + login.slice(1).toLowerCase()
    ]));

    let usersSnapshot = null;
    const phone = loginPhone(login);
    if (phone) {
      usersSnapshot = await withTimeout(
        firestore.collection("users").where("phone", "==", phone).limit(2).get(),
        10000,
        "Firebase phone login timeout"
      );
      if (usersSnapshot.docs.length > 1) return res.status(401).json({ error: "Telefon raqami takrorlangan. Superadminga murojaat qiling." });
    }
    for (const value of loginVariants) {
      if (usersSnapshot && !usersSnapshot.empty) break;
      usersSnapshot = await withTimeout(
        firestore.collection("users").where("username", "==", value).limit(1).get(),
        10000,
        "Firebase login timeout"
      );
      if (!usersSnapshot.empty) break;
    }

    if ((!usersSnapshot || usersSnapshot.empty) && login.includes("@")) {
      usersSnapshot = await withTimeout(
        firestore.collection("users").where("email", "==", login.toLowerCase()).limit(1).get(),
        10000,
        "Firebase login timeout"
      );
    }

    // Xabar bir xil: tashqaridan qaysi login mavjudligini bilib bo'lmasin.
    const badLogin = () => res.status(401).json({ error: "Telefon raqami, login yoki parol noto'g'ri." });
    if (!usersSnapshot || usersSnapshot.empty) return badLogin();

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };
    if (!user.passHash) return badLogin();

    const ok = await bcrypt.compare(password, user.passHash);
    if (!ok) return badLogin();

    sendLogin(res, user);
  } catch (err) {
    console.error("Login failed:", err.message);
    const memoryUser = await findMemoryUser(login, password);
    if (memoryUser) return sendLogin(res, memoryUser);
    if (FALLBACK_ADMIN_ENABLED && login === FALLBACK_ADMIN_USER && password === FALLBACK_ADMIN_PASS) {
      return sendLogin(res, fallbackAdminUser());
    }
    if (!firestore) return res.status(401).json({ error: "Telefon raqami, login yoki parol noto'g'ri." });
    res.status(503).json({
      error: `Firebase bilan aloqa yo'q: ${err.message}. Vercel Environment Variables va Firebase service account sozlamasini tekshiring.`
    });
  }
});

app.post("/api/auth/google", async (req, res) => {
  const idToken = req.body?.idToken;
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });
  try {
    if (!firestore) return res.status(503).json({ error: "Firebase ulanmagan." });
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = String(decoded.email || "").toLowerCase();
    if (!email || decoded.email_verified !== true) return res.status(401).json({ error: "Tasdiqlangan email kerak." });
    // Faqat super admin oldindan qo'shgan foydalanuvchi kira oladi; begona Google akkaunt yaratilmaydi.
    const q = await firestore.collection("users").where("email", "==", email).limit(2).get();
    if (q.docs.length !== 1) return res.status(403).json({ error: "Bu email uchun foydalanuvchi ochilmagan." });
    const userDoc = q.docs[0];

    const user = { id: userDoc.id, ...userDoc.data() };
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, permissions: safeJsonParse(user.permissions, []) } });
  } catch (err) {
    console.error("Google auth exchange failed:", err);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  if (req.user.id === "fallback-super-admin") {
    return res.json({ user: publicUser(fallbackAdminUser()) });
  }

  const memoryUser = memoryStore.users.find((user) => user.id === req.user.id);
  if (memoryUser) return res.json({ user: publicUser(memoryUser) });

  try {
    const userDoc = await withTimeout(
      firestore.collection("users").doc(req.user.id).get(),
      10000,
      "Firebase user lookup timeout"
    );
    if (!userDoc.exists) return res.status(401).json({ error: "User not found" });
    
    const user = { id: userDoc.id, ...userDoc.data() };
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(503).json({ error: `Firebase bilan aloqa yo'q: ${err.message}` });
  }
});

function sendServerError(res, err, label) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  console.error(`${label}:`, err.message);
  res.status(503).json({ error: "Ma'lumotlar bazasi bilan aloqa yo'q. Birozdan keyin qayta urinib ko'ring." });
}

app.get("/api/finance", authRequired, async (req, res) => {
  try {
    const state = await withFinance(req, () => ({}));
    res.json({
      finance: visibleFinanceForUser(req, addPaymentLockInfo(state.previous)),
      revision: state.revision,
      updatedAt: state.updatedAt,
      ...(state.storage ? { storage: state.storage } : {})
    });
  } catch (err) { sendServerError(res, err, "Finance read failed"); }
});

app.put("/api/finance", authRequired, async (req, res) => {
  const finance = req.body?.finance;
  if (!finance || typeof finance !== "object") return res.status(400).json({ error: "Invalid payload" });
  if (!FINANCE_PERMS.some((perm) => canAccess(req, perm))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const clientRevision = Number(req.body?.revision);
  try {
    const state = await withFinance(req, (current, { revision, archived }) => {
      // Eskirgan sahifadan kelgan butun ro'yxat boshqa foydalanuvchi kiritgan yozuvlarni o'chirib yubormasin.
      if (archived || !Number.isFinite(clientRevision) || clientRevision !== revision) {
        throw new HttpError(409, archived
          ? "Yangi oy boshlandi va o'tgan oy arxivlandi. Ma'lumotlar yangilandi, amalni qayta bajaring."
          : "Ma'lumotlar boshqa foydalanuvchi tomonidan o'zgartirilgan. Sahifa yangilandi, amalni qayta bajaring.", { conflict: true });
      }
      if (current.payment.locked && req.user.role !== "super_admin") {
        throw new HttpError(423, "To'lov sanasi. Super admin to'lov qilindi deb belgilamaguncha tizim yopiq.");
      }
      const mergedFinance = mergeFinanceForUser(req, current, finance);
      const validationError = validateFinanceChanges(current, mergedFinance) || validateNewExpenseAllocations(current, mergedFinance);
      if (validationError) throw new HttpError(400, validationError);
      return { next: mergedFinance };
    });
    await logActivity(req, financeActivity(state.previous, state.next));
    const warnings = await telegramStaff.notifyChanges(normalizeFinance(state.previous), normalizeFinance(state.next));
    res.json({ ok: true, revision: state.revision, warnings, ...(state.storage ? { storage: state.storage } : {}) });
  } catch (err) { sendServerError(res, err, "Finance save failed"); }
});

app.post("/api/payment/mark-paid", authRequired, superAdminRequired, async (req, res) => {
  const now = tashkentDateParts();
  try {
    const state = await withFinance(req, (current) => {
      const next = normalizeFinance(current);
      next.payment.lastPaidMonth = now.monthKey;
      return { next };
    });
    await logActivity(req, [{ category: "system", action: "changed", text: `${now.monthKey} oyi uchun dastur to'lovi tasdiqlandi` }]);
    res.json({ ok: true, revision: state.revision, finance: visibleFinanceForUser(req, addPaymentLockInfo(state.next)), ...(state.storage ? { storage: state.storage } : {}) });
  } catch (err) { sendServerError(res, err, "Mark paid failed"); }
});

app.get("/api/news", authRequired, async (req, res) => {
  let activity = [];
  try {
    if (usesMemoryStore(req)) activity = memoryStore.activity;
    else {
      const snapshot = await withTimeout(firestore.collection("activityLog").orderBy("at", "desc").limit(300).get(), 10000);
      activity = snapshot.docs.map(doc => doc.data());
    }
  } catch (err) {
    console.error("Activity log read failed:", err.message);
  }
  res.json({
    changelog: req.user.role === "client" ? [] : CHANGELOG,
    activity: activity.filter(entry => canSeeActivity(req, entry)).slice(0, 100)
  });
});

app.get("/api/users", authRequired, superAdminRequired, async (_req, res) => {
  try {
    const usersSnapshot = await withTimeout(
      firestore.collection("users").orderBy("createdAt", "asc").get(),
      10000,
      "Firebase users timeout"
    );
    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return publicUser({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now()
      });
    });
    res.json({ users });
  } catch (err) {
    console.error("Users fallback mode:", err.message);
    res.json({ users: [publicUser(fallbackAdminUser()), ...memoryStore.users.map(publicUser)] });
  }
});

function parseAccountPhone(value) {
  const raw = String(value || "").trim();
  const phone = normalizePhone(raw);
  if (raw && (!/^[+\d\s()-]+$/.test(raw) || !/^\d{10,15}$/.test(phone))) {
    const error = new Error("Telefon raqamini davlat kodi bilan to'g'ri kiriting: +998901234567.");
    error.status = 400;
    throw error;
  }
  return phone;
}

function checkMemoryPhone(phone, id) {
  if (phone && memoryStore.users.some(user => user.id !== id && normalizePhone(user.phone) === phone)) {
    const error = new Error("Bu telefon raqami boshqa foydalanuvchiga berilgan.");
    error.status = 409;
    throw error;
  }
}

async function saveFirestoreUser(id, changes) {
  await firestore.runTransaction(async transaction => {
    if (changes.phone) {
      const samePhone = await transaction.get(firestore.collection("users").where("phone", "==", changes.phone));
      if (samePhone.docs.some(doc => doc.id !== id)) {
        const error = new Error("Bu telefon raqami boshqa foydalanuvchiga berilgan.");
        error.status = 409;
        throw error;
      }
    }
    transaction.set(firestore.collection("users").doc(id), changes, { merge: true });
  });
}

app.post("/api/users", authRequired, superAdminRequired, async (req, res) => {
  const username = sanitizeText(req.body?.username, 32);
  const password = String(req.body?.password || "");
  const role = sanitizeText(req.body?.role, 20);
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions.filter(x => FINANCE_PERMS.includes(x)) : [];
  let phone;
  try {
    phone = parseAccountPhone(req.body?.phone);
    checkMemoryPhone(phone);
  } catch (error) { return res.status(error.status || 503).json({ error: error.message }); }

  if (!username || password.length < 8) return res.status(400).json({ error: "Invalid credentials" });
  if (!["admin", "manager", "designer", "worker", "accountant", "viewer", "client"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const passHash = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).slice(2, 10);
  const email = sanitizeText(req.body?.email, 128) || `${username}@planetprint.local`;

  try {
    const existing = await withTimeout(
      firestore.collection("users").where("username", "==", username).limit(1).get(),
      10000,
      "Firebase existing user timeout"
    );
    if (!existing.empty) return res.status(409).json({ error: "Login already exists" });

    try {
      await admin.auth().createUser({ email, password });
    } catch (err) {
      console.warn('Warning creating firebase auth user:', err.message);
    }

    await withTimeout(
      saveFirestoreUser(id, {
        username,
        email,
        phone,
        passHash,
        role,
        permissions: JSON.stringify(permissions),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }),
      10000,
      "Firebase create user timeout"
    );

    await logActivity(req, [{ category: "users", action: "added", text: `${username} (${role}) qo'shildi` }]);
    return res.json({ ok: true, storage: "firebase" });
  } catch (err) {
    if (firestore) return res.status(err.status || 503).json({ error: err.status ? err.message : "Foydalanuvchini bazaga saqlab bo'lmadi. Qayta urinib ko'ring." });
    console.error("Create user fallback mode:", err.message);
  }

  const normalized = username.toLowerCase();
  const duplicate = memoryStore.users.some((user) => String(user.username || "").toLowerCase() === normalized);
  if (duplicate) return res.status(409).json({ error: "Login already exists in fallback storage" });

  memoryStore.users.push({
    id,
    username,
    email,
    phone,
    passHash,
    role,
    permissions: JSON.stringify(permissions),
    createdAt: Date.now()
  });

  await logActivity(req, [{ category: "users", action: "added", text: `${username} (${role}) qo'shildi` }]);
  res.json({
    ok: true,
    storage: "memory",
    warning: "Firebase ishlamagani uchun foydalanuvchi vaqtinchalik server xotirasida saqlandi. Vercel redeploy/cold startdan keyin yo'qolishi mumkin."
  });
});

app.put("/api/users/:id", authRequired, superAdminRequired, async (req, res) => {
  try {
    const id = sanitizeText(req.params.id, 40);
    const memoryUser = memoryStore.users.find(user => user.id === id);
    const ref = !memoryUser && firestore ? firestore.collection("users").doc(id) : null;
    const doc = ref ? await withTimeout(ref.get(), 10000) : null;
    const user = memoryUser || (doc?.exists ? doc.data() : null);
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi." });
    if (user.role === "super_admin") return res.status(400).json({ error: "Superadmin huquqlarini o'zgartirib bo'lmaydi." });
    const { role, permissions } = req.body;
    if (!["admin", "manager", "designer", "worker", "accountant", "viewer", "client"].includes(role) ||
        !Array.isArray(permissions) || permissions.some(p => !FINANCE_PERMS.includes(p))) {
      return res.status(400).json({ error: "Rol yoki huquqlar noto'g'ri." });
    }
    const phone = parseAccountPhone(req.body.phone === undefined ? user.phone : req.body.phone);
    checkMemoryPhone(phone, id);
    const changes = { role, phone, permissions: JSON.stringify([...new Set(permissions)]) };
    if (req.body.password) {
      if (String(req.body.password).length < 8) return res.status(400).json({ error: "Parol kamida 8 belgi." });
      changes.passHash = await bcrypt.hash(String(req.body.password), 10);
    }
    if (memoryUser) Object.assign(memoryUser, changes);
    else await withTimeout(saveFirestoreUser(id, changes), 10000);
    await logActivity(req, [{ category: "users", action: "changed", text: `${sanitizeText(user.username, 40)}: rol ${role}, bo'limlar: ${[...new Set(permissions)].join(", ") || "-"}${req.body.password ? ", parol yangilandi" : ""}` }]);
    res.json({ ok: true });
  } catch (err) { res.status(err.status || 503).json({ error: err.message }); }
});

app.delete("/api/users/:id", authRequired, superAdminRequired, async (req, res) => {
  const id = sanitizeText(req.params.id, 40);
  const memoryIndex = memoryStore.users.findIndex((user) => user.id === id);
  if (memoryIndex >= 0) {
    if (memoryStore.users[memoryIndex].role === "super_admin") {
      return res.status(400).json({ error: "Super adminni o'chirib bo'lmaydi" });
    }
    const [removed] = memoryStore.users.splice(memoryIndex, 1);
    await logActivity(req, [{ category: "users", action: "deleted", text: `${sanitizeText(removed.username, 40)} o'chirildi` }]);
    return res.json({ ok: true, storage: "memory" });
  }

  try {
    const userDoc = await withTimeout(
      firestore.collection("users").doc(id).get(),
      10000,
      "Firebase user delete lookup timeout"
    );
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    
    const user = userDoc.data();
    if (user.role === "super_admin") return res.status(400).json({ error: "Super adminni o'chirib bo'lmaydi" });
    
    await withTimeout(
      firestore.collection("users").doc(id).delete(),
      10000,
      "Firebase user delete timeout"
    );
    await logActivity(req, [{ category: "users", action: "deleted", text: `${sanitizeText(user.username, 40)} o'chirildi` }]);
    res.json({ ok: true, storage: "firebase" });
  } catch (err) {
    res.status(503).json({ error: `Firebase bilan aloqa yo'q: ${err.message}` });
  }
});

// SPA uchun barcha boshqa yo'llarni HTML-ga yo'naltirish
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "planet print.html"));
});

// Serverni ishga tushirish
if (require.main === module) {
  dbReady
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Planet Print server is live on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Fatal Error during startup:", err.message);
    // Vercel kabi muhitlarda portlashni oldini olish uchun jarayonni darhol to'xtatmaymiz (ixtiyoriy)
    // process.exit(1); 
  });
}

module.exports = app;
