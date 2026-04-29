const { GoogleAuth } = require("google-auth-library");
const fs = require("fs");
const path = require("path");

for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]) {
  if (String(process.env[key] || "").includes("127.0.0.1:9")) delete process.env[key];
}

function normalizeServiceAccount(serviceAccount) {
  if (!serviceAccount || typeof serviceAccount !== "object") return serviceAccount;
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
  return serviceAccount;
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return normalizeServiceAccount(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")));
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return normalizeServiceAccount(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  }
  const file = path.join(__dirname, "..", "firebase-config.json");
  if (!fs.existsSync(file)) throw new Error("firebase-config.json topilmadi");
  return normalizeServiceAccount(require(file));
}

(async () => {
  const serviceAccount = loadServiceAccount();
  console.log("project_id:", serviceAccount.project_id);
  console.log("client_email:", serviceAccount.client_email);
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/datastore"]
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  console.log(token.token ? "Firebase credentials OK" : "Firebase credentials token qaytarmadi");
})().catch((err) => {
  console.error("Firebase credentials xato:", err.message);
  process.exit(1);
});
