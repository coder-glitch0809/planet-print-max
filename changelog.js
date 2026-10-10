// Dastur yangilanishlari ro'yxati. "Yangiliklar" bo'limida ko'rsatiladi.
// Yangi o'zgarish kiritilganda ro'yxat BOSHIGA yangi yozuv qo'shing (eng yangisi birinchi).
module.exports = [
  {
    version: "2026.10.11",
    date: "2026-10-11",
    title: "Avanslar, loyihani yakunlash va Telegram xabarlari",
    items: [
      "Dizayn va o'lchov rasmi endi TELEGRAM_MEDIA_CHAT_ID'siz ham yuklanadi: rasm yuklovchining bot chatida yoki Sozlamalardagi media chatda saqlanadi.",
      "Sozlamalar → Telegram bot: «Bot holatini tekshirish» bot nima uchun javob bermayotganini ko'rsatadi; «Botni ulash» endi APP_PUBLIC_URL va maxfiy kalitni o'zi aniqlaydi.",
      "Botda «🆔 Chat ID olish», /chatid va «📖 Qo'llanma» tugmalari; guruhda /chatid va /guruh ishlaydi.",
      "Ishchi va ta'sischiga avans: jadvaldagi «Avans berish» tugmasi, zakaz tanlash ixtiyoriy. Ta'sischiga telefon kiritiladi.",
      "Avans berilganda ishchining (ta'sischining) o'ziga shaxsiy va buxgalterga Telegram xabar boradi: summa, shu oy jami avans, qolgan oylik.",
      "Yangi loyiha haqida buxgalterga: qancha baholandi, qancha avans olindi, qoldiq.",
      "Loyihalarda «✓ Yakunlandi» tugmasi: muddatidan oldin yoki kechikib tugasa ham yakunlanadi, necha kun farqi ko'rsatiladi va xabar yuboriladi.",
      "Tasdiqlangan dizayn montajnikka va ishchilar guruhiga; yangi o'lchov dizaynerga alohida va guruhga rasm bilan yuboriladi.",
      "Botdan foydalanish bo'yicha rasmli qo'llanma (5 sahifa) — botda /qollanma yoki Sozlamalardan hammaga yuborish."
    ]
  },
  {
    version: "2026.10.10",
    date: "2026-10-10",
    title: "Yangi dizayn va aniqroq hisob-kitob",
    items: [
      "Butun dastur yangi, zamonaviy dizaynga o'tkazildi: kunduzgi va tungi rejim, kompyuterda doimiy yon menyu, telefonda qulay ko'rinish.",
      "Kunduzgi rejimda kiritish maydonlari ko'rinmay qolishi tuzatildi.",
      "Diagrammalar qayta chizildi: aniq o'qiladigan ranglar, ustun ustiga olib borsangiz aniq summa chiqadi.",
      "Xarajatda \"Pul qaysi zakazdan olindi\" maydoni: bir zakaz puli boshqa zakazga ishlatilsa, xarajat to'g'ri zakazga yoziladi va zakazlar orasidagi qarz alohida ko'rsatiladi.",
      "Izohida boshqa zakaz nomi bor xarajatlar \"tekshiring\" belgisi bilan ajratiladi.",
      "Zakazlar jadvalida foyda (summa − xarajat − avans) va kassa qoldig'i (tushgan − sarflangan) alohida ko'rsatiladi.",
      "Ta'sischi ulushidan ortiq avans olsa yoki oy zarar bilan yopilsa, hisob endi 0 emas, manfiy (qizil) ko'rsatiladi: qancha qaytarishi kerakligi aniq yoziladi.",
      "Ishchilarga hali to'lanmagan oylik ta'sischilar fondidan ayriladi: ishchilarga tegishli pul ta'sischilarga bo'linib ketmaydi.",
      "Qolgan oylik har bir ishchi uchun alohida hisoblanadi: birining ortiqcha olgani boshqasining qarzini yashirmaydi.",
      "Ta'sischilar foizi 100% dan kam bo'lsa, qolgan qism \"kompaniyada qoladi\" deb ko'rsatiladi.",
      "Xarajatlar diagrammasiga \"Boshqa\" va \"Ishchi oyligi\" turlari qo'shildi (avval tushib qolardi)."
    ]
  },
  {
    version: "2026.10.09",
    date: "2026-10-09",
    title: "Hisob-kitob aniqligi va ma'lumot xavfsizligi",
    items: [
      "Yangi \"Yangiliklar\" bo'limi: dastur yangilanishlari va kim, qachon, nimani o'zgartirgani shu yerda ko'rinadi.",
      "Ikki foydalanuvchi bir vaqtda saqlaganda bir-birining yozuvini o'chirib yuborishi to'xtatildi: endi eskirgan sahifadan saqlansa, ma'lumot yangilanadi va qayta kiritish so'raladi.",
      "Server javob bermay qolganda bo'sh sahifadan saqlab, bazani tozalab yuborish xavfi yopildi.",
      "Sana Toshkent vaqti bo'yicha olinadi: tun 00:00–05:00 oralig'ida kiritilgan to'lov va xarajatlar endi kechagi kunga yozilmaydi.",
      "Summa kiritish: \"1.500.000\", \"1 500 000\" va \"1,500,000\" to'g'ri o'qiladi; noto'g'ri summa jimgina 0 yoki 500 bo'lib qolmaydi, xato ko'rsatiladi.",
      "O'tgan oydan qarzi bilan ko'chgan zakaz ta'sischilar fondi, soliq va zaxirada ikkinchi marta hisoblanmaydi.",
      "Ko'chgan zakazning asl summasi va to'langan qismi saqlanadi.",
      "Hisobotlarda ta'sischi avansi xarajatga qo'shilmaydi, alohida ustunda ko'rsatiladi. Sof foyda shunga ko'ra to'g'rilandi.",
      "\"To'lov turlari\" diagrammasi zakaz summasi bo'yicha emas, haqiqatda tushgan to'lovlar bo'yicha chiziladi.",
      "O'chirishdan oldin tasdiq so'raladi; saqlanmasa, o'zgarish ekranda qolib ketmaydi.",
      "Xavfsizlik: standart super admin paroli o'chirildi, Google orqali begona akkaunt avtomatik admin bo'lmaydi, login xabarlari foydalanuvchi borligini oshkor qilmaydi.",
      "Firebase brauzer kutubxonasi olib tashlandi: tashqi CDN ishlamasa ham sahifa ochiladi."
    ]
  },
  {
    version: "2026.10.06",
    date: "2026-10-06",
    title: "Telegram bot va telefon orqali kirish",
    items: [
      "Telefon raqami va parol bilan kirish (+998 90 123 45 67, 998901234567 va 901234567 bir xil hisoblanadi).",
      "Telegram bot: xodim /start bosib telefonini yuboradi, xabarlar bo'lim ruxsatlariga qarab keladi.",
      "Montajnikka faqat tasdiqlangan dizayn rasmi, o'lchami va montaj vazifasi yuboriladi.",
      "To'lovlar bo'limida MAX tugmasi zakazning qolgan qarzini kiritadi."
    ]
  }
];
