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
const CATEGORY_PERMISSION = { approved_designs: "designs", announcements: "settings", advances: "expenses" };
// Lavozimning o'zi yetarli bo'lgan xabarlar: buxgalter pul harakatini, dizayner o'lchovlarni doim oladi.
const ROLE_CATEGORIES = { accountant: ["projects", "payments", "expenses", "advances"], designer: ["measurements"] };
const CATEGORY_LABELS = {
  projects: "yangi loyihalar, baholanishi, avansi va yakunlanishi",
  payments: "mijoz to'lovlari",
  expenses: "xarajatlar",
  advances: "ishchi va ta'sischi avanslari, oyliklar",
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
const GUIDE_DIR = path.join(__dirname, "assets", "guide");

function canReceive(user, category) {
  if (user.role === "client") return false;
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
  const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return new URL(`https://${host}`);
}

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
      groupChatId: String(stored.groupChatId || process.env.TELEGRAM_GROUP_CHAT_ID || "").trim(),
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
  async function sendTo(chats, text, photo) {
    const list = [...chats];
    const results = await Promise.allSettled(list.map(chat_id => photo
      ? telegramApi("sendPhoto", { chat_id, photo, caption: text.slice(0, 1000), parse_mode: "HTML" })
      : sendText(chat_id, text)));
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
  async function deliver(category, text, fin, photo, { personalPhones = [], personalText, toGroup = false } = {}) {
    const ctx = await context(fin);
    const roleSet = category ? roleChats(ctx, category) : new Set();
    // Ishchi o'zi ham buxgalter bo'lsa, bitta xabar yetadi.
    const personal = [...phoneChats(ctx, personalPhones)].filter(chat => !roleSet.has(chat));
    const groupChat = toGroup && ctx.cfg.groupChatId && !roleSet.has(ctx.cfg.groupChatId) ? ctx.cfg.groupChatId : "";
    const main = await sendTo(new Set([...roleSet, ...(personalText ? [] : personal), ...(groupChat ? [groupChat] : [])]), text, photo);
    const own = personalText && personal.length ? await sendTo(new Set(personal), personalText, photo) : { sent: 0, failed: 0 };
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
      lines.push("• Superadmin — hammasi", "• Buxgalter — loyihalar, to'lovlar, xarajatlar, avanslar",
        "• Dizayner — o'lchovlar (rasm bilan) va dizayn bo'limi", "• Montajnik — tasdiqlangan dizayn, o'lcham va vazifa",
        "• Ishchi / ta'sischi — o'ziga berilgan avans haqida shaxsiy xabar");
    }
    lines.push("", "<b>3. Guruh (superadmin uchun)</b>",
      "• Botni ishchilar guruhiga qo'shing.",
      "• Guruhda /guruh yozing — guruh ulanadi (faqat botga ulangan superadmin).",
      "• Guruhga tasdiqlangan dizaynlar va yangi o'lchovlar keladi. Guruh ID'sini /chatid bilan ko'rish mumkin.");
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
        await sendText(member.chat.id, `👋 Planet Print boti guruhga qo'shildi.\n🆔 Guruh Chat ID: <code>${h(member.chat.id)}</code>\n\nGuruhni ulash uchun botga ulangan superadmin shu guruhda /guruh yozsin.`);
        return res.json({ ok: true });
      }
      const message = req.body?.message;
      if (!message || message.from?.is_bot) return res.json({ ok: true });
      const text = String(message.text || "");
      const chat = message.chat || {};
      const reply = (body, markup) => sendText(chat.id, body, markup);

      if (chat.type === "group" || chat.type === "supergroup") {
        if (/^\/(chatid|id|start)(@\w+)?(\s|$)/i.test(text) || /chat id olish/i.test(text)) {
          await reply(`🆔 Guruh Chat ID: <code>${h(chat.id)}</code>\nGuruhni ulash: superadmin /guruh yozsin.`);
        } else if (/^\/guruh(@\w+)?(\s|$)/i.test(text)) {
          const ctx = await context();
          const person = await personForTelegramUser(message.from?.id, ctx);
          if (person?.account?.role !== "super_admin") await reply("⛔ Guruhni faqat botga ulangan superadmin ulay oladi. Avval botga shaxsiy chatda /start bosib telefoningizni yuboring.");
          else {
            await saveConfig({ groupChatId: String(chat.id), groupTitle: String(chat.title || "").slice(0, 120) });
            await reply(`✅ <b>Guruh ulandi</b>\nEndi bu guruhga tasdiqlangan dizaynlar va yangi o'lchovlar keladi.\n🆔 <code>${h(chat.id)}</code>`);
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
        await reply(`🆔 Sizning Chat ID: <code>${h(chat.id)}</code>\n${person ? `✅ Hisobingiz bog'langan: ${who}.` : "Dasturdagi hisobingizga bog'lanish uchun pastdagi <b>📱 Telefon raqamni yuborish</b> tugmasini bosing."}`,
          person ? PRIVATE_KEYBOARD : CONTACT_KEYBOARD);
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
      const url = new URL("/api/telegram/webhook", base).href;
      await telegramApi("setWebhook", { url, secret_token: secret, allowed_updates: ["message", "my_chat_member"], drop_pending_updates: false });
      await telegramApi("setMyCommands", { commands: [
        { command: "start", description: "Botga ulanish" },
        { command: "chatid", description: "Chat ID olish" },
        { command: "qollanma", description: "Qo'llanma" },
        { command: "guruh", description: "Guruhni ulash (superadmin, guruhda)" }
      ] }).catch(() => {});
      res.json({ ok: true, url });
    } catch (error) { res.status(400).json({ error: error.message }); }
  });
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
      m.note ? `📝 ${h(m.note)}` : ""
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
  return { deliver, notifyChanges, finance, storageChat, escape: h, money };
}

module.exports = { normalizePhone, canReceive, completionTiming, createTelegramStaff };
