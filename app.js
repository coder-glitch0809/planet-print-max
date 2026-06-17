// Firebase configuration - replace with your config
    const firebaseConfig = {
      apiKey: "AIzaSyDemoReplaceWithRealKey",
      authDomain: "planet-print-94419.firebaseapp.com",
      projectId: "planet-print-94419",
      storageBucket: "planet-print-94419.appspot.com",
      messagingSenderId: "109297506818143954418",
      appId: "1:109297506818143954418:web:replacewithrealappid"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

const TOKEN_KEY = "pp_token_v1";
    const THEME_KEY = "pp_theme_v3";
    let needsSetup = false;

    const EXPENSE_LABEL = {
      banner: "Banner",
      arakal: "Arakal",
      rezka: "Rezka",
      reyka: "Reyka",
      dostavka: "Dostavka",
      zapravka: "Zapravka",
      suv: "Suv",
      boshqa: "Boshqa",
      oylik_avans: "Oylik maosh avansi",
      founder_avans: "Ta'sischi avansi"
    };
    const REAL_EXPENSE_TYPES = ["banner", "arakal", "rezka", "reyka", "dostavka", "zapravka", "suv", "boshqa", "oylik_avans"];
    const EXPENSE_PAYMENT_LABEL = {
      naqd: "Naqd",
      klik: "Klik",
      shot: "Shot (kartadan yechilgan)"
    };

    const ALL_PERMS = ["dashboard", "projects", "workers", "founders", "expenses", "settings"];
    const PAGE_TITLES = {
      dashboard: "Dashboard",
      projects: "Loyihalar",
      workers: "Ishchilar",
      founders: "Ta'sischilar",
      expenses: "Xarajatlar",
      archive: "Arxiv",
      users: "Foydalanuvchilar",
      settings: "Sozlamalar"
    };
    const CLIENT_PAGE_TITLES = { projects: "Zakazlarim" };

    const editState = { projectId: null, workerId: null, founderId: null, expenseId: null };

    const state = {
      finance: { projects: [], workers: [], founders: [], expenses: [], archives: [], payment: { locked: false, currentMonth: "", lastPaidMonth: "" }, settings: { tax: 0, reserve: 0, other: 0 } },
      users: [],
      currentUser: null
    };

    const el = {
      authSection: document.getElementById("authSection"),
      setupBox: document.getElementById("setupBox"),
      loginBox: document.getElementById("loginBox"),
  setupForm: document.getElementById("setupForm"),
  setupUser: document.getElementById("setupUser"),
  setupEmail: document.getElementById("setupEmail"),
  setupPass: document.getElementById("setupPass"),
  setupShow: document.getElementById("setupShow"),
  setupMsg: document.getElementById("setupMsg"),
  loginForm: document.getElementById("loginForm"),
  loginUser: document.getElementById("loginUser"),
  loginPass: document.getElementById("loginPass"),
      loginShow: document.getElementById("loginShow"),
      loginMsg: document.getElementById("loginMsg"),
  googleBtn: document.getElementById("googleBtn"),
      appSection: document.getElementById("appSection"),
      sidebar: document.getElementById("sidebar"),
      sidebarBackdrop: document.getElementById("sidebarBackdrop"),
      menuBtn: document.getElementById("menuBtn"),
      sidebarCloseBtn: document.getElementById("sidebarCloseBtn"),
      welcomeLine: document.getElementById("welcomeLine"),
      userBadge: document.getElementById("userBadge"),
      timeBadge: document.getElementById("timeBadge"),
      pageHeading: document.getElementById("pageHeading"),
      themeBtn: document.getElementById("themeBtn"),
      logoutBtn: document.getElementById("logoutBtn"),
      loginBtn: document.getElementById("loginBtn"),
      tabs: document.getElementById("tabs"),
      pages: Array.from(document.querySelectorAll(".page")),
      kpiGrid: document.getElementById("kpiGrid"),
      calcCenter: document.getElementById("calcCenter"),
      projectAlerts: document.getElementById("projectAlerts"),
      projectPageAlerts: document.getElementById("projectPageAlerts"),
      formulaList: document.getElementById("formulaList"),
      checkList: document.getElementById("checkList"),
      paymentChart: document.getElementById("paymentChart"),
      expenseChart: document.getElementById("expenseChart"),
      founderChart: document.getElementById("founderChart"),
      paymentLegend: document.getElementById("paymentLegend"),
      expenseLegend: document.getElementById("expenseLegend"),
      founderLegend: document.getElementById("founderLegend"),

      projectForm: document.getElementById("projectForm"),
      pName: document.getElementById("pName"), pClient: document.getElementById("pClient"),
      pClientLogin: document.getElementById("pClientLogin"),
      pStart: document.getElementById("pStart"), pDue: document.getElementById("pDue"),
      pAmount: document.getElementById("pAmount"), pAdvance: document.getElementById("pAdvance"),
      pType: document.getElementById("pType"), pStatus: document.getElementById("pStatus"),
      projectSubmitBtn: document.getElementById("projectSubmitBtn"),
      projectCancelEdit: document.getElementById("projectCancelEdit"),
      projectReset: document.getElementById("projectReset"), projectMsg: document.getElementById("projectMsg"),
      projectsHead: document.getElementById("projectsHead"),
      projectsBody: document.getElementById("projectsBody"),

      workerForm: document.getElementById("workerForm"),
      wName: document.getElementById("wName"), wRole: document.getElementById("wRole"), wSalary: document.getElementById("wSalary"),
      workerSubmitBtn: document.getElementById("workerSubmitBtn"),
      workerCancelEdit: document.getElementById("workerCancelEdit"),
      workerReset: document.getElementById("workerReset"), workerMsg: document.getElementById("workerMsg"),
      workersBody: document.getElementById("workersBody"),

      founderForm: document.getElementById("founderForm"),
      fName: document.getElementById("fName"), fShare: document.getElementById("fShare"), fNote: document.getElementById("fNote"),
      founderSubmitBtn: document.getElementById("founderSubmitBtn"),
      founderCancelEdit: document.getElementById("founderCancelEdit"),
      founderReset: document.getElementById("founderReset"), founderMsg: document.getElementById("founderMsg"),
      foundersBody: document.getElementById("foundersBody"),
      founderCalcList: document.getElementById("founderCalcList"),

      expenseForm: document.getElementById("expenseForm"),
      eDate: document.getElementById("eDate"), eType: document.getElementById("eType"), eAmount: document.getElementById("eAmount"),
      ePaymentType: document.getElementById("ePaymentType"), eNote: document.getElementById("eNote"),
      eWorkerWrap: document.getElementById("eWorkerWrap"), eWorkerId: document.getElementById("eWorkerId"),
      eFounderWrap: document.getElementById("eFounderWrap"), eFounderId: document.getElementById("eFounderId"),
      expenseSubmitBtn: document.getElementById("expenseSubmitBtn"),
      expenseCancelEdit: document.getElementById("expenseCancelEdit"),
      expenseReset: document.getElementById("expenseReset"), expenseMsg: document.getElementById("expenseMsg"),
      expensesBody: document.getElementById("expensesBody"),
      archiveBody: document.getElementById("archiveBody"),
      archiveSummary: document.getElementById("archiveSummary"),
      paymentLock: document.getElementById("paymentLock"),
      paymentLockTitle: document.getElementById("paymentLockTitle"),
      paymentLockText: document.getElementById("paymentLockText"),
      markPaidBtn: document.getElementById("markPaidBtn"),
      paymentLockMsg: document.getElementById("paymentLockMsg"),

  userForm: document.getElementById("userForm"),
  uName: document.getElementById("uName"), uEmail: document.getElementById("uEmail"), uPass: document.getElementById("uPass"), uShowPass: document.getElementById("uShowPass"),
      uRole: document.getElementById("uRole"), permGrid: document.getElementById("permGrid"), userMsg: document.getElementById("userMsg"), usersBody: document.getElementById("usersBody"),

      sTax: document.getElementById("sTax"), sReserve: document.getElementById("sReserve"), sOther: document.getElementById("sOther"),
      saveSettings: document.getElementById("saveSettings"), clearData: document.getElementById("clearData"), settingsMsg: document.getElementById("settingsMsg")
    };

    const fmt = (v) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(Math.round(Number(v) || 0)) + " UZS";
    const clean = (t) => String(t || "").replace(/[<>"'`]/g, "").trim();
    const num = (v) => {
      const n = Number(String(v ?? "").replace(/\s/g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    const uid = () => Math.random().toString(36).slice(2, 10);
    const today = () => new Date().toISOString().slice(0, 10);

    function msg(node, text, cls) { node.className = "msg " + (cls || ""); node.textContent = text || ""; }

    // Firebase-based API functions
    async function fetchJson(path, options = {}, timeoutMs = 20000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(path, { ...options, signal: controller.signal });
        const data = await resp.json().catch(() => ({}));
        return { resp, data };
      } finally {
        clearTimeout(timer);
      }
    }

    async function apiRequest(path, options = {}, auth = true) {
      // For now, use server API - Firebase client will be added for direct access
      const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
      if (auth) {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const { resp, data } = await fetchJson(path, { ...options, headers });
      if (!resp.ok) throw new Error(data.error || "Server xatoligi");
      return data;
    }

    // Exchange Firebase ID token (from Google sign-in) for server JWT
    async function exchangeGoogleIdToken(idToken) {
      const resp = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Exchange failed');
      return data;
    }

    async function loadFinance() {
      try {
        const data = await apiRequest("/api/finance");
        const saved = data.finance || {};
        state.finance.projects = Array.isArray(saved.projects) ? saved.projects : [];
        state.finance.workers = Array.isArray(saved.workers) ? saved.workers : [];
        state.finance.founders = Array.isArray(saved.founders) ? saved.founders : [];
        state.finance.expenses = Array.isArray(saved.expenses) ? saved.expenses : [];
        state.finance.archives = Array.isArray(saved.archives) ? saved.archives : [];
        state.finance.payment = saved.payment && typeof saved.payment === "object" ? saved.payment : { locked: false, currentMonth: "", lastPaidMonth: "" };
        state.finance.settings = { tax: num(saved.settings?.tax), reserve: num(saved.settings?.reserve), other: num(saved.settings?.other) };
      } catch {
        state.finance = { projects: [], workers: [], founders: [], expenses: [], archives: [], payment: { locked: false, currentMonth: "", lastPaidMonth: "" }, settings: { tax: 0, reserve: 0, other: 0 } };
      }
    }
    async function saveFinance() {
      try {
        await apiRequest("/api/finance", { method: "PUT", body: JSON.stringify({ finance: state.finance }) });
        return true;
      } catch (e) {
        console.error("Server save finance error:", e);
        return false;
      }
    }
    async function loadUsers() {
      try {
        const data = await apiRequest("/api/users");
        state.users = Array.isArray(data.users) ? data.users : [];
      } catch {
        state.users = [];
      }
    }

    function defaultPermsByRole(role) {
      if (role === "admin") return ["dashboard", "projects", "workers", "founders", "expenses", "settings"];
      if (role === "manager") return ["dashboard", "projects", "workers", "founders", "expenses"];
      if (role === "client") return ["projects"];
      return ["dashboard"];
    }
    function hasPerm(page) {
      if (!state.currentUser) return false;
      if (state.currentUser.role === "super_admin") return true;
      if (state.currentUser.role === "admin" && ALL_PERMS.includes(page)) return true;
      return (state.currentUser.permissions || []).includes(page);
    }
    function isSuperAdmin() {
      return state.currentUser?.role === "super_admin";
    }
    function isClientUser() {
      return state.currentUser?.role === "client";
    }
    function isPaymentLocked() {
      return !!state.finance.payment?.locked;
    }
    function blockIfPaymentLocked(node) {
      if (!isPaymentLocked() || isSuperAdmin()) return false;
      msg(node, "To'lov sanasi. Super admin 'To'lov qilindi' demaguncha amal bajarilmaydi.", "err");
      return true;
    }
    function canEditProjects() {
      return hasPerm("projects") && !isClientUser() && state.currentUser?.role !== "viewer";
    }
    function pageTitle(page) {
      return isClientUser() && CLIENT_PAGE_TITLES[page] ? CLIENT_PAGE_TITLES[page] : (PAGE_TITLES[page] || "Planet Print");
    }

    function setSidebar(open) {
      el.appSection.classList.toggle("sidebar-open", open);
      el.menuBtn?.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-locked", open);
    }

    function setLoginPending(pending) {
      el.loginBtn.disabled = pending;
      el.loginBtn.classList.toggle("is-loading", pending);
    }

    function showLoginError(text) {
      el.loginBox.classList.remove("has-error");
      void el.loginBox.offsetWidth;
      el.loginBox.classList.add("has-error");
      msg(el.loginMsg, text, "err");
    }

    function setTheme(name) {
      const dark = name === "dark";
      document.body.classList.toggle("dark", dark);
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
      el.themeBtn.textContent = dark ? "Dark Mode" : "Light Mode";
      drawCharts();
    }

    function renderPermGrid() {
      el.permGrid.innerHTML = ALL_PERMS.map((p) => `<label class="perm-item"><input type="checkbox" data-perm="${p}" checked /> ${PAGE_TITLES[p]}</label>`).join("");
    }
    function renderTabs() {
      const base = ["dashboard", "projects", "workers", "founders", "expenses", "archive", "settings"];
      const visible = base.filter(hasPerm);
      if (!isClientUser() && !visible.includes("archive") && (isSuperAdmin() || hasPerm("dashboard") || hasPerm("projects") || hasPerm("expenses"))) visible.splice(Math.max(visible.length - 1, 0), 0, "archive");
      if (state.currentUser.role === "super_admin") visible.splice(visible.length - 1, 0, "users");
      el.tabs.innerHTML = visible.map((p, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-page="${p}">${pageTitle(p)}</button>`).join("");
      el.pages.forEach((x) => x.classList.remove("active"));
      if (visible[0]) document.getElementById(visible[0]).classList.add("active");
      if (el.pageHeading) el.pageHeading.textContent = pageTitle(visible[0]) || "Dashboard";
      Array.from(el.tabs.querySelectorAll(".tab")).forEach((btn) => {
        btn.addEventListener("click", () => {
          const page = btn.getAttribute("data-page");
          Array.from(el.tabs.querySelectorAll(".tab")).forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          el.pages.forEach((x) => x.classList.remove("active"));
          document.getElementById(page).classList.add("active");
          if (el.pageHeading) el.pageHeading.textContent = pageTitle(page);
          setSidebar(false);
          drawCharts();
        });
      });
    }

    function openDashboard(user) {
      state.currentUser = {
        id: user?.id || "",
        username: user?.username || "user",
        role: user?.role || "viewer",
        permissions: Array.isArray(user?.permissions) ? user.permissions : ["dashboard"]
      };
      el.authSection.classList.add("hidden");
      el.appSection.classList.remove("hidden");
      setSidebar(false);
      el.appSection.classList.toggle("is-limited", !isSuperAdmin());
      el.userBadge.textContent = `User: ${state.currentUser.username} (${state.currentUser.role})`;
      el.timeBadge.textContent = new Date().toLocaleString("uz-UZ");
      el.welcomeLine.textContent = isClientUser() ? "Zakazlaringiz holati va topshirish muddati." : "Xush kelibsiz. Bu panel login orqali himoyalangan.";
      if (el.expenseReset) el.expenseReset.classList.toggle("hidden", !isSuperAdmin());
      if (el.clearData) el.clearData.classList.toggle("hidden", !isSuperAdmin());
      renderTabs();
      el.pages.forEach((x) => x.classList.remove("active"));
      const firstPage = el.tabs.querySelector(".tab")?.getAttribute("data-page") || "dashboard";
      document.getElementById(firstPage).classList.add("active");
      const firstTab = el.tabs.querySelector(`[data-page="${firstPage}"]`);
      if (firstTab) {
        Array.from(el.tabs.querySelectorAll(".tab")).forEach((b) => b.classList.remove("active"));
        firstTab.classList.add("active");
      }
      if (el.pageHeading) el.pageHeading.textContent = pageTitle(firstPage);
    }

    function workerAdvanceById() {
      const map = {};
      state.finance.expenses.forEach((e) => {
        if (e.type === "oylik_avans" && e.workerId) map[e.workerId] = (map[e.workerId] || 0) + num(e.amount);
      });
      return map;
    }
    function founderAdvanceById() {
      const map = {};
      state.finance.expenses.forEach((e) => {
        if (e.type === "founder_avans" && e.founderId) map[e.founderId] = (map[e.founderId] || 0) + num(e.amount);
      });
      return map;
    }

    function summary() {
      const totalAmount = state.finance.projects.reduce((a, p) => a + num(p.amount), 0);
      const totalAdvance = state.finance.projects.reduce((a, p) => a + num(p.advance), 0);
      const receivable = state.finance.projects.reduce((a, p) => a + Math.max(num(p.amount) - num(p.advance), 0), 0);

      const workerAvMap = workerAdvanceById();
      const salaryFundBase = state.finance.workers.reduce((a, w) => a + num(w.salary), 0);
      const workerAdvanceTotal = Object.values(workerAvMap).reduce((a, v) => a + v, 0);
      const salaryPayableNow = Math.max(salaryFundBase - workerAdvanceTotal, 0);

      const taxPercent = Math.min(Math.max(num(state.finance.settings.tax), 0), 100);
      const reservePercent = Math.min(Math.max(num(state.finance.settings.reserve), 0), 100);
      const tax = totalAmount * taxPercent / 100;
      const reserve = totalAmount * reservePercent / 100;
      const manualOther = Math.max(num(state.finance.settings.other), 0);
      const expenseByType = {};
      state.finance.expenses.forEach((e) => { expenseByType[e.type] = (expenseByType[e.type] || 0) + num(e.amount); });
      const expensePaymentByType = {};
      state.finance.expenses.forEach((e) => {
        if (EXPENSE_PAYMENT_LABEL[e.paymentType]) expensePaymentByType[e.paymentType] = (expensePaymentByType[e.paymentType] || 0) + num(e.amount);
      });
      const explicitExpense = REAL_EXPENSE_TYPES.reduce((a, t) => a + (expenseByType[t] || 0), 0);
      const totalRealExpenses = manualOther + tax + reserve + explicitExpense;

      const founderPoolRaw = totalAmount - totalRealExpenses;
      const founderPool = Math.max(founderPoolRaw, 0);
      const founderShareTotal = state.finance.founders.reduce((a, f) => a + num(f.share), 0);
      const founderAvMap = founderAdvanceById();
      const founderRows = state.finance.founders.map((f) => {
        const base = founderPool * num(f.share) / 100;
        const founderAdvance = founderAvMap[f.id] || 0;
        const final = Math.max(base - founderAdvance, 0);
        return { ...f, base, founderAdvance, final };
      });
      const founderAdvanceTotal = Object.values(founderAvMap).reduce((a, v) => a + v, 0);
      const overdueProjects = state.finance.projects.filter(p => liveStatus(p) === "Kechiktirilgan zakaz").length;
      const dueTodayProjects = state.finance.projects.filter(p => liveStatus(p) === "Topshirish vaqti").length;
      const completedProjects = state.finance.projects.filter(p => liveStatus(p) === "Yakunlangan").length;

      return {
        totalAmount, totalAdvance, receivable, salaryFundBase, workerAdvanceTotal, salaryPayableNow,
        tax, reserve, manualOther, expenseByType, expensePaymentByType, explicitExpense, totalRealExpenses,
        founderPoolRaw, founderPool, founderShareTotal, founderRows, founderAdvanceTotal,
        overdueProjects, dueTodayProjects, completedProjects
      };
    }

    function liveStatus(p) {
      if (p.status === "Yakunlangan") return "Yakunlangan";
      if (p.dueDate < today()) return "Kechiktirilgan zakaz";
      if (p.dueDate === today()) return "Topshirish vaqti";
      if (p.startDate <= today()) return "Jarayonda";
      return "Yangi";
    }
    function statusCls(s) {
      if (s === "Yakunlangan") return "pill s-done";
      if (s === "Jarayonda") return "pill s-progress";
      if (s === "Topshirish vaqti") return "pill s-due";
      if (s === "Kechiktirilgan zakaz") return "pill s-over";
      return "pill s-new";
    }

    function renderSummary() {
      const s = summary();
      const items = [
        { t: "Jami loyiha summasi", v: fmt(s.totalAmount), meta: `${state.finance.projects.length} ta loyiha`, cls: "income" },
        { t: "Mijoz avansi", v: fmt(s.totalAdvance), meta: `Qolgan to'lov: ${fmt(s.receivable)}`, cls: "cash" },
        { t: "Xarajatlar jami", v: fmt(s.totalRealExpenses), meta: `Xarajat bo'limi: ${fmt(s.explicitExpense)}`, cls: "warn-kpi" },
        { t: "Ishchi avansi", v: fmt(s.workerAdvanceTotal), meta: `Qolgan oylik: ${fmt(s.salaryPayableNow)}`, cls: "neutral-kpi" },
        { t: "Muddat nazorati", v: `${s.overdueProjects} ta`, meta: `Bugun topshirish: ${s.dueTodayProjects} ta, yakunlangan: ${s.completedProjects} ta`, cls: s.overdueProjects ? "danger-kpi" : "cash" },
        { t: "Ta'sischi fondi", v: fmt(s.founderPool), meta: `Soliq ${fmt(s.tax)}, zaxira ${fmt(s.reserve)}, qo'lda ${fmt(s.manualOther)}`, cls: "profit-kpi" }
      ];
      el.kpiGrid.innerHTML = items.map(x => `<div class="kpi card ${x.cls}"><div><h3>${x.t}</h3><div class="v">${x.v}</div></div><div class="meta">${x.meta}</div></div>`).join("");
      el.formulaList.innerHTML = [
        `Loyiha summasi = ${fmt(s.totalAmount)}`,
        `Xarajatlar = Qo'lda (${fmt(s.manualOther)}) + Soliq (${fmt(s.tax)}) + Zaxira (${fmt(s.reserve)}) + Xarajat bo'limi (${fmt(s.explicitExpense)})`,
        `Ishchi avansi xarajatga kiradi va "Oylik maosh avansi" turida yuritiladi: ${fmt(s.workerAdvanceTotal)}`,
        `Ta'sischi avansi xarajat emas, ta'sischining ulushidan ayriladi: ${fmt(s.founderAdvanceTotal)}`,
        `Ta'sischilar fondi = ${fmt(s.totalAmount)} - ${fmt(s.totalRealExpenses)} = ${fmt(s.founderPoolRaw)} (manfiy bo'lsa 0)`
      ].map(x => `<li>${x}</li>`).join("");
      el.checkList.classList.add("check-list");
      el.checkList.innerHTML = [
        `<li>Loyihalar soni: ${state.finance.projects.length}</li>`,
        `<li>Bugun topshirish vaqti kelgan: ${s.dueTodayProjects}</li>`,
        `<li>Kechiktirilgan zakaz: ${s.overdueProjects}</li>`,
        `<li>Xarajat to'lovlari: Naqd ${fmt(s.expensePaymentByType.naqd || 0)}, Klik ${fmt(s.expensePaymentByType.klik || 0)}, Shot ${fmt(s.expensePaymentByType.shot || 0)}</li>`,
        `<li>Ta'sischilar foizi jami: ${s.founderShareTotal.toFixed(2)}%</li>`,
        `<li>Qolgan oylik jami: ${fmt(s.salaryPayableNow)}</li>`
      ].join("");
      if (s.founderShareTotal > 100) el.checkList.innerHTML += `<li style="color:#b42318;">Diqqat: foiz 100% dan oshgan.</li>`;
    }

    function renderProjectAlerts() {
      const alerts = state.finance.projects
        .map((p) => ({ project: p, status: liveStatus(p) }))
        .filter((item) => item.status === "Topshirish vaqti" || item.status === "Kechiktirilgan zakaz")
        .map((item) => {
          const cls = item.status === "Topshirish vaqti" ? "today" : "overdue";
          const text = item.status === "Topshirish vaqti"
            ? `${clean(item.project.name)} zakazini bugun topshirish vaqti.`
            : `${clean(item.project.name)} kechiktirilgan zakaz sifatida turibdi.`;
          return `<div class="alert-card ${cls}"><strong>${item.status}</strong><br>${text}</div>`;
        })
        .join("");
      if (el.projectAlerts) el.projectAlerts.innerHTML = isSuperAdmin() ? alerts : "";
      if (el.projectPageAlerts) el.projectPageAlerts.innerHTML = alerts;
    }

    function setFormEditMode(form, submitBtn, cancelBtn, on) {
      submitBtn.textContent = on ? "Saqlash" : submitBtn.getAttribute("data-default");
      cancelBtn.classList.toggle("hidden", !on);
    }

    function renderProjects() {
      const clientView = isClientUser();
      el.projectForm.classList.toggle("hidden", !canEditProjects());
      if (clientView) {
        el.projectsHead.innerHTML = `<tr><th>Nomi</th><th>Mijoz</th><th>Olingan</th><th>Topshirish</th><th>Holat</th></tr>`;
      } else {
        el.projectsHead.innerHTML = `<tr><th>Nomi</th><th>Mijoz</th><th>Zakazchi login</th><th>Olingan</th><th>Topshirish</th><th>Summa</th><th>Advance</th><th>Qolgan</th><th>To'lov</th><th>Holat</th><th>Amal</th></tr>`;
      }
      if (!state.finance.projects.length) {
        el.projectsBody.innerHTML = `<tr><td colspan="${clientView ? 5 : 11}">${clientView ? "Sizga biriktirilgan zakaz yo'q." : "Hozircha loyiha yo'q."}</td></tr>`;
        return;
      }
      el.projectsBody.innerHTML = state.finance.projects.map((p) => {
        const remain = Math.max(num(p.amount) - num(p.advance), 0);
        const s = liveStatus(p);
        if (clientView) {
          return `<tr>
            <td>${clean(p.name)}</td><td>${clean(p.client || state.currentUser.username)}</td><td>${clean(p.startDate)}</td><td>${clean(p.dueDate)}</td>
            <td><span class="${statusCls(s)}">${s}</span></td>
          </tr>`;
        }
        return `<tr>
          <td>${clean(p.name)}</td><td>${clean(p.client)}</td><td>${clean(p.clientLogin || "-")}</td><td>${clean(p.startDate)}</td><td>${clean(p.dueDate)}</td>
          <td>${fmt(p.amount)}</td><td>${fmt(p.advance)}</td><td>${fmt(remain)}</td><td>${clean(p.paymentType)}</td>
          <td><span class="${statusCls(s)}">${s}</span></td>
          <td>
            <button class="ghost small-btn" type="button" data-edit-p="${p.id}">Tahrirlash</button>
            <button class="danger small-btn" type="button" data-del-p="${p.id}">O'chirish</button>
          </td>
        </tr>`;
      }).join("");
      Array.from(el.projectsBody.querySelectorAll("[data-del-p]")).forEach((b) => b.addEventListener("click", () => {
        state.finance.projects = state.finance.projects.filter(p => p.id !== b.getAttribute("data-del-p"));
        saveFinance(); refreshAll();
      }));
      Array.from(el.projectsBody.querySelectorAll("[data-edit-p]")).forEach((b) => b.addEventListener("click", () => {
        const p = state.finance.projects.find(x => x.id === b.getAttribute("data-edit-p")); if (!p) return;
        editState.projectId = p.id;
        el.pName.value = p.name; el.pClient.value = p.client; el.pStart.value = p.startDate; el.pDue.value = p.dueDate;
        el.pClientLogin.value = p.clientLogin || "";
        el.pAmount.value = p.amount; el.pAdvance.value = p.advance; el.pType.value = p.paymentType; el.pStatus.value = p.status;
        setFormEditMode(el.projectForm, el.projectSubmitBtn, el.projectCancelEdit, true);
      }));
    }

    function renderWorkers() {
      const avMap = workerAdvanceById();
      if (!state.finance.workers.length) { el.workersBody.innerHTML = `<tr><td colspan="6">Hozircha ishchi yo'q.</td></tr>`; return; }
      el.workersBody.innerHTML = state.finance.workers.map((w) => {
        const av = avMap[w.id] || 0;
        const remain = Math.max(num(w.salary) - av, 0);
        return `<tr>
          <td>${clean(w.name)}</td><td>${clean(w.role)}</td><td>${fmt(w.salary)}</td><td>${fmt(av)}</td><td>${fmt(remain)}</td>
          <td>
            <button class="ghost small-btn" type="button" data-edit-w="${w.id}">Tahrirlash</button>
            <button class="danger small-btn" type="button" data-del-w="${w.id}">O'chirish</button>
          </td>
        </tr>`;
      }).join("");
      Array.from(el.workersBody.querySelectorAll("[data-del-w]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-w");
        state.finance.workers = state.finance.workers.filter(w => w.id !== id);
        state.finance.expenses = state.finance.expenses.filter(e => e.workerId !== id);
        saveFinance(); refreshAll();
      }));
      Array.from(el.workersBody.querySelectorAll("[data-edit-w]")).forEach((b) => b.addEventListener("click", () => {
        const w = state.finance.workers.find(x => x.id === b.getAttribute("data-edit-w")); if (!w) return;
        editState.workerId = w.id;
        el.wName.value = w.name; el.wRole.value = w.role; el.wSalary.value = w.salary;
        setFormEditMode(el.workerForm, el.workerSubmitBtn, el.workerCancelEdit, true);
      }));
    }

    function renderFounders() {
      const s = summary();
      const finalTotal = s.founderRows.reduce((a, f) => a + num(f.final), 0);
      el.founderCalcList.innerHTML = [
        `<li>Loyiha summasi: ${fmt(s.totalAmount)}</li>`,
        `<li>Soliq: ${fmt(s.tax)}</li>`,
        `<li>Zaxira: ${fmt(s.reserve)}</li>`,
        `<li>Qo'lda kiritilgan umumiy xarajat: ${fmt(s.manualOther)}</li>`,
        `<li>Xarajat bo'limi jami: ${fmt(s.explicitExpense)}</li>`,
        `<li>Ta'sischilar fondi (xarajatlardan keyin): ${fmt(s.founderPool)}</li>`,
        `<li>Ta'sischilar avansi jami: ${fmt(s.founderAdvanceTotal)}</li>`,
        `<li>Yakuniy bo'linadigan summa: ${fmt(finalTotal)}</li>`,
        `<li>Nazorat: Har bir ta'sischi uchun yakuniy ulush = bazaviy ulush - shu ta'sischining avansi</li>`
      ].join("");
      if (!state.finance.founders.length) { el.foundersBody.innerHTML = `<tr><td colspan="7">Hozircha ta'sischi yo'q.</td></tr>`; return; }
      el.foundersBody.innerHTML = s.founderRows.map((f) => `<tr>
        <td>${clean(f.name)}</td><td>${num(f.share).toFixed(2)}%</td><td>${clean(f.note || "-")}</td>
        <td>${fmt(f.base)}</td><td>${fmt(f.founderAdvance)}</td><td>${fmt(f.final)}</td>
        <td>
          <button class="ghost small-btn" type="button" data-edit-f="${f.id}">Tahrirlash</button>
          <button class="danger small-btn" type="button" data-del-f="${f.id}">O'chirish</button>
        </td>
      </tr>`).join("");
      Array.from(el.foundersBody.querySelectorAll("[data-del-f]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-f");
        state.finance.founders = state.finance.founders.filter(f => f.id !== id);
        state.finance.expenses = state.finance.expenses.filter(e => e.founderId !== id);
        saveFinance(); refreshAll();
      }));
      Array.from(el.foundersBody.querySelectorAll("[data-edit-f]")).forEach((b) => b.addEventListener("click", () => {
        const f = state.finance.founders.find(x => x.id === b.getAttribute("data-edit-f")); if (!f) return;
        editState.founderId = f.id;
        el.fName.value = f.name; el.fShare.value = f.share; el.fNote.value = f.note || "";
        setFormEditMode(el.founderForm, el.founderSubmitBtn, el.founderCancelEdit, true);
      }));
    }

    function fillExpenseRelatedSelects() {
      el.eWorkerId.innerHTML = state.finance.workers.map(w => `<option value="${w.id}">${clean(w.name)} (${clean(w.role)})</option>`).join("");
      el.eFounderId.innerHTML = state.finance.founders.map(f => `<option value="${f.id}">${clean(f.name)}</option>`).join("");
    }
    function toggleExpenseTypeInputs() {
      const t = el.eType.value;
      el.eWorkerWrap.classList.toggle("hidden", t !== "oylik_avans");
      el.eFounderWrap.classList.toggle("hidden", t !== "founder_avans");
    }

    function renderExpenses() {
      if (!state.finance.expenses.length) { el.expensesBody.innerHTML = `<tr><td colspan="7">Hozircha xarajat yo'q.</td></tr>`; return; }
      el.expensesBody.innerHTML = state.finance.expenses.map((e) => {
        const worker = e.workerId ? state.finance.workers.find(w => w.id === e.workerId)?.name : "";
        const founder = e.founderId ? state.finance.founders.find(f => f.id === e.founderId)?.name : "";
        const target = worker || founder || "-";
        const paymentType = EXPENSE_PAYMENT_LABEL[e.paymentType] || (e.paymentType ? clean(e.paymentType) : "Ko'rsatilmagan");
        return `<tr>
          <td>${clean(e.date)}</td><td>${EXPENSE_LABEL[e.type] || clean(e.type)}</td><td>${fmt(e.amount)}</td><td>${paymentType}</td><td>${clean(target)}</td><td>${clean(e.note || "-")}</td>
          <td>
            <button class="ghost small-btn" type="button" data-edit-e="${e.id}">Tahrirlash</button>
            <button class="danger small-btn" type="button" data-del-e="${e.id}">O'chirish</button>
          </td>
        </tr>`;
      }).join("");
      Array.from(el.expensesBody.querySelectorAll("[data-del-e]")).forEach((b) => b.addEventListener("click", () => {
        state.finance.expenses = state.finance.expenses.filter(e => e.id !== b.getAttribute("data-del-e"));
        saveFinance(); refreshAll();
      }));
      Array.from(el.expensesBody.querySelectorAll("[data-edit-e]")).forEach((b) => b.addEventListener("click", () => {
        const e = state.finance.expenses.find(x => x.id === b.getAttribute("data-edit-e")); if (!e) return;
        editState.expenseId = e.id;
        el.eDate.value = e.date; el.eType.value = e.type; el.eAmount.value = e.amount; el.ePaymentType.value = e.paymentType || "naqd"; el.eNote.value = e.note || "";
        fillExpenseRelatedSelects(); toggleExpenseTypeInputs();
        if (e.workerId) el.eWorkerId.value = e.workerId;
        if (e.founderId) el.eFounderId.value = e.founderId;
        setFormEditMode(el.expenseForm, el.expenseSubmitBtn, el.expenseCancelEdit, true);
      }));
    }

    function archiveDebt(project) {
      return Math.max(num(project.amount) - num(project.advance), 0);
    }

    function renderArchives() {
      if (!el.archiveBody) return;
      const archives = state.finance.archives || [];
      const projectCount = archives.reduce((a, archive) => a + (Array.isArray(archive.projects) ? archive.projects.length : 0), 0);
      const openDebt = archives.reduce((sum, archive) => {
        return sum + (Array.isArray(archive.projects) ? archive.projects.reduce((a, p) => a + (p.debtClosed ? 0 : archiveDebt(p)), 0) : 0);
      }, 0);
      if (el.archiveSummary) {
        el.archiveSummary.textContent = `Arxiv davrlari: ${archives.length}. Loyiha: ${projectCount}. Yopilmagan qarz: ${fmt(openDebt)}.`;
      }
      if (!archives.length) {
        el.archiveBody.innerHTML = `<tr><td colspan="8">Hozircha arxiv yo'q.</td></tr>`;
        return;
      }

      const rows = [];
      archives.forEach((archive) => {
        const projects = Array.isArray(archive.projects) ? archive.projects : [];
        const expenses = Array.isArray(archive.expenses) ? archive.expenses : [];
        if (!projects.length) {
          rows.push(`<tr><td>${clean(archive.month)}</td><td colspan="7">Loyiha yo'q. Xarajatlar: ${expenses.length} ta.</td></tr>`);
        }
        projects.forEach((p) => {
          const debt = archiveDebt(p);
          const closed = p.debtClosed || debt <= 0;
          rows.push(`<tr>
            <td>${clean(archive.month)}</td>
            <td>${clean(p.name)}</td>
            <td>${clean(p.client)}</td>
            <td>${fmt(p.amount)}</td>
            <td>${fmt(p.advance)}</td>
            <td>${fmt(debt)}</td>
            <td><span class="${closed ? "pill s-done" : "pill s-over"}">${closed ? "Qarz yopilgan" : "Qarz ochiq"}</span></td>
            <td>${isSuperAdmin() && !closed ? `<button class="ghost small-btn" type="button" data-close-debt="${archive.id}|${p.id}">Qarz yopildi</button>` : "-"}</td>
          </tr>`);
        });
        rows.push(`<tr class="archive-expense-row"><td>${clean(archive.month)}</td><td colspan="7">Arxivlangan xarajatlar: ${expenses.length} ta, jami ${fmt(expenses.reduce((a, e) => a + num(e.amount), 0))}</td></tr>`);
      });

      el.archiveBody.innerHTML = rows.join("");
      Array.from(el.archiveBody.querySelectorAll("[data-close-debt]")).forEach((btn) => btn.addEventListener("click", async () => {
        const [archiveId, projectId] = String(btn.getAttribute("data-close-debt") || "").split("|");
        state.finance.archives = (state.finance.archives || []).map((archive) => {
          if (archive.id !== archiveId) return archive;
          return {
            ...archive,
            projects: (archive.projects || []).map((project) => project.id === projectId ? { ...project, debtClosed: true, debtClosedAt: new Date().toISOString() } : project)
          };
        });
        const ok = await saveFinance();
        if (ok) refreshAll();
      }));
    }

    function renderPaymentLock() {
      if (!el.paymentLock) return;
      const locked = isPaymentLocked();
      el.paymentLock.classList.toggle("hidden", !locked);
      el.appSection.classList.toggle("payment-is-locked", locked && !isSuperAdmin());
      if (!locked) {
        msg(el.paymentLockMsg, "", "");
        return;
      }
      const month = clean(state.finance.payment?.currentMonth || "");
      el.paymentLockTitle.textContent = "To'lov sanasi";
      el.paymentLockText.textContent = `${month ? month + " oyi uchun " : ""}5-sana to'lov kuni. Super admin to'lov qilindi deb belgilamaguncha tizim yopiq.`;
      el.markPaidBtn.classList.toggle("hidden", !isSuperAdmin());
    }

    function drawDonut(canvas, legendNode, items) {
      fitCanvas(canvas);
      const ctx = canvas.getContext("2d");
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const total = items.reduce((a, i) => a + i.value, 0);
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.34, inner = r * 0.6;
      if (!total) { ctx.fillStyle = "#3d5f4f"; ctx.font = "13px Segoe UI"; ctx.textAlign = "center"; ctx.fillText("Ma'lumot yo'q", cx, cy); legendNode.innerHTML = "<span>Ma'lumot yo'q</span>"; return; }
      let start = -Math.PI / 2;
      items.forEach((it) => {
        const a = (it.value / total) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + a); ctx.closePath(); ctx.fillStyle = it.color; ctx.fill(); start += a;
      });
      ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#214435"; ctx.font = "700 14px Segoe UI"; ctx.textAlign = "center"; ctx.fillText(fmt(total), cx, cy + 4);
      legendNode.innerHTML = items.map((it) => `<span><i class="dot" style="background:${it.color}"></i>${it.label}: ${fmt(it.value)}</span>`).join("");
    }
    function drawBars(canvas, legendNode, items, money = false) {
      fitCanvas(canvas);
      const ctx = canvas.getContext("2d");
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (!items.length || items.every(i => i.value <= 0)) {
        ctx.fillStyle = "#3d5f4f"; ctx.font = "13px Segoe UI"; ctx.textAlign = "center"; ctx.fillText("Ma'lumot yo'q", w / 2, h / 2); legendNode.innerHTML = "<span>Ma'lumot yo'q</span>"; return;
      }
      const left = 58, top = 22, right = 18, bottom = 50, cw = w - left - right, ch = h - top - bottom;
      const max = Math.max(...items.map(i => i.value), 1), bw = cw / items.length * 0.58;
      ctx.strokeStyle = "#d9e8e0"; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + ch); ctx.lineTo(left + cw, top + ch); ctx.stroke();
      items.forEach((it, i) => {
        const x = left + (i + 0.5) * (cw / items.length) - bw / 2, bh = (it.value / max) * ch, y = top + ch - bh;
        ctx.fillStyle = it.color; ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = "#1f4334"; ctx.font = "10px Segoe UI"; ctx.textAlign = "center";
        const t = money ? (it.value / 1000000).toFixed(1) + "m" : String(it.value);
        ctx.fillText(t, x + bw / 2, y - 4); ctx.fillStyle = "#355848"; ctx.fillText(it.label, x + bw / 2, top + ch + 15);
      });
      legendNode.innerHTML = items.map((it) => `<span><i class="dot" style="background:${it.color}"></i>${it.label}: ${money ? fmt(it.value) : it.value}</span>`).join("");
    }

    function fitCanvas(canvas) {
      const box = canvas.getBoundingClientRect();
      const width = Math.max(Math.round(box.width), 360);
      const height = Math.max(Math.round(box.height), 245);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    function drawCharts() {
      const s = summary();
      const byType = {};
      state.finance.projects.forEach((p) => { byType[p.paymentType] = (byType[p.paymentType] || 0) + num(p.amount); });
      drawDonut(el.paymentChart, el.paymentLegend, [
        { label: "Naqd", value: byType["Naqd"] || 0, color: "#0f7a56" },
        { label: "Karta", value: byType["Karta"] || 0, color: "#26a77a" },
        { label: "Bank", value: byType["Bank o'tkazma"] || 0, color: "#54c29f" },
        { label: "Aralash", value: byType["Aralash"] || 0, color: "#8edec4" }
      ]);
      const exp = s.expenseByType;
      drawBars(el.expenseChart, el.expenseLegend, [
        { label: "Banner", value: exp.banner || 0, color: "#4e89d8" },
        { label: "Arakal", value: exp.arakal || 0, color: "#6d9de0" },
        { label: "Rezka", value: exp.rezka || 0, color: "#8ab0e8" },
        { label: "Reyka", value: exp.reyka || 0, color: "#a7c4f0" },
        { label: "Dostavka", value: exp.dostavka || 0, color: "#62b890" },
        { label: "Zapravka", value: exp.zapravka || 0, color: "#f27c4b" },
        { label: "Suv", value: exp.suv || 0, color: "#28b3de" },
        { label: "Oylik Avans", value: exp.oylik_avans || 0, color: "#f0a428" }
      ], true);
      drawBars(el.founderChart, el.founderLegend, s.founderRows.map((f, i) => ({
        label: clean(f.name) || "T" + (i + 1),
        value: f.final,
        color: ["#0f7a56", "#26a77a", "#54c29f", "#7ad2b2", "#9fe2c6"][i % 5]
      })), true);
    }

    function renderUsersTable() {
      if (state.currentUser.role !== "super_admin") { el.usersBody.innerHTML = `<tr><td colspan="4">Faqat super admin ko'ra oladi.</td></tr>`; return; }
      el.usersBody.innerHTML = state.users.map((u) => `<tr>
        <td>${clean(u.username)}</td><td>${clean(u.role)}</td><td>${(u.permissions || []).join(", ") || "-"}</td>
        <td>${u.role === "super_admin" ? "-" : `<button class="danger small-btn" type="button" data-del-u="${u.id}">O'chirish</button>`}</td>
      </tr>`).join("");
      Array.from(el.usersBody.querySelectorAll("[data-del-u]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-u");
        apiRequest(`/api/users/${id}`, { method: "DELETE" })
          .then(async () => {
            await loadUsers();
            renderUsersTable();
          })
          .catch((err) => msg(el.userMsg, err.message, "err"));
      }));
    }

    function refreshAll() {
      fillExpenseRelatedSelects();
      renderSummary();
      renderProjectAlerts();
      renderProjects();
      renderWorkers();
      renderFounders();
      renderExpenses();
      renderArchives();
      renderUsersTable();
      renderPaymentLock();
      drawCharts();
      el.sTax.value = String(state.finance.settings.tax || "");
      el.sReserve.value = String(state.finance.settings.reserve || "");
      el.sOther.value = String(state.finance.settings.other || "");
    }

    function resetProjectForm() {
      editState.projectId = null;
      el.projectForm.reset();
      setFormEditMode(el.projectForm, el.projectSubmitBtn, el.projectCancelEdit, false);
      msg(el.projectMsg, "", "");
    }
    function resetWorkerForm() {
      editState.workerId = null;
      el.workerForm.reset();
      setFormEditMode(el.workerForm, el.workerSubmitBtn, el.workerCancelEdit, false);
      msg(el.workerMsg, "", "");
    }
    function resetFounderForm() {
      editState.founderId = null;
      el.founderForm.reset();
      setFormEditMode(el.founderForm, el.founderSubmitBtn, el.founderCancelEdit, false);
      msg(el.founderMsg, "", "");
    }
    function resetExpenseForm() {
      editState.expenseId = null;
      el.expenseForm.reset();
      el.eDate.value = today();
      toggleExpenseTypeInputs();
      setFormEditMode(el.expenseForm, el.expenseSubmitBtn, el.expenseCancelEdit, false);
      msg(el.expenseMsg, "", "");
    }

    function loginSuccess(user) {
      openDashboard(user);
      try {
        refreshAll();
      } catch (err) {
        console.error("Initial render error:", err);
      }
    }
    function logout() {
      localStorage.removeItem(TOKEN_KEY);
      state.currentUser = null;
      el.appSection.classList.add("hidden");
      setSidebar(false);
      el.authSection.classList.remove("hidden");
      el.loginForm.reset();
      msg(el.loginMsg, "", "");
      showAuthMode();
      // Sign out from Firebase
      auth.signOut().catch(console.error);
    }
    function showAuthMode() {
      el.setupBox.classList.toggle("hidden", !needsSetup);
      el.loginBox.classList.remove("hidden");
    }

    function wireAuth() {
  if (el.setupShow) el.setupShow.addEventListener("change", () => { el.setupPass.type = el.setupShow.checked ? "text" : "password"; });
  if (el.loginShow) el.loginShow.addEventListener("change", () => { el.loginPass.type = el.loginShow.checked ? "text" : "password"; });
  if (el.uShowPass) el.uShowPass.addEventListener("change", () => { el.uPass.type = el.uShowPass.checked ? "text" : "password"; });

      // Super admin yaratish server API orqali
      el.setupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = clean(el.setupUser.value), email = (el.setupEmail && el.setupEmail.value) ? el.setupEmail.value.trim() : '', password = el.setupPass.value;
        if (!username || password.length < 8) return msg(el.setupMsg, "Login kiriting va parol kamida 8 belgi bo'lsin.", "err");
        try {
          const resp = await fetch('/api/auth/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) return msg(el.setupMsg, data.error || 'Setup failed', 'err');
          needsSetup = false;
          msg(el.setupMsg, 'Super admin yaratildi. Endi login qiling.', 'ok');
          showAuthMode();
        } catch (err) {
          msg(el.setupMsg, err.message || String(err), 'err');
        }
      });

      // Login via server (email/password)
      el.loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = clean(el.loginUser.value), password = el.loginPass.value;
        el.loginBox.classList.remove("has-error");
        setLoginPending(true);
        msg(el.loginMsg, "Tekshirilmoqda...", "warn");
        try {
          const { resp, data } = await fetchJson('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          if (!resp.ok) return showLoginError(data.error || "Login yoki parol noto'g'ri.");
          localStorage.setItem(TOKEN_KEY, data.token);
          msg(el.loginMsg, "", "");
          openDashboard(data.user);
          await loadSessionData();
        } catch (err) {
          const text = err.name === "AbortError" ? "Server javob bermadi. Vercel/Firebase sozlamasini tekshiring." : (err.message || "Server bilan aloqa yo'q");
          showLoginError(text);
        } finally {
          setLoginPending(false);
        }
      });

      // Sign in with Google (client-side Firebase) then exchange idToken with server
      if (el.googleBtn) el.googleBtn.addEventListener('click', async () => {
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          const result = await auth.signInWithPopup(provider);
          const idToken = await result.user.getIdToken();
          const data = await exchangeGoogleIdToken(idToken);
          localStorage.setItem(TOKEN_KEY, data.token);
          await bootSession();
        } catch (err) {
          msg(el.loginMsg, err.message || String(err), 'err');
        }
      });
    }

    function wireCore() {
      [el.projectSubmitBtn, el.workerSubmitBtn, el.founderSubmitBtn, el.expenseSubmitBtn].forEach((b) => b.setAttribute("data-default", b.textContent));
      el.logoutBtn.addEventListener("click", logout);
      el.menuBtn.addEventListener("click", () => setSidebar(!el.appSection.classList.contains("sidebar-open")));
      el.sidebarCloseBtn.addEventListener("click", () => setSidebar(false));
      el.sidebarBackdrop.addEventListener("click", () => setSidebar(false));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setSidebar(false);
      });
      el.themeBtn.addEventListener("click", () => { setTheme((localStorage.getItem(THEME_KEY) || "light") === "light" ? "dark" : "light"); });
      el.eType.addEventListener("change", toggleExpenseTypeInputs);
      if (el.markPaidBtn) {
        el.markPaidBtn.addEventListener("click", async () => {
          if (!isSuperAdmin()) return;
          msg(el.paymentLockMsg, "Saqlanmoqda...", "warn");
          try {
            const data = await apiRequest("/api/payment/mark-paid", { method: "POST", body: JSON.stringify({}) });
            if (data.finance) {
              const saved = data.finance;
              state.finance.projects = Array.isArray(saved.projects) ? saved.projects : [];
              state.finance.workers = Array.isArray(saved.workers) ? saved.workers : [];
              state.finance.founders = Array.isArray(saved.founders) ? saved.founders : [];
              state.finance.expenses = Array.isArray(saved.expenses) ? saved.expenses : [];
              state.finance.archives = Array.isArray(saved.archives) ? saved.archives : [];
              state.finance.payment = saved.payment || { locked: false };
              state.finance.settings = { tax: num(saved.settings?.tax), reserve: num(saved.settings?.reserve), other: num(saved.settings?.other) };
            } else {
              await loadFinance();
            }
            msg(el.paymentLockMsg, "To'lov qilindi. Tizim ochildi.", "ok");
            refreshAll();
          } catch (err) {
            msg(el.paymentLockMsg, err.message || "To'lov holatini saqlashda xatolik.", "err");
          }
        });
      }

      el.projectForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.projectMsg)) return;
        const rec = {
          id: editState.projectId || uid(),
          name: clean(el.pName.value), client: clean(el.pClient.value), clientLogin: clean(el.pClientLogin.value).toLowerCase(),
          startDate: el.pStart.value, dueDate: el.pDue.value,
          amount: num(el.pAmount.value), advance: num(el.pAdvance.value), paymentType: clean(el.pType.value), status: clean(el.pStatus.value)
        };
        if (!rec.name || !rec.client || !rec.startDate || !rec.dueDate) return msg(el.projectMsg, "Majburiy maydonlarni to'ldiring.", "err");
        if (rec.dueDate < rec.startDate) return msg(el.projectMsg, "Topshirish muddati oldin bo'lishi mumkin emas.", "err");
        if (rec.amount <= 0 || rec.advance < 0 || rec.advance > rec.amount) return msg(el.projectMsg, "Summa/advance noto'g'ri.", "err");
        if (editState.projectId) state.finance.projects = state.finance.projects.map(p => p.id === rec.id ? rec : p);
        else state.finance.projects.unshift(rec);
        saveFinance(); resetProjectForm(); msg(el.projectMsg, "Loyiha saqlandi.", "ok"); refreshAll();
      });
      el.projectCancelEdit.addEventListener("click", resetProjectForm);
      el.projectReset.addEventListener("click", () => { el.projectForm.reset(); msg(el.projectMsg, "", ""); });

      el.workerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.workerMsg)) return;
        const rec = { id: editState.workerId || uid(), name: clean(el.wName.value), role: clean(el.wRole.value), salary: num(el.wSalary.value) };
        if (!rec.name || !rec.role || rec.salary <= 0) return msg(el.workerMsg, "Ma'lumotlarni to'g'ri kiriting.", "err");
        if (editState.workerId) state.finance.workers = state.finance.workers.map(w => w.id === rec.id ? rec : w);
        else state.finance.workers.unshift(rec);
        saveFinance(); resetWorkerForm(); msg(el.workerMsg, "Ishchi saqlandi.", "ok"); refreshAll();
      });
      el.workerCancelEdit.addEventListener("click", resetWorkerForm);
      el.workerReset.addEventListener("click", () => { el.workerForm.reset(); msg(el.workerMsg, "", ""); });

      el.founderForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.founderMsg)) return;
        const rec = { id: editState.founderId || uid(), name: clean(el.fName.value), share: num(el.fShare.value), note: clean(el.fNote.value) };
        if (!rec.name || rec.share <= 0) return msg(el.founderMsg, "Ism va foizni to'g'ri kiriting.", "err");
        const totalWithout = state.finance.founders.filter(f => f.id !== rec.id).reduce((a, f) => a + num(f.share), 0);
        if (totalWithout + rec.share > 100) return msg(el.founderMsg, "Jami foiz 100% dan oshib ketadi.", "err");
        if (editState.founderId) state.finance.founders = state.finance.founders.map(f => f.id === rec.id ? rec : f);
        else state.finance.founders.push(rec);
        saveFinance(); resetFounderForm(); msg(el.founderMsg, "Ta'sischi saqlandi.", "ok"); refreshAll();
      });
      el.founderCancelEdit.addEventListener("click", resetFounderForm);
      el.founderReset.addEventListener("click", () => { el.founderForm.reset(); msg(el.founderMsg, "", ""); });

      el.expenseForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.expenseMsg)) return;
        const rec = {
          id: editState.expenseId || uid(),
          date: el.eDate.value || today(),
          type: clean(el.eType.value),
          amount: num(el.eAmount.value),
          paymentType: clean(el.ePaymentType.value),
          note: clean(el.eNote.value),
          workerId: null,
          founderId: null
        };
        if (!rec.date || rec.amount <= 0) return msg(el.expenseMsg, "Sana va summa to'g'ri bo'lsin.", "err");
        if (!EXPENSE_PAYMENT_LABEL[rec.paymentType]) return msg(el.expenseMsg, "To'lov turini tanlang.", "err");
        if (rec.type === "oylik_avans") {
          rec.workerId = el.eWorkerId.value;
          if (!rec.workerId) return msg(el.expenseMsg, "Ishchini tanlang.", "err");
          const worker = state.finance.workers.find(w => w.id === rec.workerId);
          if (!worker) return msg(el.expenseMsg, "Ishchi topilmadi.", "err");
          const currentAdvance = workerAdvanceById()[worker.id] || 0;
          const oldAmount = editState.expenseId ? (state.finance.expenses.find(x => x.id === rec.id)?.amount || 0) : 0;
          if (currentAdvance - oldAmount + rec.amount > num(worker.salary)) return msg(el.expenseMsg, "Avans ishchi oyligidan oshib ketmoqda.", "err");
        }
        if (rec.type === "founder_avans") {
          rec.founderId = el.eFounderId.value;
          if (!rec.founderId) return msg(el.expenseMsg, "Ta'sischini tanlang.", "err");
        }
        if (editState.expenseId) state.finance.expenses = state.finance.expenses.map(x => x.id === rec.id ? rec : x);
        else state.finance.expenses.unshift(rec);
        saveFinance(); resetExpenseForm(); msg(el.expenseMsg, "Xarajat saqlandi.", "ok"); refreshAll();
      });
      el.expenseCancelEdit.addEventListener("click", resetExpenseForm);
      el.expenseReset.addEventListener("click", () => {
        if (!isSuperAdmin()) return msg(el.expenseMsg, "Tozalash faqat super admin uchun.", "err");
        resetExpenseForm();
      });

      el.userForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (state.currentUser.role !== "super_admin") return msg(el.userMsg, "Faqat super admin qo'sha oladi.", "err");
        const username = clean(el.uName.value), password = el.uPass.value, role = clean(el.uRole.value);
        if (!username || password.length < 8) return msg(el.userMsg, "Login kiriting, parol kamida 8 belgi.", "err");
        const checks = Array.from(el.permGrid.querySelectorAll("input[data-perm]:checked")).map(i => i.getAttribute("data-perm"));
        const permissions = role === "admin" ? checks : defaultPermsByRole(role);
        try {
          // Create user via server API (uses admin SDK)
          const token = localStorage.getItem(TOKEN_KEY);
          const email = (el.uEmail && el.uEmail.value) ? el.uEmail.value.trim() : '';
          const resp = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ username, email, password, role, permissions }) });
          const j = await resp.json().catch(() => ({}));
          if (!resp.ok) return msg(el.userMsg, j.error || 'Foydalanuvchi yaratishda xatolik', 'err');
          await loadUsers();
          el.userForm.reset();
          renderPermGrid();
          msg(el.userMsg, 'Foydalanuvchi qo\'shildi.', 'ok');
          renderUsersTable();
        } catch (err) {
          msg(el.userMsg, err.message || String(err), 'err');
        }
      });

      el.saveSettings.addEventListener("click", () => {
        if (blockIfPaymentLocked(el.settingsMsg)) return;
        const tax = num(el.sTax.value), reserve = num(el.sReserve.value), other = num(el.sOther.value);
        if (tax < 0 || reserve < 0 || other < 0 || tax > 100 || reserve > 100) return msg(el.settingsMsg, "Qiymatlar noto'g'ri.", "err");
        state.finance.settings = { tax, reserve, other };
        saveFinance(); msg(el.settingsMsg, "Sozlamalar saqlandi.", "ok"); refreshAll();
      });
      el.clearData.addEventListener("click", () => {
        if (!isSuperAdmin()) return msg(el.settingsMsg, "Barcha ma'lumotni tozalash faqat super admin uchun.", "err");
        if (!confirm("Barcha loyiha/ishchi/ta'sischi/xarajat ma'lumotlarini tozalaysizmi?")) return;
        state.finance = { projects: [], workers: [], founders: [], expenses: [], archives: state.finance.archives || [], payment: state.finance.payment || { locked: false }, settings: { tax: 0, reserve: 0, other: 0 } };
        saveFinance(); resetProjectForm(); resetWorkerForm(); resetFounderForm(); resetExpenseForm();
        msg(el.settingsMsg, "Barcha ma'lumotlar 0 qilindi.", "warn"); refreshAll();
      });
    }

    async function bootSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return false;
      try {
        const data = await apiRequest("/api/auth/me");
        state.currentUser = data.user;
        loginSuccess(data.user);
        await loadSessionData();
        return true;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        return false;
      }
    }

    async function loadSessionData() {
      try {
        if (state.currentUser?.role === "super_admin") await loadUsers();
        await loadFinance();
        refreshAll();
      } catch (err) {
        console.error("Session data load error:", err);
      }
    }

    async function init() {
      wireAuth();
      wireCore();
      renderPermGrid();
      setTheme(localStorage.getItem(THEME_KEY) || "light");
      el.eDate.value = today();
      toggleExpenseTypeInputs();
      await bootSession();

      // Check setup status from server (first-time super admin)
      try {
        const ss = await fetch('/api/auth/setup-status');
        const js = await ss.json();
        needsSetup = !!js.needsSetup;
      } catch (e) {
        needsSetup = false;
      }
      // Allow forcing the setup UI via URL param or hash: ?force_setup=1 or #setup
      try {
        const qs = new URLSearchParams(window.location.search);
        if (qs.get('force_setup') === '1' || window.location.hash === '#setup') {
          needsSetup = true;
        }
      } catch (e) {}
      showAuthMode();

      // Reveal setup link to toggle the setup panel (discreet control)
      const reveal = document.getElementById('revealSetupLink');
      if (reveal) {
        reveal.addEventListener('click', (ev) => {
          ev.preventDefault();
          needsSetup = !needsSetup;
          showAuthMode();
        });
      }
    }

    init();

