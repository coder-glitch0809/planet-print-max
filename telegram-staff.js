const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 9 ? `998${digits}` : digits;
}

function accountPermissions(user) {
  try {
    const value = typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions;
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

const ROLE_NAMES = { worker: "Montajnik", designer: "Dizayner", manager: "Menejer", accountant: "Buxgalter", admin: "Admin", super_admin: "Superadmin", viewer: "Kuzatuvchi", client: "Mijoz" };
// Xabar turi qaysi bo'lim ruxsatiga bog'liq.
const CATEGORY_PERMISSION = { approved_designs: "designs", announcements: "settings" };
// Lavozimning o'zi yetarli bo'lgan xabarlar: buxgalter pul harakatini, dizayner o'lchovlarni doim oladi.
const ROLE_CATEGORIES = { accountant: ["projects", "payments", "expenses", "advances", "weekly_report"], designer: ["measurements"] };
// Pulga oid xabarlar (loyiha summasi, to'lov, xarajat, avans) faqat buxgalter va superadminga boradi:
// boshqa lavozimlarga bo'lim ruxsati bo'lsa ham yuborilmaydi.
const MONEY_CATEGORIES = ["projects", "payments", "expenses", "advances", "weekly_report"];
const MONEY_ROLES = ["accountant", "super_admin"];
const CATEGORY_LABELS = {
  projects: "yangi loyihalar, baholanishi, avansi va yakunlanishi",
  payments: "mijoz to'lovlari",
  expenses: "xarajatlar",
  advances: "ishchi va ta'sischi avanslari, oyliklar",
  weekly_report: "haftalik hisobot (har dushanba) va /hisobot buyrug'i",
  measurements: "o'lchovlar (rasm bilan)",
  approved_designs: "tasdiqlangan dizayn, o'lcham va montaj vazifasi",
  announcements: "e'lonlar"
};
const EXPENSE_LABELS = {
  banner: "Banner", arakal: "Arakal", rezka: "Rezka", reyka: "Reyka", dostavka: "Dostavka", zapravka: "Zapravka",
  suv: "Suv", boshqa: "Boshqa", oylik_avans: "Oylik avansi", oylik_tolov: "Oylik to'lovi", founder_avans: "Ta'sischi avansi"
};
const EXPENSE_PAYMENT_LABELS = { naqd: "Naqd", klik: "Klik", shot: "Kartadan (shot)" };
const ADVANCE_TYPES = ["oylik_avans", "oylik_tolov", "founder_avans"];
const CHAT_ID = /^-?\d{5,20}$/;
const GROUP_ADMIN_ROLES = ["super_admin", "admin", "accountant", "manager"];
const GUIDE_DIR = path.join(__dirname, "assets", "guide");

function canReceive(user, category) {
  if (user.role === "client") return false;
  if (MONEY_CATEGORIES.includes(category)) return MONEY_ROLES.includes(user.role);
  if (user.role === "super_admin") return true;
  const perms = accountPermissions(user);
  // Montajnik faqat tasdiqlangan montaj vazifasini oladi (shaxsiy avans xabari alohida, telefon orqali).
  if (user.role === "worker") return category === "approved_designs" && perms.includes("designs");
  if ((ROLE_CATEGORIES[user.role] || []).includes(category)) return true;
  return perms.includes(CATEGORY_PERMISSION[category] || category);
}

function receivedCategories(user) {
  return Object.keys(CATEGORY_LABELS).filter(category => canReceive(user, category));
}

const h = value => String(value ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const money = value => `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value) || 0).replace(/\s/g, " ")} UZS`;
const num = value => Number(value) || 0;
const dayDiff = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

// Loyiha muddatidan oldin/keyin yakunlanganini matn bilan beradi.
function completionTiming(project) {
  if (!project.completedAt || !project.dueDate) return "";
  const diff = dayDiff(project.completedAt, project.dueDate);
  if (!Number.isFinite(diff)) return "";
  if (diff > 0) return `muddatidan ${diff} kun oldin`;
  if (diff < 0) return `${-diff} kun kechikib`;
  return "o'z vaqtida";
}

const shiftDay = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
const fmtDay = iso => String(iso || "").slice(0, 10).split("-").reverse().join(".");
const tashkentDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const day = value => !value ? "" : /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : Number.isFinite(Date.parse(value)) ? tashkentDate(new Date(value)) : "";
const sum = (rows, pick = r => r.amount) => rows.reduce((a, r) => a + num(pick(r)), 0);
const debtOf = project => Math.max(num(project.amount) - num(project.advance), 0);
const percent = (part, whole) => whole > 0 ? Math.round(part / whole * 100) : 0;

// Joriy oy va arxivdagi yozuvlar birga: hafta oy chegarasidan o'tsa ham to'liq hisoblanadi.
// Bir xil id bo'lsa joriy (yangi) yozuv olinadi.
function allRows(fin, key) {
  const seen = new Set();
  const rows = [];
  [fin, ...(Array.isArray(fin.archives) ? fin.archives : [])].forEach(source =>
    (Array.isArray(source?.[key]) ? source[key] : []).forEach(row => {
      if (!row || seen.has(String(row.id))) return;
      seen.add(String(row.id));
      rows.push(row);
    }));
  return rows;
}

function listLines(items, render, max = 12) {
  const lines = items.slice(0, max).map((item, i) => `${i + 1}. ${render(item)}`);
  if (items.length > max) lines.push(`… va yana ${items.length - max} ta`);
  return lines;
}

function changeText(now, before) {
  if (!before) return now ? " (o'tgan hafta: 0)" : "";
  const diff = percent(now - before, before);
  return ` (o'tgan haftaga nisbatan ${diff > 0 ? "+" : ""}${diff}%)`;
}

// Haftalik hisobot matni (bir yoki bir nechta Telegram xabari). Faqat pul ko'rishga ruxsati borlarga.
function weeklyReportText(fin, { from, to, today }) {
  const inRange = (value, a = from, b = to) => { const d = day(value); return !!d && d >= a && d <= b; };
  const prevFrom = shiftDay(from, -7), prevTo = shiftDay(from, -1);
  const payments = allRows(fin, "payments");
  // Haftadan keyingi to'lovlar tarixiy qarz holatini o'zgartirmasin.
  const projects = allRows(fin, "projects").map(p => ({ ...p,
    advance: Math.max(num(p.advance) - sum(payments.filter(payment => payment.projectId === p.id && day(payment.date) > to)), 0)
  }));
  const expenses = allRows(fin, "expenses");
  const projectName = p => `<b>${h(p.name || "-")}</b>${p.client ? ` — ${h(p.client)}` : ""}`;

  // --- Loyihalar ---
  const done = p => p.status === "Yakunlangan" && !!day(p.completedAt) && day(p.completedAt) <= to;
  const weekProjects = projects.filter(p => inRange(p.startDate) || inRange(p.completedAt) || inRange(p.dueDate)
    || payments.some(payment => payment.projectId === p.id && inRange(payment.date)));
  const completed = weekProjects.filter(p => done(p) && inRange(p.completedAt));
  const waiting = weekProjects.filter(p => !done(p));
  const newProjects = projects.filter(p => inRange(p.startDate));
  const open = weekProjects.filter(p => !done(p));
  const overdue = open.filter(p => day(p.dueDate) && day(p.dueDate) < to).sort((a, b) => day(a.dueDate).localeCompare(day(b.dueDate)));
  const dueSoon = open.filter(p => inRange(p.dueDate)).sort((a, b) => day(a.dueDate).localeCompare(day(b.dueDate)));
  const lateDone = completed.filter(p => day(p.dueDate) && day(p.completedAt) > day(p.dueDate));

  const projectSection = [
    "📁 <b>LOYIHALAR</b>",
    `• Hafta davomidagi umumiy loyihalar: <b>${weekProjects.length} ta</b> (${money(sum(weekProjects))})`,
    `• Bajarildi (yakunlandi): <b>${completed.length} ta</b> (${money(sum(completed))})`,
    `• Bajarilmadi / kutilmoqda: <b>${waiting.length} ta</b> (${money(sum(waiting))})`,
    `• Yangi qabul qilingan zakazlar: <b>${newProjects.length} ta</b> (${money(sum(newProjects))})`,
    `• Muddati o'tgan (hafta oxirida): <b>${overdue.length} ta</b>`
  ];
  if (completed.length) projectSection.push("", "✅ <b>Bajarilgan ishlar:</b>", ...listLines(completed, p => {
    const timing = completionTiming(p);
    return `${projectName(p)} · ${money(p.amount)}${timing ? ` · ${timing}` : ""}`;
  }));
  if (waiting.length) projectSection.push("", "⏳ <b>Bajarilmagan ishlar:</b>", ...listLines(waiting, p => {
    const due = day(p.dueDate);
    const state = !due ? "muddat yo'q" : due < to ? `❗ ${dayDiff(due, to)} kun kechikdi` : `muddat ${fmtDay(due)}`;
    return `${projectName(p)} · ${h(p.status || "Yangi")} · ${state}`;
  }));

  // --- Pul ---
  const weekPayments = payments.filter(p => inRange(p.date));
  const prevPayments = payments.filter(p => inRange(p.date, prevFrom, prevTo));
  const income = sum(weekPayments);
  const prevIncome = sum(prevPayments);
  const byPayType = {};
  weekPayments.forEach(p => { const k = p.paymentType || "Boshqa"; byPayType[k] = (byPayType[k] || 0) + num(p.amount); });
  const paidProjectIds = new Set(weekPayments.map(p => p.projectId));
  const paidOff = projects.filter(p => paidProjectIds.has(p.id) && num(p.amount) > 0 && debtOf(p) === 0);
  const partlyPaid = projects.filter(p => paidProjectIds.has(p.id) && debtOf(p) > 0);

  const weekExpenses = expenses.filter(e => inRange(e.date));
  const prevExpenses = expenses.filter(e => inRange(e.date, prevFrom, prevTo));
  const realOf = rows => rows.filter(e => !ADVANCE_TYPES.includes(e.type));
  const salaryOf = rows => rows.filter(e => e.type === "oylik_avans" || e.type === "oylik_tolov");
  const real = realOf(weekExpenses);
  const realTotal = sum(real);
  const salaryTotal = sum(salaryOf(weekExpenses));
  const founderRows = weekExpenses.filter(e => e.type === "founder_avans");
  const founderTotal = sum(founderRows);
  const spent = realTotal + salaryTotal;
  const prevSpent = sum(realOf(prevExpenses)) + sum(salaryOf(prevExpenses));
  const net = income - spent;
  const byType = {};
  real.forEach(e => { const k = EXPENSE_LABELS[e.type] || e.type || "Boshqa"; byType[k] = (byType[k] || 0) + num(e.amount); });
  const typeRows = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  const moneySection = [
    "💰 <b>PUL HARAKATI</b>",
    `• Tushum (mijozlardan): <b>${money(income)}</b> — ${weekPayments.length} ta to'lov${changeText(income, prevIncome)}`,
    ...Object.entries(byPayType).map(([k, v]) => `   ◦ ${h(k)}: ${money(v)}`),
    `• Xarajatlar: <b>${money(realTotal)}</b>`,
    ...typeRows.slice(0, 8).map(([k, v]) => `   ◦ ${h(k)}: ${money(v)}`),
    `• Ishchilar oyligi va avansi: <b>${money(salaryTotal)}</b>`,
    `• Jami chiqim: <b>${money(spent)}</b>${changeText(spent, prevSpent)}`,
    `• ${net >= 0 ? "📈 Sof daromad" : "📉 Zarar"} (tushum − chiqim): <b>${money(net)}</b>`,
    `• Ta'sischilarga avans: <b>${money(founderTotal)}</b>`,
    `• Kassada qolgan (avanslardan keyin): <b>${money(net - founderTotal)}</b>`
  ];
  if (founderRows.length) {
    const byFounder = {};
    founderRows.forEach(e => {
      const name = fin.founders.find(f => f.id === e.founderId)?.name || e.founderName || "-";
      byFounder[name] = (byFounder[name] || 0) + num(e.amount);
    });
    moneySection.splice(moneySection.length - 1, 0, ...Object.entries(byFounder).map(([k, v]) => `   ◦ ${h(k)}: ${money(v)}`));
  }
  if (paidOff.length) moneySection.push("", "💵 <b>To'liq to'langan zakazlar:</b>", ...listLines(paidOff, p => `${projectName(p)} · ${money(p.amount)}`));
  if (partlyPaid.length) moneySection.push("", "🔸 <b>Qisman to'langan (qarzi qolgan):</b>", ...listLines(partlyPaid, p => `${projectName(p)} · qoldiq ${money(debtOf(p))}`));

  // --- Haftaga tegishli zakazlarning hafta oxiridagi qarzi ---
  const debtors = weekProjects.filter(p => debtOf(p) > 0).sort((a, b) => debtOf(b) - debtOf(a));
  const receivable = sum(debtors, debtOf);
  const debtSection = [
    "🧾 <b>HAFTAGA TEGISHLI ZAKAZLAR QARZI (hafta oxirida)</b>",
    `• Mijozlardan olinadigan qarz: <b>${money(receivable)}</b> (${debtors.length} ta zakaz)`,
    ...listLines(debtors, p => `${projectName(p)} · ${money(debtOf(p))}`, 5),
  ];

  // --- Tavsiyalar ---
  const advice = [];
  if (overdue.length) advice.push(`❗ ${overdue.length} ta zakaz muddati o'tgan (${overdue.slice(0, 5).map(p => h(p.name)).join(", ")}). Mijozlar bilan yangi muddatni kelishing va bu ishlarni birinchi navbatga qo'ying.`);
  if (dueSoon.length) advice.push(`📅 Shu haftada ${dueSoon.length} ta zakaz topshiriladi (${dueSoon.slice(0, 5).map(p => `${h(p.name)} — ${fmtDay(p.dueDate)}`).join(", ")}). Material, dizayn va montajni oldindan rejalang.`);
  const doneUnpaid = debtors.filter(done);
  if (doneUnpaid.length) advice.push(`💰 ${doneUnpaid.length} ta zakaz topshirilgan, lekin to'lanmagan: jami ${money(sum(doneUnpaid, debtOf))}. Shu qarzlarni birinchi undiring.`);
  const noAdvance = open.filter(p => num(p.amount) > 0 && num(p.advance) === 0);
  if (noAdvance.length) advice.push(`⚠️ ${noAdvance.length} ta zakaz avanssiz ishlanmoqda (${noAdvance.slice(0, 5).map(p => h(p.name)).join(", ")}). Ishni davom ettirishdan oldin avans oling.`);
  if (net < 0) advice.push(`📉 Bu hafta chiqim tushumdan ${money(-net)} ga ko'p. Shoshilinch bo'lmagan xarajatlarni keyinga qoldiring va qarzlarni tezroq yig'ing.`);
  if (founderTotal > 0 && founderTotal > Math.max(net, 0)) advice.push(`🏦 Ta'sischilarga berilgan avans (${money(founderTotal)}) haftalik sof daromaddan ko'p. Avanslarni daromadga moslang.`);
  if (prevSpent > 0 && spent > prevSpent * 1.3) advice.push(`📊 Chiqim o'tgan haftadan ${percent(spent - prevSpent, prevSpent)}% ko'p. Sababini tekshiring.`);
  if (prevIncome > 0 && income < prevIncome * 0.7) advice.push(`📊 Tushum o'tgan haftadan ${percent(prevIncome - income, prevIncome)}% kam. Qarzdor mijozlarga qo'ng'iroq qiling.`);
  if (typeRows.length && realTotal > 0 && typeRows[0][1] / realTotal >= 0.4 && typeRows.length > 1) advice.push(`🔎 Eng katta xarajat — ${h(typeRows[0][0])}: ${money(typeRows[0][1])} (${percent(typeRows[0][1], realTotal)}%). Yetkazib beruvchi narxlarini solishtiring.`);
  if (lateDone.length) advice.push(`⏱ ${lateDone.length} ta zakaz kechikib topshirildi. Yangi zakazlarga muddatni real belgilang.`);
  if (!newProjects.length) advice.push("📣 Bu hafta yangi zakaz bo'lmadi. Eski mijozlar bilan bog'laning va reklamani kuchaytiring.");
  if (!advice.length) advice.push("✅ Hammasi joyida: kechikkan zakaz yo'q, pul oqimi ijobiy. Shu tempni saqlang.");
  const adviceSection = ["💡 <b>TAVSIYALAR — NIMA QILISH KERAK</b>", ...advice.map((a, i) => `${i + 1}. ${a}`)];

  const header = `📊 <b>Haftalik hisobot</b>\n📅 ${fmtDay(from)} – ${fmtDay(to)}`;
  const messages = [];
  let current = header;
  for (const section of [projectSection, moneySection, debtSection, adviceSection].map(s => s.join("\n"))) {
    if (`${current}\n\n${section}`.length > 3900) { messages.push(current); current = section.slice(0, 3900); }
    else current = `${current}\n\n${section}`;
  }
  messages.push(current);
  return messages;
}

function webhookSecret() {
  const configured = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (configured) return configured;
  // Muhitda berilmasa, bot tokenidan barqaror maxfiy qiymat olinadi: barcha server nusxalarida bir xil.
  const token = String(process.env.TELEGRAM_BOT_TOKEN || "");
  return token ? crypto.createHash("sha256").update(`planet-print-webhook:${token}`).digest("hex").slice(0, 48) : "";
}

function publicBase(req) {
  const configured = String(process.env.APP_PUBLIC_URL || "").trim();
  if (configured) return new URL(configured);
  // Vercel production domenini o'zi beradi: preview manzilga webhook ulanib qolmaydi.
  const production = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
  if (production) return new URL(/^https?:\/\//.test(production) ? production : `https://${production}`);
  if (!req) throw new Error("Sayt manzili noma'lum");
  const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return new URL(`https://${host}`);
}

const BOT_COMMANDS = [
  { command: "start", description: "Botga ulanish" },
  { command: "chatid", description: "Chat ID olish" },
  { command: "qollanma", description: "Qo'llanma" },
  { command: "hisobot", description: "Haftalik hisobot (buxgalter, superadmin)" },
  { command: "guruh", description: "Guruhni ulash (guruhda yozing)" }
];

const PRIVATE_KEYBOARD = { keyboard: [[{ text: "🆔 Chat ID olish" }, { text: "📖 Qo'llanma" }]], resize_keyboard: true, is_persistent: true };
const CONTACT_KEYBOARD = {
  keyboard: [[{ text: "📱 Telefon raqamni yuborish", request_contact: true }], [{ text: "🆔 Chat ID olish" }, { text: "📖 Qo'llanma" }]],
  resize_keyboard: true, is_persistent: true
};

function createTelegramStaff({ app, authRequired, superAdminRequired, telegramApi, getFirestore, memoryStore, normalizeFinance }) {
  const memoryBindings = new Map();
  let guideFileIds = null;
  let botUsername = "";

  async function accounts() {
    const db = getFirestore();
    const stored = db ? (await db.collection("users").get()).docs.map(doc => ({ ...doc.data(), id: doc.id })) : [];
    return [...stored, ...memoryStore.users.filter(user => !stored.some(item => item.id === user.id))];
  }
  async function finance() {
    const db = getFirestore();
    if (!db) return normalizeFinance(memoryStore.finance);
    const doc = await db.collection("settings").doc("finance").get();
    let data = doc.exists ? doc.data().data ?? doc.data() : {};
    if (typeof data === "string") data = JSON.parse(data);
    return normalizeFinance(data);
  }
  async function bindings() {
    const db = getFirestore();
    return db ? (await db.collection("telegramStaff").get()).docs.map(doc => ({ ...doc.data(), docId: doc.id })) : [...memoryBindings.entries()].map(([docId, b]) => ({ ...b, docId }));
  }
  async function config() {
    const db = getFirestore();
    let stored = memoryStore.telegramConfig || {};
    if (db) {
      const doc = await db.collection("settings").doc("telegram").get();
      stored = doc.exists ? doc.data() : {};
    }
    return {
      mediaChatId: String(stored.mediaChatId || process.env.TELEGRAM_MEDIA_CHAT_ID || "").trim(),
      groupChatId: String(stored.groupChatId || process.env.TELEGRAM_GROUP_CHAT_ID || process.env.TELEGRAM_INSTALLERS_CHAT_ID || "").trim(),
      groupTitle: String(stored.groupTitle || "")
    };
  }
  async function saveConfig(changes) {
    const db = getFirestore();
    if (db) await db.collection("settings").doc("telegram").set(changes, { merge: true });
    else memoryStore.telegramConfig = { ...(memoryStore.telegramConfig || {}), ...changes };
  }

  // Ishchilar va ta'sischilar (moliya ro'yxatidagi) ham telefon orqali botga ulanadi: shaxsiy avans xabari uchun.
  function staffPeople(fin) {
    return [
      ...fin.workers.map(w => ({ id: w.id, name: w.name, phone: normalizePhone(w.phone), title: w.role || "Ishchi", kind: "worker" })),
      ...fin.founders.map(f => ({ id: f.id, name: f.name, phone: normalizePhone(f.phone), title: "Ta'sischi", kind: "founder" }))
    ].filter(person => person.phone);
  }
  // Faqat amaldagi bog'lanishlar: foydalanuvchi telefoni o'zgarsa yoki ishchi o'chirilsa, eski chat xabar olmaydi.
  function liveBindings(users, fin, links) {
    const staffPhones = new Set(staffPeople(fin).map(person => person.phone));
    return links.filter(b => String(b.accountId || "").startsWith("phone-")
      ? staffPhones.has(b.phone)
      : users.some(u => u.id === b.accountId && normalizePhone(u.phone) === b.phone));
  }
  async function context(fin) {
    const [users, links, cfg, current] = await Promise.all([accounts(), bindings(), config(), fin ? Promise.resolve(fin) : finance()]);
    return { users, cfg, fin: current, live: liveBindings(users, current, links) };
  }

  async function bind(docId, record) {
    const db = getFirestore();
    if (db) {
      await db.runTransaction(async transaction => {
        const ref = db.collection("telegramStaff").doc(docId);
        const existing = await transaction.get(ref);
        if (existing.exists && existing.data().userId !== record.userId) throw new Error("Bu raqam boshqa Telegram hisobiga bog'langan. Superadmindan bog'lanishni uzishni so'rang.");
        transaction.set(ref, record);
      });
    } else {
      const old = memoryBindings.get(docId);
      if (old && old.userId !== record.userId) throw new Error("Bu raqam boshqa Telegram hisobiga bog'langan.");
      memoryBindings.set(docId, record);
    }
  }

  async function sendText(chat_id, text, reply_markup) {
    return telegramApi("sendMessage", { chat_id, text: text.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true, ...(reply_markup ? { reply_markup } : {}) });
  }
  async function sendTo(chats, text, photo, pin = false) {
    const list = [...chats];
    const results = await Promise.allSettled(list.map(async chat_id => {
      const sent = photo
        ? await telegramApi("sendPhoto", { chat_id, photo, caption: text.slice(0, 1024), parse_mode: "HTML" })
        : await sendText(chat_id, text);
      // Vazifa chat tepasida qadalib turadi, ishchi esidan chiqarmaydi. Guruhda bot admin bo'lmasa, jim o'tkazib yuboriladi.
      if (pin && sent?.message_id) {
        await telegramApi("pinChatMessage", { chat_id, message_id: sent.message_id, disable_notification: true }).catch(() => {});
      }
      return sent;
    }));
    results.filter(r => r.status === "rejected").forEach(r => console.error("Telegram send failed:", r.reason?.message));
    return { sent: results.filter(r => r.status === "fulfilled").length, failed: results.filter(r => r.status === "rejected").length };
  }

  function roleChats(ctx, category) {
    const chats = new Set();
    ctx.users.filter(u => canReceive(u, category) && normalizePhone(u.phone))
      .forEach(u => ctx.live.filter(b => b.accountId === u.id).forEach(b => chats.add(b.chatId)));
    return chats;
  }
  function phoneChats(ctx, phones) {
    const wanted = new Set(phones.map(normalizePhone).filter(Boolean));
    return new Set(ctx.live.filter(b => wanted.has(b.phone)).map(b => b.chatId));
  }

  // category: lavozim/ruxsat bo'yicha; personalPhones: shaxsiy xabar; toGroup: umumiy guruh.
  async function deliver(category, text, fin, photo, { personalPhones = [], personalText, toGroup = false, pin = false } = {}) {
    const ctx = await context(fin);
    const roleSet = category ? roleChats(ctx, category) : new Set();
    // Ishchi o'zi ham buxgalter bo'lsa, bitta xabar yetadi.
    const personal = [...phoneChats(ctx, personalPhones)].filter(chat => !roleSet.has(chat));
    const groupChat = toGroup && ctx.cfg.groupChatId && !roleSet.has(ctx.cfg.groupChatId) ? ctx.cfg.groupChatId : "";
    const main = await sendTo(new Set([...roleSet, ...(personalText ? [] : personal), ...(groupChat ? [groupChat] : [])]), text, photo, pin);
    const own = personalText && personal.length ? await sendTo(new Set(personal), personalText, photo, pin) : { sent: 0, failed: 0 };
    return { sent: main.sent + own.sent, failed: main.failed + own.failed, group: !!groupChat };
  }

  // ---------- Qo'llanma ----------
  function guideFiles() {
    try { return fs.readdirSync(GUIDE_DIR).filter(name => /\.png$/i.test(name)).sort().map(name => path.join(GUIDE_DIR, name)); }
    catch { return []; }
  }
  function guideText(person) {
    const lines = ["📖 <b>Planet Print bot — qo'llanma</b>", ""];
    lines.push("<b>1. Botga ulanish</b>",
      "• /start bosing.",
      "• <b>📱 Telefon raqamni yuborish</b> tugmasini bosing. Raqam dasturda (Foydalanuvchilar, Ishchilar yoki Ta'sischilar kartasida) yozilgani bilan bir xil bo'lishi kerak.",
      "• <b>🆔 Chat ID olish</b> — chat ID raqamingizni ko'rsatadi.", "");
    lines.push("<b>2. Sizga qanday xabar keladi</b>");
    if (person?.account) {
      const categories = receivedCategories(person.account);
      lines.push(`Lavozimingiz: <b>${h(ROLE_NAMES[person.account.role] || person.account.role)}</b>`);
      lines.push(categories.length ? categories.map(c => `• ${CATEGORY_LABELS[c]}`).join("\n") : "• Bo'lim ruxsati berilmagan — superadminga murojaat qiling.");
      lines.push("• Sizga berilgan avans va oylik haqida shaxsiy xabar");
    } else if (person?.staff) {
      lines.push(`Siz: <b>${h(person.staff.name)}</b> (${h(person.staff.title)})`, "• Sizga berilgan avans, oylik va ta'sischi avansi haqida shaxsiy xabar");
    } else {
      lines.push("• Superadmin — hammasi", "• Buxgalter — loyihalar, to'lovlar, xarajatlar, avanslar, har dushanba haftalik hisobot (/hisobot)",
        "• Dizayner — o'lchovlar (rasm bilan) va dizayn bo'limi", "• Montajnik — tasdiqlangan dizayn, o'lcham va vazifa",
        "• Ishchi / ta'sischi — o'ziga berilgan avans haqida shaxsiy xabar");
    }
    lines.push("", "<b>3. Guruh</b>",
      "• Botni ishchilar guruhiga qo'shing.",
      "• Guruhda /guruh yozing — guruh ulanadi (botga ulangan superadmin, admin, buxgalter yoki menejer).",
      "• Guruhga tasdiqlangan dizaynlar va yangi o'lchovlar keladi. To'lov va xarajatlar guruhga bormaydi. Guruh ID'sini /chatid bilan ko'rish mumkin.");
    return lines.join("\n");
  }
  async function sendGuide(chatId, person) {
    const files = guideFiles();
    if (files.length) {
      try {
        const form = new FormData();
        form.set("chat_id", String(chatId));
        const reuse = guideFileIds && guideFileIds.length === files.length;
        form.set("media", JSON.stringify(files.slice(0, 10).map((_, i) => ({
          type: "photo",
          media: reuse ? guideFileIds[i] : `attach://guide${i}`,
          ...(i === 0 ? { caption: "📖 Planet Print — botdan foydalanish qo'llanmasi", parse_mode: "HTML" } : {})
        }))));
        if (!reuse) files.slice(0, 10).forEach((file, i) => form.set(`guide${i}`, new Blob([fs.readFileSync(file)], { type: "image/png" }), `qollanma-${i + 1}.png`));
        const sent = await telegramApi("sendMediaGroup", form, true);
        if (Array.isArray(sent)) guideFileIds = sent.map(m => m.photo?.at(-1)?.file_id).filter(Boolean);
      } catch (error) {
        guideFileIds = null;
        console.error("Guide images failed:", error.message);
      }
    }
    await sendText(chatId, guideText(person));
  }
  async function personForTelegramUser(userId, ctx) {
    const binding = ctx.live.find(b => b.userId === String(userId));
    if (!binding) return null;
    const account = ctx.users.find(u => u.id === binding.accountId);
    if (account) return { account, binding };
    const staff = staffPeople(ctx.fin).find(p => p.phone === binding.phone);
    return staff ? { staff, binding } : null;
  }

  // ---------- Webhook ----------
  app.post("/api/telegram/webhook", async (req, res) => {
    const expected = webhookSecret();
    const actual = String(req.get("X-Telegram-Bot-Api-Secret-Token") || "");
    if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
        !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return res.sendStatus(403);
    try {
      const member = req.body?.my_chat_member;
      if (member && ["group", "supergroup"].includes(member.chat?.type) && ["member", "administrator"].includes(member.new_chat_member?.status)) {
        await sendText(member.chat.id, "👋 Planet Print boti guruhga qo'shildi. Ulash uchun /start yozing.");
        return res.json({ ok: true });
      }
      const message = req.body?.message;
      if (!message || message.from?.is_bot) return res.json({ ok: true });
      const text = String(message.text || "");
      const chat = message.chat || {};
      const reply = (body, markup) => sendText(chat.id, body, markup);

      if (chat.type === "group" || chat.type === "supergroup") {
        if (/^\/(chatid|id)(@\w+)?(\s|$)/i.test(text) || /chat id olish/i.test(text)) {
          await reply(`🆔 Guruh Chat ID: <code>${h(chat.id)}</code>`);
        } else if (/^\/(start|guruh)(@\w+)?(\s|$)/i.test(text)) {
          // Guruhda shaxsiy ma'lumot (ism, lavozim, chat ID) chiqarilmaydi — faqat qisqa javob.
          const ctx = await context();
          const person = await personForTelegramUser(message.from?.id, ctx);
          if (!GROUP_ADMIN_ROLES.includes(person?.account?.role)) await reply("⛔ Guruhni ulash uchun avval botga shaxsiy chatda /start bosib, telefon raqamingizni yuboring.");
          else {
            await saveConfig({ groupChatId: String(chat.id), groupTitle: String(chat.title || "").slice(0, 120) });
            await reply("✅ Guruh ulandi");
          }
        }
        return res.json({ ok: true });
      }
      if (chat.type !== "private") return res.json({ ok: true });

      if (message.contact) {
        if (message.contact.user_id !== message.from.id) {
          await reply("Faqat o'zingizning telefon raqamingizni tugma orqali yuboring.");
          return res.json({ ok: true });
        }
        const phone = normalizePhone(message.contact.phone_number);
        const record = { phone, chatId: String(chat.id), userId: String(message.from.id) };
        const users = (await accounts()).filter(w => normalizePhone(w.phone) === phone);
        try {
          if (users.length > 1) {
            await reply("Raqamingiz bir nechta foydalanuvchida takrorlangan. Superadmin telefonlarni tekshirsin, keyin /start bosing.");
          } else if (users.length === 1) {
            const user = users[0];
            await bind(`account-${user.id}`, { ...record, accountId: user.id });
            const categories = receivedCategories(user);
            await reply(`✅ <b>${h(user.username)}, muvaffaqiyatli bog'landingiz!</b>\nLavozim: <b>${h(ROLE_NAMES[user.role] || user.role)}</b>\nChat ID: <code>${h(chat.id)}</code>\n\n${user.role === "worker"
              ? "Dizaynlar ruxsati berilganda faqat tasdiqlangan dizayn, o'lcham va montaj vazifasi keladi. Sizga berilgan avans haqida ham xabar keladi."
              : `Sizga keladigan xabarlar:\n${categories.map(c => `• ${CATEGORY_LABELS[c]}`).join("\n") || "• Bo'lim ruxsati berilmagan"}`}\n\n📖 Qo'llanma tugmasini bosing.`, PRIVATE_KEYBOARD);
          } else {
            const staff = staffPeople(await finance()).filter(person => person.phone === phone);
            if (!staff.length) {
              await reply("Raqamingiz dasturda topilmadi. Superadmin sizning telefoningizni Foydalanuvchilar, Ishchilar yoki Ta'sischilar kartasiga kiritsin, keyin /start bosing.", CONTACT_KEYBOARD);
            } else {
              await bind(`phone-${phone}`, { ...record, accountId: `phone-${phone}` });
              await reply(`✅ <b>${h(staff.map(p => p.name).join(", "))}, bog'landingiz!</b>\nSiz: ${h(staff.map(p => p.title).join(", "))}\nChat ID: <code>${h(chat.id)}</code>\n\nSizga berilgan avans va oyliklar haqida shaxsiy xabar keladi.\n📖 Qo'llanma tugmasini bosing.`, PRIVATE_KEYBOARD);
            }
          }
        } catch (error) {
          // Binding conflicts are actionable; storage errors should be retried by Telegram.
          if (!error.message.includes("bog'langan")) throw error;
          await reply(error.message);
        }
      } else if (/^\/(qollanma|help|yordam)(@\w+)?(\s|$)/i.test(text) || /qo.?llanma/i.test(text)) {
        const ctx = await context();
        await sendGuide(chat.id, await personForTelegramUser(message.from.id, ctx));
      } else if (/^\/(start|chatid|id)(@\w+)?(\s|$)/i.test(text) || /chat id olish/i.test(text)) {
        const ctx = await context();
        const person = await personForTelegramUser(message.from.id, ctx);
        const who = person?.account ? `${h(person.account.username)} (${h(ROLE_NAMES[person.account.role] || person.account.role)})` : person?.staff ? `${h(person.staff.name)} (${h(person.staff.title)})` : "";
        await reply(`👋 <b>Planet Print boti</b>\n🆔 Sizning Chat ID: <code>${h(chat.id)}</code>\n${person ? `✅ Hisobingiz bog'langan: ${who}.` : "Dasturdagi hisobingizga bog'lanish uchun pastdagi <b>📱 Telefon raqamni yuborish</b> tugmasini bosing."}`,
          person ? PRIVATE_KEYBOARD : CONTACT_KEYBOARD);
      } else if (/^\/hisobot(@\w+)?(\s|$)/i.test(text)) {
        // Pul ma'lumoti: faqat buxgalter va superadminga, faqat shaxsiy chatda.
        const ctx = await context();
        const person = await personForTelegramUser(message.from.id, ctx);
        if (!person?.account || !canReceive(person.account, "weekly_report")) {
          await reply("⛔ Hisobot faqat buxgalter va superadmin uchun.", person ? PRIVATE_KEYBOARD : CONTACT_KEYBOARD);
        } else {
          const previous = /o.?tgan|oldingi/i.test(text);
          await sendWeeklyReport({ chatId: chat.id, current: !previous });
          if (!previous) await reply("ℹ️ Bu joriy hafta (dushanbadan bugungacha). O'tgan to'liq hafta uchun: <code>/hisobot otgan</code>");
        }
      } else if (/^\/guruh(@\w+)?(\s|$)/i.test(text)) {
        await reply("ℹ️ /guruh buyrug'i shaxsiy chatda emas, <b>guruhning o'zida</b> yoziladi:\n1. Botni ishchilar guruhiga qo'shing.\n2. Shu guruhda /guruh deb yozing.\n\nBuni botga telefoni ulangan superadmin, admin, buxgalter yoki menejer qila oladi.");
      } else if (/^\+?[\d\s()-]{9,16}$/.test(text.trim())) {
        await reply("📱 Raqamni yozib emas, pastdagi <b>📱 Telefon raqamni yuborish</b> tugmasi orqali yuboring — shunda raqam haqiqatan sizniki ekani tasdiqlanadi.", CONTACT_KEYBOARD);
      } else {
        const ctx = await context();
        const person = await personForTelegramUser(message.from.id, ctx);
        await reply(person
          ? "Men faqat bildirishnoma yuboraman. Buyruqlar: /start, /qollanma, /chatid. Guruhni ulash uchun guruhda /guruh yozing."
          : "Botdan foydalanish uchun pastdagi <b>📱 Telefon raqamni yuborish</b> tugmasini bosing.", person ? PRIVATE_KEYBOARD : CONTACT_KEYBOARD);
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("Telegram registration failed:", error.message);
      res.status(503).json({ error: "Telegram ulanishida xato." });
    }
  });

  // ---------- Superadmin boshqaruvi ----------
  app.get("/api/telegram/staff", authRequired, superAdminRequired, async (_req, res) => {
    try {
      const ctx = await context();
      const accountRows = ctx.users.map(user => {
        const connection = ctx.live.find(b => b.accountId === user.id);
        return { id: user.id, name: user.username, role: user.role, roleName: ROLE_NAMES[user.role] || user.role, phone: user.phone || "", chatId: connection?.chatId || "" };
      });
      const accountPhones = new Set(ctx.users.map(u => normalizePhone(u.phone)).filter(Boolean));
      const staffRows = [];
      staffPeople(ctx.fin).filter(p => !accountPhones.has(p.phone)).forEach(person => {
        const existing = staffRows.find(row => row.phone === person.phone);
        if (existing) { existing.name += `, ${person.name}`; return; }
        const connection = ctx.live.find(b => b.accountId === `phone-${person.phone}`);
        staffRows.push({ id: `phone-${person.phone}`, name: person.name, role: person.kind, roleName: person.title, phone: person.phone, chatId: connection?.chatId || "" });
      });
      res.json({ workers: [...accountRows, ...staffRows] });
    } catch (error) { res.status(503).json({ error: "Telegram bog'lanishlarini olishda xato." }); }
  });
  app.delete("/api/telegram/staff/:id", authRequired, superAdminRequired, async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const docId = id.startsWith("phone-") ? id : `account-${id}`;
      const db = getFirestore();
      if (db) await db.collection("telegramStaff").doc(docId).delete();
      else memoryBindings.delete(docId);
      res.json({ ok: true });
    } catch (error) { res.status(503).json({ error: "Bog'lanishni uzishda xato." }); }
  });
  app.post("/api/telegram/setup-webhook", authRequired, superAdminRequired, async (req, res) => {
    try {
      const base = publicBase(req);
      const secret = webhookSecret();
      if (base.protocol !== "https:" || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(base.hostname)) throw new Error("Bot faqat ochiq HTTPS manzilda ishlaydi. Saytni hostingdan (masalan Vercel) oching yoki APP_PUBLIC_URL kiriting.");
      if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) throw new Error("TELEGRAM_WEBHOOK_SECRET faqat harf, raqam, _ va - dan iborat bo'lsin (yoki uni o'chirib qo'ying — avtomatik yaratiladi).");
      const url = await installWebhook(base);
      res.json({ ok: true, url });
    } catch (error) { res.status(400).json({ error: error.message }); }
  });

  async function installWebhook(base) {
    const url = new URL("/api/telegram/webhook", base).href;
    await telegramApi("setWebhook", { url, secret_token: webhookSecret(), allowed_updates: ["message", "my_chat_member"], drop_pending_updates: false });
    await telegramApi("setMyCommands", { commands: BOT_COMMANDS }).catch(() => {});
    return url;
  }

  // Har bir server ishga tushganda webhook to'g'ri manzilda ekanini tekshiradi va kerak bo'lsa tiklaydi.
  // Shu sababli bot "Botni ulash" tugmasi bosilmasa ham ishlaydi va webhook o'chib qolsa o'zi tuzaladi.
  let webhookCheck = null;
  function ensureWebhook(req) {
    if (webhookCheck || !process.env.TELEGRAM_BOT_TOKEN) return webhookCheck;
    let base;
    try { base = publicBase(req); } catch { return null; }
    if (base.protocol !== "https:" || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(base.hostname)) return null;
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret())) return null;
    webhookCheck = (async () => {
      const expected = new URL("/api/telegram/webhook", base).href;
      const info = await telegramApi("getWebhookInfo", {});
      if (info.url !== expected) {
        await installWebhook(base);
        console.log("Telegram webhook o'rnatildi:", expected);
      } else {
        // Yangi buyruqlar (masalan /hisobot) bot menyusida ko'rinsin.
        await telegramApi("setMyCommands", { commands: BOT_COMMANDS }).catch(() => {});
      }
    })().catch(error => {
      console.error("Telegram webhook tekshiruvi:", error.message);
      webhookCheck = null;
    });
    return webhookCheck;
  }
  app.get("/api/telegram/status", authRequired, superAdminRequired, async (req, res) => {
    const cfg = await config().catch(() => ({ mediaChatId: "", groupChatId: "", groupTitle: "" }));
    const result = { token: !!process.env.TELEGRAM_BOT_TOKEN, ...cfg, guideImages: guideFiles().length };
    try { result.expectedUrl = new URL("/api/telegram/webhook", publicBase(req)).href; } catch { result.expectedUrl = ""; }
    if (!result.token) return res.json({ ...result, problem: "TELEGRAM_BOT_TOKEN hosting muhitida (Vercel → Settings → Environment Variables) kiritilmagan." });
    try {
      const [me, info] = await Promise.all([telegramApi("getMe", {}), telegramApi("getWebhookInfo", {})]);
      botUsername = me.username || botUsername;
      Object.assign(result, {
        bot: me.username || "", webhookUrl: info.url || "", pending: info.pending_update_count || 0,
        lastError: info.last_error_message || "", lastErrorAt: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : ""
      });
      if (!info.url) result.problem = "Webhook o'rnatilmagan: bot xabarlarni serverga yubormayapti. «Botni ulash» tugmasini bosing.";
      else if (result.expectedUrl && info.url !== result.expectedUrl) result.problem = `Webhook boshqa manzilga ulangan (${info.url}). Shu bot tokeni boshqa dasturda ishlatilgan. «Botni ulash» tugmasini bosing.`;
      else if (info.last_error_message && info.last_error_date && Date.now() / 1000 - info.last_error_date < 3600) result.problem = `Oxirgi xato: ${info.last_error_message}. «Botni ulash» tugmasini qayta bosing.`;
      res.json(result);
    } catch (error) { res.json({ ...result, problem: `Telegram bilan aloqa yo'q: ${error.message}` }); }
  });
  app.put("/api/telegram/config", authRequired, superAdminRequired, async (req, res) => {
    const mediaChatId = String(req.body?.mediaChatId ?? "").trim();
    const groupChatId = String(req.body?.groupChatId ?? "").trim();
    if ([mediaChatId, groupChatId].some(id => id && !CHAT_ID.test(id))) return res.status(400).json({ error: "Chat ID faqat raqam bo'lsin (guruhda minus bilan, masalan -1001234567890)." });
    try {
      await saveConfig({ mediaChatId, groupChatId, ...(groupChatId ? {} : { groupTitle: "" }) });
      res.json({ ok: true });
    } catch (error) { res.status(503).json({ error: "Telegram sozlamasini saqlab bo'lmadi." }); }
  });
  app.post("/api/telegram/test-group", authRequired, superAdminRequired, async (_req, res) => {
    try {
      const cfg = await config();
      if (!cfg.groupChatId) return res.status(400).json({ error: "Guruh Chat ID kiritilmagan." });
      await sendText(cfg.groupChatId, "✅ <b>Planet Print</b>: guruh ulanishi tekshirildi. Bu guruhga tasdiqlangan dizaynlar va o'lchovlar keladi.");
      res.json({ ok: true });
    } catch (error) { res.status(502).json({ error: `Guruhga yuborilmadi: ${error.message}. Bot guruhga qo'shilganini tekshiring.` }); }
  });
  app.post("/api/telegram/send-guide", authRequired, superAdminRequired, async (_req, res) => {
    try {
      const ctx = await context();
      const chats = new Map();
      ctx.live.forEach(b => { if (!chats.has(b.chatId)) chats.set(b.chatId, b); });
      let sent = 0, failed = 0;
      for (const binding of chats.values()) {
        try { await sendGuide(binding.chatId, await personForTelegramUser(binding.userId, ctx)); sent++; }
        catch (error) { failed++; console.error("Guide delivery failed:", error.message); }
      }
      res.json({ ok: true, sent, failed });
    } catch (error) { res.status(502).json({ error: error.message || "Qo'llanma yuborilmadi." }); }
  });

  // Rasm Telegramda saqlanadi: media chat → yuklovchining o'z chati → superadmin chati.
  async function storageChat(accountId) {
    const ctx = await context();
    if (ctx.cfg.mediaChatId) return ctx.cfg.mediaChatId;
    const own = ctx.live.find(b => b.accountId === accountId);
    if (own) return own.chatId;
    const superIds = new Set(ctx.users.filter(u => u.role === "super_admin").map(u => u.id));
    const admin = ctx.live.find(b => superIds.has(b.accountId));
    if (admin) return admin.chatId;
    throw new Error("Rasmni saqlash uchun Telegram chat topilmadi. Botda /start bosib telefoningizni yuboring yoki Sozlamalar → Telegram bo'limida «Media chat ID» kiriting.");
  }

  // ---------- Moliya o'zgarishlari bo'yicha xabarlar ----------
  function workerTotals(fin, workerId) {
    const rows = fin.expenses.filter(e => e.workerId === workerId);
    const advance = rows.filter(e => e.type === "oylik_avans").reduce((a, e) => a + num(e.amount), 0);
    const paid = rows.filter(e => e.type === "oylik_tolov").reduce((a, e) => a + num(e.amount), 0);
    return { advance, paid };
  }
  function expenseProjects(expense) {
    const allocations = Array.isArray(expense.allocations) ? expense.allocations : [];
    return allocations.map(a => a.projectName).filter(Boolean).join(", ");
  }
  function projectCard(project, title) {
    const debt = Math.max(num(project.amount) - num(project.advance), 0);
    return [
      title,
      `📌 Loyiha: <b>${h(project.name)}</b>`,
      `👤 Mijoz: ${h(project.client || "-")}`,
      `💰 Baholandi: <b>${money(project.amount)}</b>`,
      `💵 Olingan avans: ${money(project.advance)}`,
      `⏳ Qoldiq: ${money(debt)}`,
      project.startDate || project.dueDate ? `📅 Muddat: ${h(project.startDate || "-")} → ${h(project.dueDate || "-")}` : ""
    ].filter(Boolean).join("\n");
  }
  const by = actor => actor ? `\n✍️ Kiritdi: ${h(actor)}` : "";

  async function notifyChanges(previous, next, actor = "") {
    if (!process.env.TELEGRAM_BOT_TOKEN) return [];
    const warnings = [];
    const jobs = [];
    const diff = key => {
      const before = new Map(previous[key].map(row => [row.id, row]));
      const after = new Map(next[key].map(row => [row.id, row]));
      return {
        added: next[key].filter(row => !before.has(row.id)),
        changed: next[key].filter(row => before.has(row.id) && JSON.stringify(before.get(row.id)) !== JSON.stringify(row)).map(row => ({ row, old: before.get(row.id) })),
        removed: previous[key].filter(row => !after.has(row.id))
      };
    };

    const projects = diff("projects");
    const newProjectIds = new Set(projects.added.map(p => p.id));
    projects.added.forEach(p => jobs.push(["Loyiha", () => deliver("projects", projectCard(p, "🆕 <b>Yangi loyiha qo'shildi</b>") + by(actor), next)]));
    projects.changed.forEach(({ row, old }) => {
      if (row.status === "Yakunlangan" && old.status !== "Yakunlangan") {
        const timing = completionTiming(row);
        jobs.push(["Loyiha", () => deliver("projects", `${projectCard(row, "✅ <b>Loyiha yakunlandi</b>")}\n🏁 Yakunlandi: ${h(row.completedAt || "-")}${timing ? ` (<b>${timing}</b>)` : ""}${by(actor)}`, next)]);
        return;
      }
      const fields = { name: "nomi", client: "mijoz", amount: "summa", dueDate: "muddat", status: "holat" };
      const changes = Object.entries(fields).filter(([f]) => String(row[f] ?? "") !== String(old[f] ?? ""))
        .map(([f, label]) => `• ${label}: ${f === "amount" ? money(old[f]) : h(old[f] || "-")} → <b>${f === "amount" ? money(row[f]) : h(row[f] || "-")}</b>`);
      if (changes.length) jobs.push(["Loyiha", () => deliver("projects", `✏️ <b>Loyiha o'zgartirildi</b>: ${h(row.name)}\n${changes.join("\n")}${by(actor)}`, next)]);
    });
    projects.removed.forEach(p => jobs.push(["Loyiha", () => deliver("projects", `🗑 <b>Loyiha o'chirildi</b>: ${h(p.name)} — ${h(p.client || "")}, ${money(p.amount)}${by(actor)}`, next)]));

    const payments = diff("payments");
    payments.added.filter(p => !newProjectIds.has(p.projectId)).forEach(p => {
      const project = next.projects.find(item => item.id === p.projectId);
      const debt = project ? Math.max(num(project.amount) - num(project.advance), 0) : 0;
      jobs.push(["To'lov", () => deliver("payments", `💰 <b>Mijoz to'lovi</b>\n📌 Loyiha: <b>${h(project?.name || p.projectName || "-")}</b>\n💵 Summa: <b>${money(p.amount)}</b>${p.paymentType ? ` (${h(p.paymentType)})` : ""}\n⏳ Qolgan qarz: ${money(debt)}${p.note ? `\n📝 ${h(p.note)}` : ""}${by(actor)}`, next)]);
    });
    payments.changed.forEach(({ row }) => jobs.push(["To'lov", () => deliver("payments", `✏️ <b>To'lov o'zgartirildi</b>: ${h(row.projectName || "-")} — ${money(row.amount)}${row.note ? `\n📝 ${h(row.note)}` : ""}${by(actor)}`, next)]));
    payments.removed.forEach(p => jobs.push(["To'lov", () => deliver("payments", `🗑 <b>To'lov o'chirildi</b>: ${h(p.projectName || "-")} — ${money(p.amount)}${by(actor)}`, next)]));

    const expenses = diff("expenses");
    expenses.added.forEach(e => {
      const meta = `📅 ${h(e.date || "-")} · ${h(EXPENSE_PAYMENT_LABELS[e.paymentType] || e.paymentType || "-")}${expenseProjects(e) ? `\n📌 Zakaz: ${h(expenseProjects(e))}` : ""}${e.note ? `\n📝 ${h(e.note)}` : ""}`;
      if (e.type === "oylik_avans" || e.type === "oylik_tolov") {
        const worker = next.workers.find(w => w.id === e.workerId);
        const totals = workerTotals(next, e.workerId);
        const remain = num(worker?.salary) - totals.advance - totals.paid;
        const kind = e.type === "oylik_avans" ? "oylik avansi" : "oylik";
        const body = `👷 Ishchi: <b>${h(worker?.name || e.workerName || "-")}</b>${worker?.role ? ` (${h(worker.role)})` : ""}\n💰 Summa: <b>${money(e.amount)}</b>\n${meta}\n📊 Shu oy jami avans: ${money(totals.advance)} · oylik to'langan: ${money(totals.paid)}${worker ? `\n🧾 Oylik: ${money(worker.salary)} · qolgan: <b>${money(remain)}</b>` : ""}`;
        jobs.push(["Avans", () => deliver("advances", `💵 <b>Ishchiga ${kind} berildi</b>\n${body}${by(actor)}`, next, undefined,
          { personalPhones: worker?.phone ? [worker.phone] : [], personalText: `💵 <b>Sizga ${kind} berildi</b>\n${body}` })]);
        return;
      }
      if (e.type === "founder_avans") {
        const founder = next.founders.find(f => f.id === e.founderId);
        const total = next.expenses.filter(x => x.type === "founder_avans" && x.founderId === e.founderId).reduce((a, x) => a + num(x.amount), 0);
        const body = `👤 Ta'sischi: <b>${h(founder?.name || e.founderName || "-")}</b>${founder ? ` (${num(founder.share)}%)` : ""}\n💰 Summa: <b>${money(e.amount)}</b>\n${meta}\n📊 Shu oy jami olgan avansi: ${money(total)}`;
        jobs.push(["Avans", () => deliver("advances", `🏦 <b>Ta'sischi avansi berildi</b>\n${body}${by(actor)}`, next, undefined,
          { personalPhones: founder?.phone ? [founder.phone] : [], personalText: `🏦 <b>Sizga ta'sischi avansi berildi</b>\n${body}` })]);
        return;
      }
      jobs.push(["Xarajat", () => deliver("expenses", `🧾 <b>Xarajat</b>: ${h(EXPENSE_LABELS[e.type] || e.type)} — <b>${money(e.amount)}</b>\n${meta}${by(actor)}`, next)]);
    });
    expenses.changed.forEach(({ row }) => jobs.push(["Xarajat", () => deliver(ADVANCE_TYPES.includes(row.type) ? "advances" : "expenses",
      `✏️ <b>Xarajat o'zgartirildi</b>: ${h(EXPENSE_LABELS[row.type] || row.type)}${row.workerName || row.founderName ? ` — ${h(row.workerName || row.founderName)}` : ""}, ${money(row.amount)}${by(actor)}`, next)]));
    expenses.removed.forEach(e => jobs.push(["Xarajat", () => deliver(ADVANCE_TYPES.includes(e.type) ? "advances" : "expenses",
      `🗑 <b>Xarajat o'chirildi</b>: ${h(EXPENSE_LABELS[e.type] || e.type)}${e.workerName || e.founderName ? ` — ${h(e.workerName || e.founderName)}` : ""}, ${money(e.amount)}${by(actor)}`, next)]));

    // O'lchov: dizaynerga alohida va guruhga rasm bilan.
    diff("measurements").added.forEach(m => jobs.push(["O'lchov", () => deliver("measurements", [
      "📐 <b>Yangi o'lchov olindi</b>",
      `👤 Mijoz / obyekt: <b>${h(m.client || "-")}</b>`,
      m.projectName ? `📌 Zakaz: ${h(m.projectName)}` : "",
      `📍 Manzil: ${h(m.address || "-")}`,
      `👷 Xodim: ${h(m.workerName || "-")} · 📅 ${h(m.date || "-")}`,
      `📏 O'lchamlar: <b>${h(m.dimensions || "kiritilmagan")}</b>`,
      m.note ? `📝 ${h(m.note)}` : "",
      actor ? `✍️ Kiritdi: ${h(actor)}` : ""
    ].filter(Boolean).join("\n"), next, m.photoFileId || undefined, { toGroup: true })]));

    if (jobs.length > 25) {
      jobs.length = 0;
      jobs.push(["Yangilik", () => deliver("projects", `📋 Dasturda ${projects.added.length + payments.added.length + expenses.added.length} ta yangi yozuv kiritildi.${by(actor)}`, next)]);
    }
    for (const [label, job] of jobs) {
      try {
        const result = await job();
        if (result.failed) warnings.push(`${label}: ${result.failed} ta Telegram xabari yuborilmadi.`);
      } catch (error) {
        console.error("Staff notifications failed:", error.message);
        warnings.push("Ma'lumot saqlandi, lekin Telegram xabarlari yuborilmadi.");
        break;
      }
    }
    return [...new Set(warnings)];
  }
  // ---------- Muddati yaqin zakazlar: guruhga kuniga bir marta eslatma ----------
  // Summa yuborilmaydi: guruhga pul haqidagi ma'lumot bormasligi kerak.
  const DEADLINE_DAYS = 2;
  const REMINDER_HOUR = 9;
  const tashkentHour = (date = new Date()) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", hourCycle: "h23" }).format(date));
  const formatDay = iso => iso.split("-").reverse().join(".");

  function deadlineProjects(fin, today) {
    return fin.projects
      .filter(p => p.status !== "Yakunlangan" && /^\d{4}-\d{2}-\d{2}$/.test(String(p.dueDate || "")))
      .map(p => ({ project: p, daysLeft: dayDiff(today, p.dueDate) }))
      .filter(item => Number.isFinite(item.daysLeft) && item.daysLeft <= DEADLINE_DAYS)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }

  function deadlineText(fin, items, today) {
    const blocks = items.map(({ project, daysLeft }, index) => {
      const design = fin.designs.filter(d => d.projectId === project.id && d.approved).at(-1);
      const measurement = fin.measurements.filter(m => m.projectId === project.id).at(-1);
      const when = daysLeft < 0 ? `❗ <b>${-daysLeft} kun kechikdi</b>` : daysLeft === 0 ? "🔥 <b>bugun</b>" : daysLeft === 1 ? "⚠️ <b>ertaga</b>" : `${daysLeft} kun qoldi`;
      return [
        `${index + 1}. <b>${h(project.name)}</b>${project.client ? ` — ${h(project.client)}` : ""}`,
        `📅 Muddat: ${h(formatDay(project.dueDate))} (${when})`,
        project.status ? `⚙️ Holat: ${h(project.status)}` : "",
        design?.dimensions || measurement?.dimensions ? `📏 O'lcham: ${h(design?.dimensions || measurement.dimensions)}` : "",
        measurement?.address ? `📍 Manzil: ${h(measurement.address)}` : "",
        design?.note ? `📝 Izoh: ${h(design.note)}` : ""
      ].filter(Boolean).join("\n");
    });
    return [`⏰ <b>Muddati yaqin zakazlar</b> (${formatDay(today)})`, ...blocks];
  }

  // Bir kunda faqat bir marta yuboriladi: sana bazada band qilinadi (bir nechta server nusxasi bo'lsa ham).
  async function claimReminderDay(today) {
    const db = getFirestore();
    if (!db) {
      if (memoryStore.deadlineReminderDate === today) return false;
      memoryStore.deadlineReminderDate = today;
      return true;
    }
    const ref = db.collection("settings").doc("telegram");
    return db.runTransaction(async tx => {
      const doc = await tx.get(ref);
      if (doc.exists && doc.data().deadlineReminderDate === today) return false;
      tx.set(ref, { deadlineReminderDate: today }, { merge: true });
      return true;
    });
  }

  async function sendDeadlineReminders({ now = new Date(), force = false } = {}) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return { sent: 0, reason: "token" };
    if (!force && tashkentHour(now) < REMINDER_HOUR) return { sent: 0, reason: "early" };
    const today = tashkentDate(now);
    const [fin, cfg] = await Promise.all([finance(), config()]);
    if (!cfg.groupChatId) return { sent: 0, reason: "no-group" };
    const items = deadlineProjects(fin, today);
    if (!items.length) return { sent: 0, reason: "none" };
    if (!force && !(await claimReminderDay(today))) return { sent: 0, reason: "already" };
    // Telegram xabari 4000 belgidan oshmasin: zakazlar bo'yicha bo'lib yuboriladi.
    const [title, ...blocks] = deadlineText(fin, items, today);
    const messages = [];
    let current = title;
    for (const block of blocks) {
      if (`${current}\n\n${block}`.length > 3900) { messages.push(current); current = block; }
      else current = `${current}\n\n${block}`;
    }
    messages.push(current);
    try {
      for (const text of messages) await sendText(cfg.groupChatId, text);
    } catch (error) {
      // Yuborilmasa, kun bandligi bekor qilinadi: keyingi so'rovda qayta urinadi.
      const db = getFirestore();
      if (db) await db.collection("settings").doc("telegram").set({ deadlineReminderDate: "" }, { merge: true }).catch(() => {});
      else memoryStore.deadlineReminderDate = "";
      throw error;
    }
    return { sent: items.length };
  }

  // Kuniga bir marta (soat 9:00 dan keyin) birinchi so'rovda ishga tushadi; Vercel cron ham shu funksiyani chaqiradi.
  let reminderCheckedOn = "";
  function ensureDeadlineReminders() {
    const now = new Date();
    const today = tashkentDate(now);
    if (reminderCheckedOn === today || tashkentHour(now) < REMINDER_HOUR || !process.env.TELEGRAM_BOT_TOKEN) return null;
    reminderCheckedOn = today;
    return sendDeadlineReminders({ now }).catch(error => {
      reminderCheckedOn = "";
      console.error("Deadline reminders failed:", error.message);
    });
  }

  // ---------- Haftalik hisobot: buxgalter va superadminga ----------
  // Har dushanba soat 9:00 dan keyin o'tgan hafta (dushanba–yakshanba) uchun bir marta yuboriladi.
  function weekKey(now) {
    const today = tashkentDate(now);
    const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // dushanba = 0
    return shiftDay(today, -weekday);
  }

  async function claimReportWeek(week) {
    const db = getFirestore();
    if (!db) {
      if (memoryStore.weeklyReportWeek === week) return false;
      memoryStore.weeklyReportWeek = week;
      return true;
    }
    const ref = db.collection("settings").doc("telegram");
    return db.runTransaction(async tx => {
      const doc = await tx.get(ref);
      if (doc.exists && doc.data().weeklyReportWeek === week) return false;
      tx.set(ref, { weeklyReportWeek: week }, { merge: true });
      return true;
    });
  }

  async function deliverReport(messages, fin, chatId) {
    let sent = 0, failed = 0;
    for (const text of messages) {
      if (chatId) { await sendText(chatId, text); sent++; continue; }
      const result = await deliver("weekly_report", text, fin);
      sent += result.sent; failed += result.failed;
    }
    return { sent, failed };
  }

  // force: kun/soatni tekshirmasdan (superadmin tugmasi); current: joriy hafta bugungacha (/hisobot buyrug'i).
  async function sendWeeklyReport({ now = new Date(), force = false, current = false, chatId = "" } = {}) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return { sent: 0, reason: "token" };
    const monday = weekKey(now);
    const today = tashkentDate(now);
    const auto = !force && !current && !chatId;
    if (auto && (today !== monday || tashkentHour(now) < REMINDER_HOUR)) return { sent: 0, reason: "not-monday" };
    const range = current ? { from: monday, to: today } : { from: shiftDay(monday, -7), to: shiftDay(monday, -1) };
    const fin = await finance();
    const messages = weeklyReportText(fin, { ...range, today });
    if (auto && !(await claimReportWeek(monday))) return { sent: 0, reason: "already" };
    try {
      const result = await deliverReport(messages, fin, chatId);
      // Qabul qiluvchi yo'q bo'lsa, hafta band qolaveradi: har so'rovda qayta urinilmaydi.
      if (auto && !result.sent && !result.failed) return { ...result, ...range, reason: "no-recipients" };
      if (auto && !result.sent) throw new Error("Haftalik hisobot Telegramga yuborilmadi.");
      return { ...result, ...range };
    } catch (error) {
      if (auto) {
        const db = getFirestore();
        if (db) await db.collection("settings").doc("telegram").set({ weeklyReportWeek: "" }, { merge: true }).catch(() => {});
        else memoryStore.weeklyReportWeek = "";
      }
      throw error;
    }
  }

  let reportCheckedWeek = "";
  function ensureWeeklyReport() {
    const now = new Date();
    const monday = weekKey(now);
    if (reportCheckedWeek === monday || tashkentDate(now) !== monday || tashkentHour(now) < REMINDER_HOUR || !process.env.TELEGRAM_BOT_TOKEN) return null;
    reportCheckedWeek = monday;
    return sendWeeklyReport({ now }).catch(error => {
      reportCheckedWeek = "";
      console.error("Weekly report failed:", error.message);
    });
  }

  app.post("/api/telegram/weekly-report", authRequired, superAdminRequired, async (req, res) => {
    try {
      const result = await sendWeeklyReport({ force: true, current: req.body?.period === "current" });
      if (!result.sent) return res.status(400).json({ error: "Hisobot yuborilmadi: botga ulangan buxgalter yoki superadmin yo'q. Buxgalter botda /start bosib telefonini yuborsin." });
      res.json({ ok: true, ...result });
    } catch (error) { res.status(502).json({ error: error.message || "Hisobot yuborilmadi." }); }
  });

  return { deliver, notifyChanges, finance, storageChat, ensureWebhook, sendDeadlineReminders, ensureDeadlineReminders,
    sendWeeklyReport, ensureWeeklyReport, deadlineProjects, escape: h, money };
}

module.exports = { normalizePhone, canReceive, completionTiming, weeklyReportText, createTelegramStaff };
