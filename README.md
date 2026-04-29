# Planet Print Finance (Server Ready)

Bu loyiha endi server bilan ishlashga tayyor:
- Backend: `Node.js + Express + SQLite`
- Auth: `JWT`
- Frontend: bitta `planet print.html` (API orqali ishlaydi)

## 1) Local serverda ishga tushirish

```bash
npm install
copy .env.example .env
npm start
```

Brauzer:
- `http://localhost:3000`

## 2) Birinchi setup

1. Sahifani oching.
2. Birinchi bo'lib Super Admin yarating.
3. Keyin login qiling.

## 3) GitHub ga yuklash

```bash
git init
git add .
git commit -m "Server-ready planet print finance"
git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
```

## 4) Deploy variantlar (GitHubdan)

### Render
1. Renderda `New Web Service` -> GitHub repo ulang.
2. Build command: `npm install`
3. Start command: `npm start`
4. Environment:
   - `JWT_SECRET` = kuchli random qiymat
   - `PORT` avtomatik

### Railway
1. `New Project` -> `Deploy from GitHub`.
2. `JWT_SECRET` env qo'ying.
3. Deploy qiling.

### Vercel (Serverless)
1. Create a new project in Vercel and link your GitHub repo.
2. In Vercel Project Settings -> Environment Variables, add:
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` = base64 encoded full JSON contents of a fresh Firebase service account key
   - `JWT_SECRET` = a strong random secret
3. Build & Run settings: keep Root Directory as the repo root. Do not set `package-lock.json` as a Vercel config file; the config file is `vercel.json`.
4. Deploy. If your function crashes, check Vercel function logs to see errors (most often missing `FIREBASE_SERVICE_ACCOUNT` or invalid JSON).

Firebase credential tekshirish:

```bash
node scripts/test_firebase_credentials.js
```

`invalid_grant: Invalid JWT Signature` chiqsa, service account private key yaroqsiz. Firebase Console -> Project settings -> Service accounts -> Generate new private key qilib yangi JSON yarating va Vercel envga qayta kiriting.

## 5) Muhim

- `data/` papka server bazasi uchun (`SQLite`), `.gitignore`da ignore qilingan.
- Productionda `JWT_SECRET` ni albatta almashtiring.
- Bir nechta qurilmadan bir xil server URL ga kirilsa, hamma joyda bitta ma'lumotlar bazasi boshqariladi.
# planet-print-max
