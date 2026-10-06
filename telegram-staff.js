const crypto = require("crypto");

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

function canReceive(user, category) {
  if (user.role === "client") return false;
  const permission = category === "approved_designs" ? "designs" : category === "announcements" ? "settings" : category;
  if (user.role === "worker" && category !== "approved_designs") return false;
  return user.role === "super_admin" || accountPermissions(user).includes(permission);
}

function createTelegramStaff({ app, authRequired, superAdminRequired, telegramApi, getFirestore, memoryStore, normalizeFinance }) {
  const memoryBindings = new Map();
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
    return db ? (await db.collection("telegramStaff").get()).docs.map(doc => doc.data()) : [...memoryBindings.values()];
  }
  async function bind(worker, message) {
    const record = { accountId: worker.id, phone: normalizePhone(worker.phone), chatId: String(message.chat.id), userId: String(message.from.id) };
    const db = getFirestore();
    if (db) {
      await db.runTransaction(async transaction => {
        const ref = db.collection("telegramStaff").doc(`account-${worker.id}`);
        const existing = await transaction.get(ref);
        if (existing.exists && existing.data().userId !== record.userId) throw new Error("Bu raqam boshqa Telegram hisobiga bog'langan. Superadmindan bog'lanishni uzishni so'rang.");
        transaction.set(ref, record);
      });
    } else {
      const old = memoryBindings.get(worker.id);
      if (old && old.userId !== record.userId) throw new Error("Bu raqam boshqa Telegram hisobiga bog'langan.");
      memoryBindings.set(worker.id, record);
    }
  }

  app.post("/api/telegram/webhook", async (req, res) => {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET || "";
    const actual = String(req.get("X-Telegram-Bot-Api-Secret-Token") || "");
    if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
        !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return res.sendStatus(403);
    const message = req.body?.message;
    if (!message || message.chat?.type !== "private" || message.from?.is_bot) return res.json({ ok: true });
    const reply = (text, reply_markup) => telegramApi("sendMessage", { chat_id: message.chat.id, text, ...(reply_markup ? { reply_markup } : {}) });
    try {
      if (message.contact) {
        if (message.contact.user_id !== message.from.id) {
          await reply("Faqat o'zingizning telefon raqamingizni tugma orqali yuboring.");
        } else {
          const phone = normalizePhone(message.contact.phone_number);
          const workers = (await accounts()).filter(w => normalizePhone(w.phone) === phone);
          if (workers.length !== 1) await reply("Raqamingiz topilmadi yoki takrorlangan. Superadmin Admin va rollar boshqaruvidagi telefonni tekshirsin, keyin /start bosing.");
          else {
            try {
              await bind(workers[0], message);
              const roleNames = { worker: "Montajnik", designer: "Dizayner", manager: "Menejer", accountant: "Buxgalter", admin: "Admin", super_admin: "Superadmin", viewer: "Kuzatuvchi", client: "Mijoz" };
              await reply(`${workers[0].username}, muvaffaqiyatli bog'landingiz! Lavozim: ${roleNames[workers[0].role] || workers[0].role}. Chat ID: ${message.chat.id}. ${workers[0].role === "worker" ? "Dizaynlar ruxsati berilganda faqat tasdiqlangan dizayn, o'lcham va montaj vazifasi keladi." : "Xabarlar sizga berilgan bo'lim ruxsatlariga qarab keladi."}`, { remove_keyboard: true });
            } catch (error) {
              // Binding conflicts are actionable; storage errors should be retried by Telegram.
              if (!error.message.includes("bog'langan")) throw error;
              await reply(error.message);
            }
          }
        }
      } else if (/^\/start(?:@\w+)?(?:\s|$)/.test(message.text || "") || /Chat ID olish/.test(message.text || "")) {
        const all = await bindings();
        const current = await accounts();
        const linked = all.find(b => b.userId === String(message.from.id) && current.some(w => w.id === b.accountId && normalizePhone(w.phone) === b.phone));
        await reply(`Chat ID: ${message.chat.id}. ${linked ? "Hisobingiz bog'langan." : "Dasturdagi xodim hisobiga bog'lanish uchun telefon raqamingizni yuboring."}`,
          linked ? { remove_keyboard: true } : { keyboard: [[{ text: "Telefon raqamni yuborish", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("Telegram registration failed:", error.message);
      res.status(503).json({ error: "Telegram ulanishida xato." });
    }
  });

  app.get("/api/telegram/staff", authRequired, superAdminRequired, async (_req, res) => {
    try {
      const current = await accounts();
      const all = await bindings();
      res.json({ workers: current.map(worker => {
        const connection = all.find(b => b.accountId === worker.id && b.phone === normalizePhone(worker.phone));
        return { id: worker.id, name: worker.username, role: worker.role, phone: worker.phone || "", chatId: connection?.chatId || "" };
      }) });
    } catch (error) { res.status(503).json({ error: "Telegram bog'lanishlarini olishda xato." }); }
  });
  app.delete("/api/telegram/staff/:id", authRequired, superAdminRequired, async (req, res) => {
    try {
      const db = getFirestore();
      if (db) await db.collection("telegramStaff").doc(`account-${req.params.id}`).delete();
      else memoryBindings.delete(req.params.id);
      res.json({ ok: true });
    } catch (error) { res.status(503).json({ error: "Bog'lanishni uzishda xato." }); }
  });
  app.post("/api/telegram/setup-webhook", authRequired, superAdminRequired, async (_req, res) => {
    try {
      const base = new URL(process.env.APP_PUBLIC_URL);
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
      if (base.protocol !== "https:" || !/^[A-Za-z0-9_-]{16,256}$/.test(secret)) throw new Error("APP_PUBLIC_URL (HTTPS) va TELEGRAM_WEBHOOK_SECRET (16–256 belgi) sozlang.");
      await telegramApi("setWebhook", { url: new URL("/api/telegram/webhook", base).href, secret_token: secret, allowed_updates: ["message"] });
      res.json({ ok: true });
    } catch (error) { res.status(400).json({ error: error.message }); }
  });

  async function deliver(category, text, currentFinance, photo) {
    const current = await accounts();
    const all = await bindings();
    const recipients = [...new Set(current.filter(w => canReceive(w, category) && normalizePhone(w.phone)).flatMap(w =>
      all.filter(b => b.accountId === w.id && b.phone === normalizePhone(w.phone)).map(b => b.chatId)))];
    if (!recipients.length) return { sent: 0, failed: 0 };
    const results = await Promise.allSettled(recipients.map(chat_id => photo
      ? telegramApi("sendPhoto", { chat_id, photo, caption: text.slice(0, 1000) })
      : telegramApi("sendMessage", { chat_id, text: text.slice(0, 4000) })));
    return { sent: results.filter(r => r.status === "fulfilled").length, failed: results.filter(r => r.status === "rejected").length };
  }
  async function notifyChanges(previous, next) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return [];
    const warnings = [];
    const labels = { projects: "Zakaz", measurements: "O'lchov", designs: "Dizayn", payments: "To'lov", expenses: "Xarajat" };
    try {
      for (const [category, label] of Object.entries(labels)) {
        const before = new Map(previous[category].map(row => [row.id, JSON.stringify(row)]));
        const changed = next[category].filter(row => before.get(row.id) !== JSON.stringify(row));
        if (!changed.length) continue;
        const lines = changed.map(row => {
          const project = next.projects.find(p => p.id === row.projectId);
          return [row.name || row.projectName || project?.name || row.type || label,
            row.status, row.date, row.amount != null ? `${row.amount} UZS` : "", row.note].filter(Boolean).join(" | ");
        });
        const result = await deliver(category, `${label}: ${changed.length} ta yangilik\n${lines.join("\n")}`, next);
        if (result.failed) warnings.push(`${label}: ${result.failed} ta Telegram xabari yuborilmadi.`);
      }
    } catch (error) {
      console.error("Staff notifications failed:", error.message);
      warnings.push("Ma'lumot saqlandi, lekin Telegram xabarlari yuborilmadi.");
    }
    return warnings;
  }
  return { deliver, notifyChanges, finance };
}

module.exports = { normalizePhone, canReceive, createTelegramStaff };
