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
- Xarajat, ishchi oyligi va avanslar bir yoki bir nechta zakazga to'liq taqsimlanadi; yangi mijoz to'lovlari ham zakazga bog'lanadi.
- Oy almashganda tushumlar, xarajatlar, zakaz va xodim/ta'sischi snapshotlari arxivlanadi. Qarz qolgan zakazlar qoldiq summasi bilan keyingi oyga o'tadi.
- `Hisobotlar` bo'limida arxiv va joriy ma'lumotlar bo'yicha oylik/yillik daromad-xarajat ko'rsatkichlari bor. Tanlangan oy yoki yil uchun `Excelga yuklash (.csv)` Excel ochadigan CSV faylini yuklab beradi.
- `O'lchovlar` bo'limida joyga chiqish sanasi, manzil, mas'ul xodim, ixtiyoriy o'lchamlar va rasm qayd qilinadi. Super admin foydalanuvchilar sahifasida `Xodim` rolini berishi mumkin. O'lchov va dizayn rasmlari Telegram bot orqali yopiq media chatga yuklanadi; arxiv yopilganda yozuvlar ham saqlanadi.
- `Dizayner` rolidagi foydalanuvchi zakazning moliyaviy ma'lumotlarini ko'rmasdan `Dizaynlar` bo'limida mijoz tasdiqlagan dizaynni montajchilar guruhiga yuborishi mumkin. `Sozlamalar`dagi super admin e'loni ham xodimlar Telegram guruhiga yuboriladi.
- Telegram integratsiyasi uchun lokal `.env` faylida, deploy qilinganda esa hosting provayderining Environment Variables bo'limida `TELEGRAM_BOT_TOKEN`, `TELEGRAM_INSTALLERS_CHAT_ID` va `TELEGRAM_MEDIA_CHAT_ID` ni belgilang. Media chat yopiq bo'lishi kerak: o'lchov va dizayn rasmlari u yerda saqlanadi; faqat tasdiqlangan dizayn montajchilar guruhiga yuboriladi. Bot ikkala chatga ham xabar yubora olishi kerak. Tokenni frontendga yoki ommaviy repozitoriyga joylamang.
- Har oyning 1-sanasidan to'lov eslatmasi ko'rinadi. 5-sanasidan keyin super admin to'lovni tasdiqlamaguncha boshqa foydalanuvchilar uchun amallar bloklanadi; super admin ishlashda davom etadi va to'lov panelini chetda ko'radi.
- Bo'limlar o'ziga xos rang bilan ajratilgan; tungi rejimda bo'lim rangi faqat urg'u rangiga ta'sir qiladi, fon va panellar qorong'i bo'lib qoladi.
# planet-print-max
