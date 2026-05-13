const express = require("express");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "planet_print_change_me";
const FALLBACK_ADMIN_USER = process.env.SUPER_USER || "Superadmin";
const FALLBACK_ADMIN_PASS = process.env.SUPER_PASS || "Planet2026";

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
  workers: [],
  founders: [],
  expenses: [],
  settings: { tax: 0, reserve: 0, other: 0 }
};
const FINANCE_PERMS = ["dashboard", "projects", "workers", "founders", "expenses", "settings"];

let firestore;
const memoryStore = global.__planetPrintMemoryStore || {
  users: [],
  finance: DEFAULT_FINANCE
};
global.__planetPrintMemoryStore = memoryStore;

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
    permissions: JSON.stringify(["dashboard", "projects", "workers", "founders", "expenses", "users", "settings"])
  };
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    permissions: safeJsonParse(user.permissions, []),
    createdAt: user.createdAt || Date.now()
  };
}

function normalizeFinance(finance) {
  const src = finance && typeof finance === "object" ? finance : {};
  return {
    projects: Array.isArray(src.projects) ? src.projects : [],
    workers: Array.isArray(src.workers) ? src.workers : [],
    founders: Array.isArray(src.founders) ? src.founders : [],
    expenses: Array.isArray(src.expenses) ? src.expenses : [],
    settings: {
      tax: Number(src.settings?.tax) || 0,
      reserve: Number(src.settings?.reserve) || 0,
      other: Number(src.settings?.other) || 0
    }
  };
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
      workers: [],
      founders: [],
      expenses: [],
      settings: { tax: 0, reserve: 0, other: 0 }
    };
  }
  return {
    projects: canAccess(req, "projects") || canAccess(req, "dashboard") ? full.projects : [],
    workers: canAccess(req, "workers") ? full.workers : [],
    founders: canAccess(req, "founders") ? full.founders : [],
    expenses: canAccess(req, "expenses") ? full.expenses : [],
    settings: canAccess(req, "settings") ? full.settings : { tax: 0, reserve: 0, other: 0 }
  };
}

function mergeFinanceForUser(req, currentFinance, incomingFinance) {
  const current = normalizeFinance(currentFinance);
  const incoming = normalizeFinance(incomingFinance);
  if (req.user?.role === "super_admin") return incoming;
  if (req.user?.role === "client") return current;

  const next = { ...current };
  if (canAccess(req, "projects")) next.projects = incoming.projects;
  if (canAccess(req, "workers")) next.workers = incoming.workers;
  if (canAccess(req, "founders")) next.founders = incoming.founders;
  if (canAccess(req, "expenses")) next.expenses = incoming.expenses;
  if (canAccess(req, "settings")) next.settings = incoming.settings;
  return next;
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

async function findMemoryUser(login, password) {
  const normalized = String(login || "").toLowerCase();
  const user = memoryStore.users.find((item) =>
    String(item.username || "").toLowerCase() === normalized ||
    String(item.email || "").toLowerCase() === normalized
  );
  if (!user || !user.passHash) return null;
  const ok = await bcrypt.compare(password, user.passHash);
  return ok ? user : null;
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
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

app.use(express.json({ limit: "5mb" }));
app.use(express.static(__dirname));

const dbReady = initDb();

app.use("/api", async (_req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    console.error("Firebase startup failed:", err.message);
    res.status(500).json({ error: "Server database is not configured" });
  }
});

// --- API Routes ---

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString(), db: !!firestore });
});

app.get("/api/auth/setup-status", async (_req, res) => {
  const usersSnapshot = await firestore.collection("users").limit(1).get();
  res.json({ needsSetup: usersSnapshot.empty });
});

app.post("/api/auth/setup", async (req, res) => {
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
  const permissions = JSON.stringify(["dashboard", "projects", "workers", "founders", "expenses", "users", "settings"]);

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
  if (!login) return res.status(400).json({ error: "Login kiritilmagan" });
  if (!password) return res.status(400).json({ error: "Parol kiritilmagan" });

  try {
    const loginVariants = Array.from(new Set([
      login,
      login.toLowerCase(),
      login.charAt(0).toUpperCase() + login.slice(1).toLowerCase()
    ]));

    let usersSnapshot = null;
    for (const value of loginVariants) {
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

    if (!usersSnapshot || usersSnapshot.empty) {
      return res.status(404).json({
        error: `Bunday login topilmadi: ${login}. Katta-kichik harfni ham tekshiring yoki email bilan urinib ko'ring.`
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };
    if (!user.passHash) {
      return res.status(401).json({
        error: `Foydalanuvchi topildi, lekin parol hash saqlanmagan: ${user.username || login}. Parolni qayta o'rnating.`
      });
    }
    
    const ok = await bcrypt.compare(password, user.passHash);
    if (!ok) {
      return res.status(401).json({
        error: `Parol noto'g'ri. Login topildi: ${user.username || login}.`
      });
    }

    sendLogin(res, user);
  } catch (err) {
    console.error("Login failed:", err.message);
    const memoryUser = await findMemoryUser(login, password);
    if (memoryUser) return sendLogin(res, memoryUser);
    if (login === FALLBACK_ADMIN_USER && password === FALLBACK_ADMIN_PASS) {
      return sendLogin(res, fallbackAdminUser());
    }
    res.status(503).json({
      error: `Firebase bilan aloqa yo'q: ${err.message}. Vercel Environment Variables va Firebase service account sozlamasini tekshiring.`
    });
  }
});

app.post("/api/auth/google", async (req, res) => {
  const idToken = req.body?.idToken;
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email || "";
    const username = String(email).split("@")[0] || decoded.uid;

    const usersRef = firestore.collection("users");
    const q = await usersRef.where("username", "==", username).limit(1).get();
    let userDoc;
    
    if (q.empty) {
      const id = Math.random().toString(36).slice(2, 10);
      const permissions = JSON.stringify(["dashboard", "projects", "workers", "founders", "expenses"]);
      await usersRef.doc(id).set({
        username,
        passHash: "",
        role: "admin",
        permissions,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      userDoc = await usersRef.doc(id).get();
    } else {
      userDoc = q.docs[0];
    }

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

app.get("/api/finance", authRequired, async (req, res) => {
  const financeDoc = await firestore.collection("settings").doc("finance").get();
  const financeData = financeDoc.exists ? financeDoc.data() : { data: DEFAULT_FINANCE };
  let finance = financeData.data ?? financeData;
  if (typeof finance === "string") finance = safeJsonParse(finance, DEFAULT_FINANCE);
  finance = normalizeFinance(finance);

  res.json({
    finance: visibleFinanceForUser(req, finance),
    updatedAt: financeData.updatedAt ? financeData.updatedAt.toMillis() : Date.now()
  });
});

app.put("/api/finance", authRequired, async (req, res) => {
  const finance = req.body?.finance;
  if (!finance || typeof finance !== "object") return res.status(400).json({ error: "Invalid payload" });
  if (!FINANCE_PERMS.some((perm) => canAccess(req, perm))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const financeDoc = await firestore.collection("settings").doc("finance").get();
  const financeData = financeDoc.exists ? financeDoc.data() : { data: DEFAULT_FINANCE };
  let currentFinance = financeData.data ?? financeData;
  if (typeof currentFinance === "string") currentFinance = safeJsonParse(currentFinance, DEFAULT_FINANCE);
  const mergedFinance = mergeFinanceForUser(req, currentFinance, finance);
  
  await firestore.collection("settings").doc("finance").set({
    data: mergedFinance,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.json({ ok: true });
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

app.post("/api/users", authRequired, superAdminRequired, async (req, res) => {
  const username = sanitizeText(req.body?.username, 32);
  const password = String(req.body?.password || "");
  const role = sanitizeText(req.body?.role, 20);
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions.map(x => sanitizeText(x, 30)).filter(Boolean) : [];

  if (!username || password.length < 8) return res.status(400).json({ error: "Invalid credentials" });
  if (!["admin", "manager", "viewer", "client"].includes(role)) return res.status(400).json({ error: "Invalid role" });

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
      firestore.collection("users").doc(id).set({
        username,
        email,
        passHash,
        role,
        permissions: JSON.stringify(permissions),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }),
      10000,
      "Firebase create user timeout"
    );

    return res.json({ ok: true, storage: "firebase" });
  } catch (err) {
    console.error("Create user fallback mode:", err.message);
  }

  const normalized = username.toLowerCase();
  const duplicate = memoryStore.users.some((user) => String(user.username || "").toLowerCase() === normalized);
  if (duplicate) return res.status(409).json({ error: "Login already exists in fallback storage" });

  memoryStore.users.push({
    id,
    username,
    email,
    passHash,
    role,
    permissions: JSON.stringify(permissions),
    createdAt: Date.now()
  });

  res.json({
    ok: true,
    storage: "memory",
    warning: "Firebase ishlamagani uchun foydalanuvchi vaqtinchalik server xotirasida saqlandi. Vercel redeploy/cold startdan keyin yo'qolishi mumkin."
  });
});

app.delete("/api/users/:id", authRequired, superAdminRequired, async (req, res) => {
  const id = sanitizeText(req.params.id, 40);
  const memoryIndex = memoryStore.users.findIndex((user) => user.id === id);
  if (memoryIndex >= 0) {
    if (memoryStore.users[memoryIndex].role === "super_admin") {
      return res.status(400).json({ error: "Super adminni o'chirib bo'lmaydi" });
    }
    memoryStore.users.splice(memoryIndex, 1);
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
