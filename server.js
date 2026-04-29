const express = require("express");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "planet_print_change_me";

const DEFAULT_FINANCE = {
  projects: [],
  workers: [],
  founders: [],
  expenses: [],
  settings: { tax: 0, reserve: 0, other: 0 }
};

let firestore;

function safeJsonParse(value, fallback) {
  try {
    if (value && typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function initDb() {
  let serviceAccount = null;

  // 1. Environment Variable orqali tekshirish (Vercel uchun eng asosiysi)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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
        serviceAccount = require("./firebase-config.json");
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
  
  // Firestore'da default ma'lumotlarni tekshirish
  const financeDoc = await firestore.collection("settings").doc("finance").get();
  if (!financeDoc.exists) {
    await firestore.collection("settings").doc("finance").set({
      data: DEFAULT_FINANCE,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
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
  const username = sanitizeText(req.body?.username, 32);
  const password = String(req.body?.password || "");

  const usersSnapshot = await firestore.collection("users").where("username", "==", username).limit(1).get();
  if (usersSnapshot.empty) return res.status(401).json({ error: "Login yoki parol xato" });

  const userDoc = usersSnapshot.docs[0];
  const user = { id: userDoc.id, ...userDoc.data() };
  if (!user.passHash) return res.status(401).json({ error: "Login yoki parol xato" });
  
  const ok = await bcrypt.compare(password, user.passHash);
  if (!ok) return res.status(401).json({ error: "Login yoki parol xato" });

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
  const userDoc = await firestore.collection("users").doc(req.user.id).get();
  if (!userDoc.exists) return res.status(401).json({ error: "User not found" });
  
  const user = userDoc.data();
  res.json({
    user: {
      id: userDoc.id,
      username: user.username,
      role: user.role,
      permissions: safeJsonParse(user.permissions, [])
    }
  });
});

app.get("/api/finance", authRequired, async (_req, res) => {
  const financeDoc = await firestore.collection("settings").doc("finance").get();
  const financeData = financeDoc.exists ? financeDoc.data() : { data: DEFAULT_FINANCE };
  let finance = financeData.data ?? financeData;
  if (typeof finance === "string") finance = safeJsonParse(finance, DEFAULT_FINANCE);
  if (!finance || typeof finance !== "object") finance = DEFAULT_FINANCE;

  res.json({
    finance,
    updatedAt: financeData.updatedAt ? financeData.updatedAt.toMillis() : Date.now()
  });
});

app.put("/api/finance", authRequired, async (req, res) => {
  const finance = req.body?.finance;
  if (!finance || typeof finance !== "object") return res.status(400).json({ error: "Invalid payload" });
  
  await firestore.collection("settings").doc("finance").set({
    data: finance,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.json({ ok: true });
});

app.get("/api/users", authRequired, superAdminRequired, async (_req, res) => {
  const usersSnapshot = await firestore.collection("users").orderBy("createdAt", "asc").get();
  const users = usersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      username: data.username,
      role: data.role,
      permissions: safeJsonParse(data.permissions, []),
      createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now()
    };
  });
  res.json({ users });
});

app.post("/api/users", authRequired, superAdminRequired, async (req, res) => {
  const username = sanitizeText(req.body?.username, 32);
  const password = String(req.body?.password || "");
  const role = sanitizeText(req.body?.role, 20);
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions.map(x => sanitizeText(x, 30)).filter(Boolean) : [];

  if (!username || password.length < 8) return res.status(400).json({ error: "Invalid credentials" });
  if (!["admin", "manager", "viewer"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const existing = await firestore.collection("users").where("username", "==", username).limit(1).get();
  if (!existing.empty) return res.status(409).json({ error: "Login already exists" });

  const passHash = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).slice(2, 10);
  const email = sanitizeText(req.body?.email, 128) || `${username}@planetprint.local`;

  try {
    await admin.auth().createUser({ email, password });
  } catch (err) {
    console.warn('Warning creating firebase auth user:', err.message);
  }

  await firestore.collection("users").doc(id).set({
    username,
    email,
    passHash,
    role,
    permissions: JSON.stringify(permissions),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({ ok: true });
});

app.delete("/api/users/:id", authRequired, superAdminRequired, async (req, res) => {
  const id = sanitizeText(req.params.id, 40);
  const userDoc = await firestore.collection("users").doc(id).get();
  if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
  
  const user = userDoc.data();
  if (user.role === "super_admin") return res.status(400).json({ error: "Super adminni o'chirib bo'lmaydi" });
  
  await firestore.collection("users").doc(id).delete();
  res.json({ ok: true });
});

// SPA uchun barcha boshqa yo'llarni HTML-ga yo'naltirish
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "planet print.html"));
});

// Serverni ishga tushirish
initDb()
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