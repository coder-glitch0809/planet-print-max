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
- `Dizayner` rolidagi foydalanuvchi `Dizaynlar` bo'limida mijoz tasdiqlagan dizaynni o'lcham va montaj vazifasi bilan yuboradi. Qabul qiluvchilar foydalanuvchi roli va amaldagi bo'lim ruxsatlari asosida aniqlanadi.
- Telegram integratsiyasi uchun `.env` yoki hosting muhitida `TELEGRAM_BOT_TOKEN`, `TELEGRAM_MEDIA_CHAT_ID`, `APP_PUBLIC_URL` va `TELEGRAM_WEBHOOK_SECRET` ni belgilang. Media chat yopiq bo'lishi kerak: rasmlar u yerda saqlanadi. Tokenni frontendga yoki ommaviy repozitoriyga joylamang.
- Har oyning 1-sanasidan to'lov eslatmasi ko'rinadi. 5-sanasidan keyin super admin to'lovni tasdiqlamaguncha boshqa foydalanuvchilar uchun amallar bloklanadi; super admin ishlashda davom etadi va to'lov panelini chetda ko'radi.
- Bo'limlar o'ziga xos rang bilan ajratilgan; tungi rejimda bo'lim rangi faqat urg'u rangiga ta'sir qiladi, fon va panellar qorong'i bo'lib qoladi.
# planet-print-max
# Admin huquqlari, MAX va Telegram xodimlar boti

- Superadmin **Foydalanuvchilar → Tahrirlash** orqali rol va mas’ul bo‘limlarni o‘zgartiradi. Bo‘sh parol eski parolni saqlaydi. Server har so‘rovda amaldagi huquqlarni tekshiradi; eski token bekor qilingan huquqni qaytarmaydi. Yangi menyuni olish uchun sahifani yangilang.
- **To‘lovlar → MAX** tanlangan zakazning qolgan qarzini kiritadi. To‘lovni saqlash orqali qarz yopiladi. MAX bosishning o‘zi pul tushumini saqlamaydi.
- **Admin va rollar boshqaruvi** formasida telefon raqami, rol va bo‘lim ruxsatlarini belgilang. Telefon qo‘shish/tahrirlashda saqlanadi va ro‘yxatda ko‘rinadi; takrorlangan raqam qabul qilinmaydi. Bot har yuborishda amaldagi ruxsatlarni tekshiradi.
- **Montajnik / Xodim** (`worker`) uchun `Dizaynlar` ruxsatini belgilang. U faqat tasdiqlangan dizayn rasmi, o‘lchamlari va bajariladigan montaj ishini oladi. Oddiy dizayn yangilanishlari, to‘lovlar, xarajatlar va e’lonlar bu rolga yuborilmaydi, hatto shu bo‘lim ruxsatlari belgilangan bo‘lsa ham. Dizayner, menejer va buxgalter tegishli belgilangan bo‘lim yangiliklarini oladi. E’lon uchun `Sozlamalar` ruxsati kerak; mijozga ichki xabar yuborilmaydi.
- `Dizaynlar` formasida o‘lcham (birligi bilan) va bajariladigan ish majburiy. Yuborish API serverda saqlangan tasdiq, rasm, o‘lcham va vazifani tekshiradi; brauzerdan berilgan erkin caption yoki tasdiq yetarli emas. Bu bo‘lim bo‘yicha yuborish: alohida zakazga bitta montajnik tayinlash filtri yo‘q.
- **Sozlamalar → Bog‘lanishlarni tekshirish** orqali chat ID va ulanish holatini ko‘ring; kerak bo‘lsa bog‘lanishni uzing.

Telegramni ishga tushirish:

1. Server muhitida `TELEGRAM_BOT_TOKEN`, `APP_PUBLIC_URL` (saytning ochiq HTTPS manzili) va `TELEGRAM_WEBHOOK_SECRET` (tasodifiy 16–256 belgi, harf/raqam/`_`/`-`) kiriting. Namunalar `.env.example` da. Tokenlarni brauzerga kiritmang.
2. Saytni shu manzilga joylashtirgandan keyin superadmin **Sozlamalar → Botni ulash (webhook)** tugmasini bir marta bosadi.
3. Xodim `/start` bosadi. Bot chat IDni o‘zi oladi. Telegram telefonni avtomatik bermagani uchun xodim **Telefon raqamni yuborish** tugmasini bir marta bosadi. Bot faqat jo‘natuvchining o‘z kontaktini qabul qiladi va dasturdagi yagona mos raqamga bog‘laydi.
4. Dizayn foydalanuvchilarning shaxsiy bot chatlariga yuboriladi. Umumiy montaj guruhiga yuborish o‘chirildi: guruh orqali ruxsatlarni chetlab o‘tish mumkin emas. Rasmlarni saqlash uchun `TELEGRAM_MEDIA_CHAT_ID` sozlamasi kerak.

Avval Ishchilar kartasi orqali ulangan xodimlar uchun telefonni foydalanuvchi kartasiga kiriting; xodim `/start` bosib kontaktini qayta yuborsin. Eski ishchi bog‘lanishlari yangi huquqlarni chetlab o‘tmaydi. Telefon o‘zgarsa eski bog‘lanish xabar olmaydi; boshqa Telegram hisobiga qayta ulashdan oldin superadmin eski bog‘lanishni uzadi.

Bog‘lanishlar Firebase `telegramStaff` kolleksiyasida saqlanadi; Firebase bo‘lmagan xotira rejimida server qayta ishga tushsa yo‘qoladi. Telegram yuborish xatosi moliyaviy yozuvni bekor qilmaydi; avtomatik qayta yuborish navbati yo‘q. Haqiqiy Telegram/Firebase xizmatlariga tegmasdan regressiya testlari: `npm test`.

Telegram kontakt va webhook talablari: https://core.telegram.org/bots/api#keyboardbutton va https://core.telegram.org/bots/api#setwebhook.
