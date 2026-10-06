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
      oylik_tolov: "Ishchi oyligi",
      founder_avans: "Ta'sischi avansi"
    };
    const REAL_EXPENSE_TYPES = ["banner", "arakal", "rezka", "reyka", "dostavka", "zapravka", "suv", "boshqa", "oylik_tolov", "oylik_avans"];
    const EXPENSE_PAYMENT_LABEL = {
      naqd: "Naqd",
      klik: "Klik",
      shot: "Shot (kartadan yechilgan)"
    };

    const ALL_PERMS = ["dashboard", "projects", "designs", "workers", "founders", "expenses", "payments", "reports", "measurements", "settings"];
    const PAGE_TITLES = {
      dashboard: "Dashboard",
      projects: "Loyihalar",
      designs: "Dizaynlar",
      workers: "Ishchilar",
      founders: "Ta'sischilar",
      expenses: "Xarajatlar",
      payments: "To'lovlar",
      reports: "Hisobotlar",
      measurements: "O'lchovlar",
      archive: "Arxiv",
      users: "Foydalanuvchilar",
      settings: "Sozlamalar"
    };
    const CLIENT_PAGE_TITLES = { projects: "Zakazlarim" };
    const MONTH_LABELS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

    const editState = { projectId: null, workerId: null, founderId: null, expenseId: null };

    const state = {
      finance: { projects: [], payments: [], workers: [], founders: [], expenses: [], archives: [], measurements: [], designs: [], payment: { locked: false, reminder: false, currentMonth: "", lastPaidMonth: "" }, settings: { tax: 0, reserve: 0, other: 0 } },
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
      designForm: document.getElementById("designForm"),
      designProject: document.getElementById("designProject"),
      designImage: document.getElementById("designImage"),
      designNote: document.getElementById("designNote"),
      designDimensions: document.getElementById("designDimensions"),
      designApproved: document.getElementById("designApproved"),
      designSubmitBtn: document.getElementById("designSubmitBtn"),
      designMsg: document.getElementById("designMsg"),
      designsBody: document.getElementById("designsBody"),
      paymentForm: document.getElementById("paymentForm"),
      paymentDate: document.getElementById("paymentDate"),
      paymentProjectId: document.getElementById("paymentProjectId"),
      paymentAmount: document.getElementById("paymentAmount"),
      paymentType: document.getElementById("paymentType"),
      paymentNote: document.getElementById("paymentNote"),
      paymentMsg: document.getElementById("paymentMsg"),
      paymentsBody: document.getElementById("paymentsBody"),

      workerForm: document.getElementById("workerForm"),
      wName: document.getElementById("wName"), wRole: document.getElementById("wRole"), wSalary: document.getElementById("wSalary"),
      workerSubmitBtn: document.getElementById("workerSubmitBtn"),
      workerCancelEdit: document.getElementById("workerCancelEdit"),
      workerReset: document.getElementById("workerReset"), workerMsg: document.getElementById("workerMsg"),
      workersBody: document.getElementById("workersBody"),
      measurementForm: document.getElementById("measurementForm"),
      measurementDate: document.getElementById("measurementDate"),
      measurementClient: document.getElementById("measurementClient"),
      measurementProject: document.getElementById("measurementProject"),
      measurementAddress: document.getElementById("measurementAddress"),
      measurementWorker: document.getElementById("measurementWorker"),
      measurementPhoto: document.getElementById("measurementPhoto"),
      measurementSizes: document.getElementById("measurementSizes"),
      measurementNote: document.getElementById("measurementNote"),
      measurementSubmitBtn: document.getElementById("measurementSubmitBtn"),
      measurementMsg: document.getElementById("measurementMsg"),
      measurementsBody: document.getElementById("measurementsBody"),

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
      orderExpensesBody: document.getElementById("orderExpensesBody"),
      expenseAllocations: document.getElementById("expenseAllocations"),
      addAllocationBtn: document.getElementById("addAllocationBtn"),
      allocationTotal: document.getElementById("allocationTotal"),
      dashboardYear: document.getElementById("dashboardYear"),
      dashboardMonth: document.getElementById("dashboardMonth"),
      dashboardChartCaption: document.getElementById("dashboardChartCaption"),
      projectStatusSummary: document.getElementById("projectStatusSummary"),
      financeTrendChart: document.getElementById("financeTrendChart"),
      financeTrendLegend: document.getElementById("financeTrendLegend"),
      reportYear: document.getElementById("reportYear"),
      reportMonth: document.getElementById("reportMonth"),
      reportKpis: document.getElementById("reportKpis"),
      reportTrendChart: document.getElementById("reportTrendChart"),
      reportTrendLegend: document.getElementById("reportTrendLegend"),
      reportMonthsBody: document.getElementById("reportMonthsBody"),
      exportReportBtn: document.getElementById("exportReportBtn"),
      archiveBody: document.getElementById("archiveBody"),
      archiveSummary: document.getElementById("archiveSummary"),
      paymentLock: document.getElementById("paymentLock"),
      paymentLockTitle: document.getElementById("paymentLockTitle"),
      paymentLockText: document.getElementById("paymentLockText"),
      markPaidBtn: document.getElementById("markPaidBtn"),
      paymentLockMsg: document.getElementById("paymentLockMsg"),
      announcementForm: document.getElementById("announcementForm"),
      announcementText: document.getElementById("announcementText"),
      announcementMsg: document.getElementById("announcementMsg"),
      photoDialog: document.getElementById("photoDialog"),
      photoPreview: document.getElementById("photoPreview"),

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

    function applyFinanceSnapshot(saved) {
      state.finance.projects = Array.isArray(saved.projects) ? saved.projects : [];
      state.finance.payments = Array.isArray(saved.payments) ? saved.payments : [];
      state.finance.workers = Array.isArray(saved.workers) ? saved.workers : [];
      state.finance.founders = Array.isArray(saved.founders) ? saved.founders : [];
      state.finance.expenses = Array.isArray(saved.expenses) ? saved.expenses : [];
      state.finance.archives = Array.isArray(saved.archives) ? saved.archives : [];
      state.finance.measurements = Array.isArray(saved.measurements) ? saved.measurements : [];
      state.finance.designs = Array.isArray(saved.designs) ? saved.designs : [];
      state.finance.payment = saved.payment && typeof saved.payment === "object"
        ? saved.payment
        : { locked: false, reminder: false, currentMonth: "", lastPaidMonth: "" };
      state.finance.settings = { tax: num(saved.settings?.tax), reserve: num(saved.settings?.reserve), other: num(saved.settings?.other) };
    }

    async function loadFinance() {
      try {
        const data = await apiRequest("/api/finance");
        applyFinanceSnapshot(data.finance || {});
      } catch {
        state.finance = { projects: [], payments: [], workers: [], founders: [], expenses: [], archives: [], measurements: [], designs: [], payment: { locked: false, reminder: false, currentMonth: "", lastPaidMonth: "" }, settings: { tax: 0, reserve: 0, other: 0 } };
      }
    }
    async function saveFinance() {
      try {
        const result = await apiRequest("/api/finance", { method: "PUT", body: JSON.stringify({ finance: state.finance }) });
        if (result.warnings?.length) msg(el.announcementMsg, result.warnings.join(" "), "warn");
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
      if (role === "admin") return ["dashboard", "projects", "workers", "founders", "expenses", "payments", "reports", "measurements", "settings"];
      if (role === "manager") return ["dashboard", "projects", "designs", "workers", "founders", "expenses", "payments", "reports", "measurements"];
      if (role === "accountant") return ["payments", "expenses", "reports"];
      if (role === "designer") return ["designs"];
      if (role === "worker") return ["designs"];
      if (role === "client") return ["projects"];
      return ["dashboard"];
    }
    function hasPerm(page) {
      if (!state.currentUser) return false;
      if (state.currentUser.role === "super_admin") return true;
      
      
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
      return hasPerm("projects") && !isClientUser() && !["viewer", "designer", "worker"].includes(state.currentUser?.role);
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

    let editingUserId = null;
    function renderPermGrid(selected = defaultPermsByRole(el.uRole.value)) {
      el.permGrid.innerHTML = ALL_PERMS.map((p) => `<label class="perm-item"><input type="checkbox" data-perm="${p}" ${selected.includes(p) ? "checked" : ""} /> ${PAGE_TITLES[p]}</label>`).join("");
    }
    function renderTabs() {
      const base = ["dashboard", "projects", "designs", "payments", "workers", "measurements", "founders", "expenses", "reports", "archive", "settings"];
      const visible = base.filter((page) => page === "payments"
        ? hasPerm("payments") && !["viewer", "client"].includes(state.currentUser.role)
        : page === "reports"
          ? hasPerm("reports")
          : page === "designs" ? hasPerm("designs") || canEditProjects() : hasPerm(page));
      if (!isClientUser() && !visible.includes("archive") && (isSuperAdmin() || hasPerm("dashboard") || hasPerm("projects") || hasPerm("expenses"))) visible.splice(Math.max(visible.length - 1, 0), 0, "archive");
      if (state.currentUser.role === "super_admin") visible.splice(visible.length - 1, 0, "users");
      el.tabs.innerHTML = visible.map((p, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-page="${p}">${pageTitle(p)}</button>`).join("");
      el.pages.forEach((x) => x.classList.remove("active"));
      if (visible[0]) document.getElementById(visible[0]).classList.add("active");
      el.appSection.dataset.page = visible[0] || "dashboard";
      if (el.pageHeading) el.pageHeading.textContent = pageTitle(visible[0]) || "Dashboard";
      Array.from(el.tabs.querySelectorAll(".tab")).forEach((btn) => {
        btn.addEventListener("click", () => {
          const page = btn.getAttribute("data-page");
          Array.from(el.tabs.querySelectorAll(".tab")).forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          el.pages.forEach((x) => x.classList.remove("active"));
          document.getElementById(page).classList.add("active");
          el.appSection.dataset.page = page;
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
      el.measurementWorker.value = state.currentUser.username;
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
      el.appSection.dataset.page = firstPage;
    }

    function workerAdvanceById() {
      const map = {};
      state.finance.expenses.forEach((e) => {
        if (e.type === "oylik_avans" && e.workerId) map[e.workerId] = (map[e.workerId] || 0) + num(e.amount);
      });
      return map;
    }
    function workerSalaryPaidById() {
      const map = {};
      state.finance.expenses.forEach((e) => {
        if (e.type === "oylik_tolov" && e.workerId) map[e.workerId] = (map[e.workerId] || 0) + num(e.amount);
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
      const workerPaidMap = workerSalaryPaidById();
      const salaryFundBase = state.finance.workers.reduce((a, w) => a + num(w.salary), 0);
      const workerAdvanceTotal = Object.values(workerAvMap).reduce((a, v) => a + v, 0);
      const workerSalaryPaidTotal = Object.values(workerPaidMap).reduce((a, v) => a + v, 0);
      const salaryPayableNow = Math.max(salaryFundBase - workerAdvanceTotal - workerSalaryPaidTotal, 0);

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
        totalAmount, totalAdvance, receivable, salaryFundBase, workerAdvanceTotal, workerSalaryPaidTotal, salaryPayableNow,
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
      renderDashboardPeriod();
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
        el.pAdvance.disabled = true;
        setFormEditMode(el.projectForm, el.projectSubmitBtn, el.projectCancelEdit, true);
      }));
    }

    function renderWorkSelectors() {
      const options = state.finance.projects.map(project =>
        `<option value="${clean(project.id)}">${clean(project.name)} — ${clean(project.client)}</option>`
      ).join("");
      el.designProject.innerHTML = `<option value="">Zakazni tanlang</option>${options}`;
      el.measurementProject.innerHTML = `<option value="">Zakazsiz</option>${options}`;
      el.designForm.closest(".design-panel").classList.toggle("hidden", !hasPerm("designs") && !canEditProjects());
      el.designForm.classList.toggle("hidden", ["worker", "viewer", "client"].includes(state.currentUser?.role));
      el.measurementForm.classList.toggle("hidden", !hasPerm("measurements") || ["viewer", "client"].includes(state.currentUser?.role));
    }

    function renderDesigns() {
      if (!state.finance.designs.length) {
        el.designsBody.innerHTML = `<tr><td colspan="5">Hozircha dizayn yuborilmagan.</td></tr>`;
        return;
      }
      el.designsBody.innerHTML = [...state.finance.designs].reverse().map(design => `<tr>
        <td>${clean(design.date || "-")}</td>
        <td>${clean(design.projectName || "-")}</td>
        <td>${clean(design.dimensions || "O'lcham kiritilmagan")}<br>${clean(design.note || "-")}</td>
        <td><span class="pill ${design.sent ? "s-done" : "s-due"}">${design.sent ? "Telegramga yuborilgan" : "Yuborilmagan"}</span></td>
        <td><button class="ghost small-btn" type="button" data-open-photo="${clean(design.photoFileId)}">Rasm</button>
        ${design.sent || ["worker", "viewer", "client"].includes(state.currentUser?.role) ? "" : `<button class="small-btn" type="button" data-send-design="${clean(design.id)}">Qayta yuborish</button>`}</td>
      </tr>`).join("");
    }

    function renderMeasurements() {
      if (!state.finance.measurements.length) {
        el.measurementsBody.innerHTML = `<tr><td colspan="6">Hozircha joyga chiqish qayd etilmagan.</td></tr>`;
        return;
      }
      el.measurementsBody.innerHTML = [...state.finance.measurements].reverse().map(visit => `<tr>
        <td>${clean(visit.date)}</td>
        <td>${clean(visit.client)}${visit.projectName ? `<div class="expense-order-detail">${clean(visit.projectName)}</div>` : ""}</td>
        <td>${clean(visit.address)}</td>
        <td>${clean(visit.workerName)}</td>
        <td>${clean(visit.dimensions || "-")}</td>
        <td><button class="ghost small-btn" type="button" data-open-photo="${clean(visit.photoFileId)}">Rasmni ko'rish</button></td>
      </tr>`).join("");
    }

    function imageAsJpeg(file) {
      return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith("image/")) return reject(new Error("Rasm faylini tanlang."));
        if (file.size > 15 * 1024 * 1024) return reject(new Error("Rasm 15 MB dan kichik bo'lishi kerak."));
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi."));
        reader.onload = () => {
          const image = new Image();
          image.onerror = () => reject(new Error("Rasm faylini ochib bo'lmadi."));
          image.onload = () => {
            const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.78));
          };
          image.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }

    async function uploadPhoto(kind, file) {
      const image = await imageAsJpeg(file);
      const result = await apiRequest("/api/telegram/upload-photo", {
        method: "POST",
        body: JSON.stringify({ kind, image })
      });
      return result.fileId;
    }

    async function showTelegramPhoto(fileId) {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`/api/telegram/photo/${encodeURIComponent(fileId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Rasmni ochib bo'lmadi.");
      }
      const priorUrl = el.photoPreview.dataset.objectUrl;
      if (priorUrl) URL.revokeObjectURL(priorUrl);
      const url = URL.createObjectURL(await response.blob());
      el.photoPreview.dataset.objectUrl = url;
      el.photoPreview.src = url;
      if (!el.photoDialog.open) el.photoDialog.showModal();
    }

    async function deliverDesign(design) {
      if (!design?.approved) throw new Error("Tasdiqlanmagan dizaynni yuborib bo'lmaydi.");
      const result = await apiRequest("/api/telegram/send-design", {
        method: "POST",
        body: JSON.stringify({
          designId: design.id
        })
      });
      const index = state.finance.designs.findIndex(item => item.id === design.id);
      if (index >= 0) {
        state.finance.designs[index] = {
          ...state.finance.designs[index],
          sent: result.delivery.failed === 0,
          telegramMessageId: result.messageId,
          sentAt: new Date().toISOString()
        };
        if (!await saveFinance()) throw new Error("Telegramga yuborildi, lekin yuborilgan holatini bazaga saqlab bo'lmadi.");
      }
      renderDesigns();
      if (result.delivery.failed) throw new Error(`${result.delivery.sent} ta xodimga yuborildi, ${result.delivery.failed} tasiga yuborilmadi. Qayta yuborish mumkin.`);
    }

    function renderWorkers() {
      const avMap = workerAdvanceById();
      const paidMap = workerSalaryPaidById();
      if (!state.finance.workers.length) { el.workersBody.innerHTML = `<tr><td colspan="7">Hozircha ishchi yo'q.</td></tr>`; return; }
      el.workersBody.innerHTML = state.finance.workers.map((w) => {
        const av = avMap[w.id] || 0;
        const paid = paidMap[w.id] || 0;
        const remain = Math.max(num(w.salary) - av - paid, 0);
        return `<tr>
          <td>${clean(w.name)}<br><small>${clean(w.phone || "Telefon kiritilmagan")}</small></td><td>${clean(w.role)}</td><td>${fmt(w.salary)}</td><td>${fmt(av)}</td><td>${fmt(paid)}</td><td>${fmt(remain)}</td>
          <td>
            <button class="ghost small-btn" type="button" data-edit-w="${w.id}">Tahrirlash</button>
            <button class="danger small-btn" type="button" data-del-w="${w.id}">O'chirish</button>
          </td>
        </tr>`;
      }).join("");
      Array.from(el.workersBody.querySelectorAll("[data-del-w]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-w");
        state.finance.workers = state.finance.workers.filter(w => w.id !== id);
        saveFinance(); refreshAll();
      }));
      Array.from(el.workersBody.querySelectorAll("[data-edit-w]")).forEach((b) => b.addEventListener("click", () => {
        const w = state.finance.workers.find(x => x.id === b.getAttribute("data-edit-w")); if (!w) return;
        editState.workerId = w.id;
        document.getElementById("wPhone").value = w.phone || "";
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
        <td>${fmt(f.base)}</td><td>${fmt(f.founderAdvance)}<div class="expense-order-detail">${founderAdvanceProjectDetails(f.id)}</div></td><td>${fmt(f.final)}</td>
        <td>
          <button class="ghost small-btn" type="button" data-edit-f="${f.id}">Tahrirlash</button>
          <button class="danger small-btn" type="button" data-del-f="${f.id}">O'chirish</button>
        </td>
      </tr>`).join("");
      Array.from(el.foundersBody.querySelectorAll("[data-del-f]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-f");
        state.finance.founders = state.finance.founders.filter(f => f.id !== id);
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
      renderAllocationRows();
    }
    function toggleExpenseTypeInputs() {
      const t = el.eType.value;
      el.eWorkerWrap.classList.toggle("hidden", t !== "oylik_avans" && t !== "oylik_tolov");
      el.eFounderWrap.classList.toggle("hidden", t !== "founder_avans");
    }

    function expenseAllocations(expense) {
      if (Array.isArray(expense.allocations) && expense.allocations.length) return expense.allocations;
      if (expense.sourceProjectId) {
        return [{ projectId: expense.sourceProjectId, projectName: expense.sourceProjectName || "", amount: num(expense.amount) }];
      }
      return [];
    }

    function allocationProjectOptions(selectedId = "") {
      const options = state.finance.projects.map(project =>
        `<option value="${clean(project.id)}" ${project.id === selectedId ? "selected" : ""}>${clean(project.name)}${project.client ? ` — ${clean(project.client)}` : ""}</option>`
      );
      if (selectedId && !state.finance.projects.some(project => project.id === selectedId)) {
        const oldProject = state.finance.expenses.flatMap(expenseAllocations).find(allocation => allocation.projectId === selectedId);
        options.unshift(`<option value="${clean(selectedId)}" selected>${clean(oldProject?.projectName || "O'chirilgan zakaz")} (faol emas)</option>`);
      }
      return `<option value="" ${selectedId ? "" : "selected"} disabled>Zakazni tanlang</option>` + options.join("");
    }

    function renderAllocationRows(allocations = null) {
      if (!el.expenseAllocations) return;
      const existingRows = allocations === null ? Array.from(el.expenseAllocations.querySelectorAll("[data-allocation-row]")).map(row => ({
        projectId: row.querySelector("[data-allocation-project]")?.value || "",
        amount: row.querySelector("[data-allocation-amount]")?.value || ""
      })) : allocations;
      const rows = existingRows.length ? existingRows : [{ projectId: "", amount: "" }];
      el.expenseAllocations.innerHTML = rows.map((allocation, index) => `
        <div class="allocation-row" data-allocation-row>
          <label class="allocation-select-label">Zakaz ${index + 1}<select data-allocation-project required>${allocationProjectOptions(allocation.projectId || "")}</select></label>
          <label>Ajratilgan summa (UZS)<input data-allocation-amount inputmode="decimal" value="${clean(allocation.amount)}" required /></label>
          <button class="danger small-btn" type="button" data-remove-allocation aria-label="Zakaz taqsimotini o'chirish">O'chirish</button>
        </div>`).join("");
      updateAllocationTotal();
    }

    function updateAllocationTotal() {
      if (!el.allocationTotal || !el.expenseAllocations) return;
      const assigned = Array.from(el.expenseAllocations.querySelectorAll("[data-allocation-amount]"))
        .reduce((total, input) => total + num(input.value), 0);
      const amount = num(el.eAmount.value);
      const matches = amount > 0 && Math.abs(assigned - amount) < 0.01;
      el.allocationTotal.textContent = `Taqsimlangan: ${fmt(assigned)} / ${fmt(amount)}${matches ? " — to'liq" : " — qolgan summa taqsimlanmagan"}`;
      el.allocationTotal.classList.toggle("is-valid", matches);
      el.allocationTotal.classList.toggle("is-invalid", !matches);
    }

    function readExpenseAllocations() {
      return Array.from(el.expenseAllocations.querySelectorAll("[data-allocation-row]")).map(row => {
        const projectId = row.querySelector("[data-allocation-project]").value;
        const project = state.finance.projects.find(item => item.id === projectId);
        const oldAllocation = state.finance.expenses.flatMap(expenseAllocations)
          .find(allocation => allocation.projectId === projectId);
        return {
          projectId,
          projectName: project?.name || oldAllocation?.projectName || "",
          amount: num(row.querySelector("[data-allocation-amount]").value)
        };
      });
    }

    function founderAdvanceProjectDetails(founderId) {
      const grouped = new Map();
      state.finance.expenses
        .filter(e => e.type === "founder_avans" && e.founderId === founderId)
        .forEach(e => {
          const allocations = expenseAllocations(e);
          if (!allocations.length) {
            const current = grouped.get("unassigned") || { name: "Zakaz biriktirilmagan", amount: 0 };
            current.amount += num(e.amount);
            grouped.set("unassigned", current);
          }
          allocations.forEach(allocation => {
            const current = grouped.get(allocation.projectId) || { name: allocation.projectName, amount: 0 };
            current.amount += num(allocation.amount);
            grouped.set(allocation.projectId, current);
          });
        });
      if (!grouped.size) return "Hozircha avans olinmagan";
      return Array.from(grouped.values(), item => `${clean(item.name)}: ${fmt(item.amount)}`).join("<br>");
    }

    function renderOrderExpenseSummary() {
      const projectTotals = new Map();
      state.finance.projects.forEach(project => projectTotals.set(project.id, {
        project,
        projectName: project.name,
        expenses: 0,
        founderAdvances: new Map()
      }));
      const unassigned = { expenses: 0, founderAdvances: new Map() };

      state.finance.expenses.forEach(expense => {
        const allocations = expenseAllocations(expense);
        if (!allocations.length) unassigned.expenses += num(expense.amount);
        allocations.forEach(allocation => {
          let totals = projectTotals.get(allocation.projectId);
          if (!totals && allocation.projectId) {
            totals = {
              project: null,
              projectName: allocation.projectName || "O'chirilgan zakaz",
              expenses: 0,
              founderAdvances: new Map()
            };
            projectTotals.set(allocation.projectId, totals);
          }
          totals = totals || unassigned;
          if (expense.type === "founder_avans") {
            const founderKey = expense.founderId || "unknown";
            totals.founderAdvances.set(founderKey, (totals.founderAdvances.get(founderKey) || 0) + num(allocation.amount));
          } else {
            totals.expenses += num(allocation.amount);
          }
        });
      });

      const rows = Array.from(projectTotals.values()).map(({ project, projectName, expenses, founderAdvances }) => {
        const advances = Array.from(founderAdvances, ([founderId, amount]) => {
          const name = state.finance.founders.find(f => f.id === founderId)?.name || "Noma'lum ta'sischi";
          return `${clean(name)}: ${fmt(amount)}`;
        }).join("<br>");
        const advanceTotal = Array.from(founderAdvances.values()).reduce((sum, amount) => sum + amount, 0);
        const projectAmount = project ? num(project.amount) : null;
        const remaining = projectAmount === null ? null : projectAmount - expenses - advanceTotal;
        return `<tr>
          <td>${clean(projectName)}${project ? "" : " (faol emas)"}</td><td>${project ? fmt(projectAmount) : "-"}</td><td>${fmt(expenses)}</td>
          <td>${advances || "Olinmagan"}</td><td>${fmt(expenses + advanceTotal)}</td><td>${remaining === null ? "-" : fmt(remaining)}</td>
        </tr>`;
      });

      const unassignedAdvanceTotal = Array.from(unassigned.founderAdvances.values()).reduce((sum, amount) => sum + amount, 0);
      if (unassigned.expenses || unassignedAdvanceTotal) {
        const advances = Array.from(unassigned.founderAdvances, ([founderId, amount]) => {
          const name = state.finance.founders.find(f => f.id === founderId)?.name || "Noma'lum ta'sischi";
          return `${clean(name)}: ${fmt(amount)}`;
        }).join("<br>");
        rows.push(`<tr>
          <td>Umumiy / eski yozuvlar (zakaz ko'rsatilmagan)</td><td>-</td><td>${fmt(unassigned.expenses)}</td>
          <td>${advances || "Olinmagan"}</td><td>${fmt(unassigned.expenses + unassignedAdvanceTotal)}</td><td>-</td>
        </tr>`);
      }
      el.orderExpensesBody.innerHTML = rows.length
        ? rows.join("")
        : `<tr><td colspan="6">Hozircha zakazlar yoki xarajatlar yo'q.</td></tr>`;
    }

    function renderExpenses() {
      if (!state.finance.expenses.length) {
        el.expensesBody.innerHTML = `<tr><td colspan="8">Hozircha xarajat yo'q.</td></tr>`;
        renderOrderExpenseSummary();
        return;
      }
      el.expensesBody.innerHTML = state.finance.expenses.map((e) => {
        const worker = e.workerId ? state.finance.workers.find(w => w.id === e.workerId)?.name || e.workerName : "";
        const founder = e.founderId ? state.finance.founders.find(f => f.id === e.founderId)?.name || e.founderName : "";
        const target = worker || founder || "-";
        const allocations = expenseAllocations(e);
        const sourceProject = allocations.length
          ? allocations.map(allocation => `${clean(allocation.projectName || state.finance.projects.find(project => project.id === allocation.projectId)?.name || "Zakaz")} (${fmt(allocation.amount)})`).join("<br>")
          : "Zakaz biriktirilmagan (eski yozuv)";
        const paymentType = EXPENSE_PAYMENT_LABEL[e.paymentType] || (e.paymentType ? clean(e.paymentType) : "Ko'rsatilmagan");
        return `<tr>
          <td>${clean(e.date)}</td><td>${EXPENSE_LABEL[e.type] || clean(e.type)}</td><td>${fmt(e.amount)}</td><td>${paymentType}</td><td>${clean(target)}</td><td>${sourceProject}</td><td>${clean(e.note || "-")}</td>
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
        fillExpenseRelatedSelects(); renderAllocationRows(expenseAllocations(e)); toggleExpenseTypeInputs();
        if (e.workerId) el.eWorkerId.value = e.workerId;
        if (e.founderId) el.eFounderId.value = e.founderId;
        setFormEditMode(el.expenseForm, el.expenseSubmitBtn, el.expenseCancelEdit, true);
      }));
      renderOrderExpenseSummary();
    }

    function fillPaymentProjectSelect() {
      if (!el.paymentProjectId) return;
      el.paymentProjectId.innerHTML = state.finance.projects.map(project => {
        const due = Math.max(num(project.amount) - num(project.advance), 0);
        return `<option value="${clean(project.id)}">${clean(project.name)} — qolgan ${fmt(due)}</option>`;
      }).join("");
    }

    function renderPayments() {
      if (!el.paymentsBody) return;
      const payments = [...state.finance.payments].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      if (!payments.length) {
        el.paymentsBody.innerHTML = `<tr><td colspan="7">Hozircha to'lov yo'q.</td></tr>`;
        return;
      }
      el.paymentsBody.innerHTML = payments.map(payment => {
        const project = state.finance.projects.find(item => item.id === payment.projectId);
        return `<tr>
          <td>${clean(payment.date || "-")}</td><td>${clean(project?.name || payment.projectName || "Zakaz arxivlangan")}</td>
          <td>${clean(project?.client || payment.clientName || "-")}</td><td>${fmt(payment.amount)}</td>
          <td>${clean(payment.paymentType || "-")}</td><td>${clean(payment.note || "-")}</td>
          <td><button class="danger small-btn" type="button" data-delete-payment="${clean(payment.id)}">O'chirish</button></td>
        </tr>`;
      }).join("");
      Array.from(el.paymentsBody.querySelectorAll("[data-delete-payment]")).forEach(button => button.addEventListener("click", async () => {
        const payment = state.finance.payments.find(item => item.id === button.getAttribute("data-delete-payment"));
        if (!payment) return;
        const project = state.finance.projects.find(item => item.id === payment.projectId);
        const previousAdvance = project?.advance;
        const previousPayments = [...state.finance.payments];
        if (project) project.advance = Math.max(num(project.advance) - num(payment.amount), 0);
        state.finance.payments = state.finance.payments.filter(item => item.id !== payment.id);
        const saved = await saveFinance();
        if (!saved) {
          if (project) project.advance = previousAdvance;
          state.finance.payments = previousPayments;
          return msg(el.paymentMsg, "To'lovni o'chirishda saqlash xatosi yuz berdi.", "err");
        }
        refreshAll();
      }));
    }

    function archiveDebt(project) {
      return Math.max(num(project.amount) - num(project.advance), 0);
    }

    function renderArchives() {
      if (!el.archiveBody) return;
      const archives = state.finance.archives || [];
      const projectCount = archives.reduce((a, archive) => a + (Array.isArray(archive.projects) ? archive.projects.length : 0), 0);
      const latestArchivedProjects = new Map();
      archives.forEach(archive => (archive.projects || []).forEach(project => {
        const previous = latestArchivedProjects.get(project.id);
        if (!previous || String(archive.month).localeCompare(String(previous.month)) > 0) {
          latestArchivedProjects.set(project.id, { month: archive.month, project });
        }
      }));
      state.finance.projects.forEach(project => latestArchivedProjects.set(project.id, { month: "9999-99", project }));
      const openDebt = Array.from(latestArchivedProjects.values()).reduce((sum, item) => {
        const project = item.project;
        return sum + (project.debtClosed ? 0 : num(project.outstandingBalance ?? archiveDebt(project)));
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
        const payments = Array.isArray(archive.payments) ? archive.payments : [];
        const measurements = Array.isArray(archive.measurements) ? archive.measurements : [];
        const designs = Array.isArray(archive.designs) ? archive.designs : [];
        if (!projects.length) {
          rows.push(`<tr><td>${clean(archive.month)}</td><td colspan="7">Loyiha yo'q. Xarajatlar: ${expenses.length} ta.</td></tr>`);
        }
        projects.forEach((p) => {
          const debt = num(p.outstandingBalance ?? archiveDebt(p));
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
        const workers = Array.isArray(archive.workers) ? archive.workers.length : 0;
        const founders = Array.isArray(archive.founders) ? archive.founders.length : 0;
        rows.push(`<tr class="archive-expense-row"><td>${clean(archive.month)}</td><td colspan="7">Arxiv: ${payments.length} ta tushum (${fmt(payments.reduce((sum, p) => sum + num(p.amount), 0))}), ${expenses.length} ta xarajat (${fmt(expenses.reduce((sum, e) => sum + num(e.amount), 0))}), ${workers} ishchi, ${founders} ta'sischi, ${measurements.length} o'lchov, ${designs.length} dizayn.</td></tr>`);
        measurements.forEach(visit => rows.push(`<tr>
          <td>${clean(archive.month)}</td><td colspan="6">O'lchov: ${clean(visit.client)} — ${clean(visit.address)}; xodim: ${clean(visit.workerName)}; ${clean(visit.dimensions || "o'lcham kiritilmagan")}</td>
          <td><button class="ghost small-btn" type="button" data-open-photo="${clean(visit.photoFileId)}">Rasm</button></td>
        </tr>`));
        designs.forEach(design => rows.push(`<tr>
          <td>${clean(archive.month)}</td><td colspan="6">Dizayn: ${clean(design.projectName)} — ${clean(design.note || "izohsiz")}; ${design.sent ? "Telegramga yuborilgan" : "yuborilmagan"}</td>
          <td><button class="ghost small-btn" type="button" data-open-photo="${clean(design.photoFileId)}">Rasm</button></td>
        </tr>`));
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
      Array.from(el.archiveBody.querySelectorAll("[data-open-photo]")).forEach((btn) => btn.addEventListener("click", async () => {
        try { await showTelegramPhoto(btn.dataset.openPhoto); }
        catch (err) {
          if (el.archiveSummary) el.archiveSummary.textContent = err.message || "Rasmni ochib bo'lmadi.";
        }
      }));
    }

    function renderPaymentLock() {
      if (!el.paymentLock) return;
      const locked = isPaymentLocked();
      const reminder = !!state.finance.payment?.reminder;
      const visible = reminder || locked;
      const blocking = locked && !isSuperAdmin();
      el.paymentLock.classList.toggle("hidden", !visible);
      el.paymentLock.classList.toggle("is-reminder", visible && !locked);
      el.paymentLock.classList.toggle("super-admin-view", isSuperAdmin());
      el.appSection.classList.toggle("payment-is-locked", blocking);
      el.sidebar.inert = blocking;
      el.appSection.querySelector(".main-area").inert = blocking;
      el.paymentLock.setAttribute("role", blocking ? "dialog" : "region");
      el.paymentLock.setAttribute("aria-modal", String(blocking));
      if (!visible) {
        msg(el.paymentLockMsg, "", "");
        return;
      }
      const month = clean(state.finance.payment?.currentMonth || "");
      el.paymentLockTitle.textContent = "To'lov sanasi";
      el.paymentLockText.textContent = locked
        ? isSuperAdmin()
          ? `${month ? month + " oyi uchun " : ""}5-sana to'lov muddati o'tdi. To'lov tasdiqlanmaguncha adminlar uchun tizim yopiq; siz super admin sifatida ishlashda davom etasiz.`
          : `${month ? month + " oyi uchun " : ""}5-sana to'lov kuni. Super admin to'lov qilindi deb belgilamaguncha tizim yopiq.`
        : `${month ? month + " oyi uchun " : ""}to'lovni 5-sanagacha amalga oshiring. To'lov tasdiqlanmaguncha eslatma ko'rinadi.`;
      el.markPaidBtn.classList.toggle("hidden", !isSuperAdmin());
    }

    function ledgerRows() {
      const rows = [];
      (state.finance.archives || []).forEach(archive => {
        const fallbackMonth = String(archive.month || "");
        (archive.payments || []).forEach(payment => rows.push({ kind: "income", record: payment, fallbackMonth, archived: true }));
        (archive.expenses || []).forEach(expense => rows.push({ kind: "expense", record: expense, fallbackMonth, archived: true }));
      });
      state.finance.payments.forEach(payment => rows.push({ kind: "income", record: payment, fallbackMonth: "", archived: false }));
      state.finance.expenses.forEach(expense => rows.push({ kind: "expense", record: expense, fallbackMonth: "", archived: false }));
      return rows.map(row => ({
        ...row,
        month: /^\d{4}-\d{2}/.test(String(row.record.date || ""))
          ? String(row.record.date).slice(0, 7)
          : row.fallbackMonth
      }));
    }

    function ensureReportPeriods() {
      const currentYear = String(new Date().getFullYear());
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
      const years = new Set([currentYear]);
      ledgerRows().forEach(row => {
        if (/^\d{4}-\d{2}$/.test(row.month)) years.add(row.month.slice(0, 4));
      });
      const yearOptions = Array.from(years).sort((a, b) => b.localeCompare(a))
        .map(year => `<option value="${year}">${year}</option>`).join("");
      [el.dashboardYear, el.reportYear].forEach(select => {
        if (!select) return;
        const selected = select.value;
        select.innerHTML = yearOptions;
        select.value = years.has(selected) ? selected : currentYear;
      });
      if (el.dashboardMonth) {
        const selected = el.dashboardMonth.value;
        el.dashboardMonth.innerHTML = `<option value="all">Yil bo'yicha</option>` +
          MONTH_LABELS.map((month, index) => `<option value="${String(index + 1).padStart(2, "0")}">${month}</option>`).join("");
        el.dashboardMonth.value = selected ? selected : currentMonth;
      }
      if (el.reportMonth) {
        const selected = el.reportMonth.value || "all";
        el.reportMonth.innerHTML = `<option value="all">Yil bo'yicha</option>` +
          MONTH_LABELS.map((month, index) => `<option value="${String(index + 1).padStart(2, "0")}">${month}</option>`).join("");
        el.reportMonth.value = selected;
      }
    }

    function monthsForYear(year) {
      const totals = Array.from({ length: 12 }, (_, index) => ({
        month: `${year}-${String(index + 1).padStart(2, "0")}`,
        label: MONTH_LABELS[index],
        income: 0,
        expenses: 0,
        paymentCount: 0,
        expenseCount: 0
      }));
      ledgerRows().forEach(row => {
        if (!row.month || row.month.slice(0, 4) !== String(year)) return;
        const monthIndex = Number(row.month.slice(5, 7)) - 1;
        if (monthIndex < 0 || monthIndex > 11) return;
        const target = totals[monthIndex];
        if (row.kind === "income") {
          target.income += num(row.record.amount);
          target.paymentCount++;
        } else {
          target.expenses += num(row.record.amount);
          target.expenseCount++;
        }
      });
      return totals;
    }

    function selectedPeriodTotals(year, month) {
      return monthsForYear(year)
        .filter(row => month === "all" || row.month.endsWith(`-${month}`))
        .reduce((total, row) => ({
          income: total.income + row.income,
          expenses: total.expenses + row.expenses,
          paymentCount: total.paymentCount + row.paymentCount,
          expenseCount: total.expenseCount + row.expenseCount
        }), { income: 0, expenses: 0, paymentCount: 0, expenseCount: 0 });
    }

    function drawCompareChart(canvas, legend, rows) {
      if (!canvas || !legend) return;
      fitCanvas(canvas);
      const ctx = canvas.getContext("2d");
      const width = canvas.width, height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const max = Math.max(1, ...rows.flatMap(row => [row.income, row.expenses]));
      const scale = max >= 1000000 ? 1000000 : max >= 1000 ? 1000 : 1;
      const suffix = scale === 1000000 ? "m" : scale === 1000 ? "k" : "";
      const left = 56, right = 16, top = 18, bottom = 40;
      const chartWidth = width - left - right, chartHeight = height - top - bottom;
      const groupWidth = chartWidth / Math.max(rows.length, 1);
      const barWidth = Math.min(24, groupWidth * 0.28);
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--line").trim() || "#d9e1ec";
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#64748b";
      ctx.font = "11px Segoe UI";
      ctx.textAlign = "right";
      for (let tick = 0; tick <= 4; tick++) {
        const y = top + chartHeight - chartHeight * tick / 4;
        ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
        const tickValue = max * tick / 4 / scale;
        ctx.fillText(`${scale === 1 ? Math.round(tickValue) : tickValue.toFixed(1)}${suffix}`, left - 7, y + 4);
      }
      rows.forEach((row, index) => {
        const center = left + groupWidth * (index + 0.5);
        const incomeHeight = row.income / max * chartHeight;
        const expenseHeight = row.expenses / max * chartHeight;
        ctx.fillStyle = "#0875d1";
        ctx.fillRect(center - barWidth - 2, top + chartHeight - incomeHeight, barWidth, incomeHeight);
        ctx.fillStyle = "#e63946";
        ctx.fillRect(center + 2, top + chartHeight - expenseHeight, barWidth, expenseHeight);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#64748b";
        ctx.textAlign = "center";
        ctx.fillText(row.label.slice(0, 3), center, height - 14);
      });
      legend.innerHTML = `<span><i class="dot" style="background:#0875d1"></i>Daromad</span><span><i class="dot" style="background:#e63946"></i>Xarajat</span>`;
    }

    function renderDashboardPeriod() {
      if (!el.dashboardYear || !el.dashboardMonth) return;
      const year = el.dashboardYear.value;
      const month = el.dashboardMonth.value;
      const totals = selectedPeriodTotals(year, month);
      const monthlyRows = monthsForYear(year).filter(row => month === "all" || row.month.endsWith(`-${month}`));
      const periodName = month === "all" ? `${year}-yil` : `${MONTH_LABELS[Number(month) - 1]} ${year}`;
      const net = totals.income - totals.expenses;
      const projectCount = state.finance.projects.length;
      const unpaid = state.finance.projects.reduce((sum, project) => sum + Math.max(num(project.amount) - num(project.advance), 0), 0);
      const completed = state.finance.projects.filter(project => project.status === "Yakunlangan").length;
      const active = Math.max(projectCount - completed, 0);
      el.kpiGrid.innerHTML = [
        { title: "Daromad", value: fmt(totals.income), meta: periodName, cls: "income" },
        { title: "Xarajat", value: fmt(totals.expenses), meta: periodName, cls: "warn-kpi" },
        { title: "Sof foyda", value: fmt(net), meta: periodName, cls: net < 0 ? "danger-kpi" : "profit-kpi" },
        { title: "Faol loyihalar", value: active, meta: `${projectCount} ta joriy loyiha`, cls: "income" },
        { title: "Tugallangan", value: completed, meta: "Joriy loyihalar", cls: "cash" },
        { title: "Qarzdorlik", value: fmt(unpaid), meta: "Yig'ilishi kerak", cls: "danger-kpi" }
      ].map(item => `<div class="kpi card ${item.cls}"><div><h3>${item.title}</h3><div class="v">${item.value}</div></div><div class="meta">${item.meta}</div></div>`).join("");
      el.dashboardChartCaption.textContent = `${periodName} uchun daromad va xarajatlar`;
      el.projectStatusSummary.innerHTML = `
        <div class="status-stat"><span>Faol</span><strong>${active}</strong></div>
        <div class="status-stat"><span>Tugallangan</span><strong>${completed}</strong></div>
        <div class="status-stat"><span>Ochiq qarzdorlik</span><strong>${fmt(unpaid)}</strong></div>
        <div class="status-stat"><span>Davr to'lovlari</span><strong>${totals.paymentCount}</strong></div>`;
      drawCompareChart(el.financeTrendChart, el.financeTrendLegend, monthlyRows);
    }

    function renderReports() {
      if (!el.reportYear || !el.reportMonth) return;
      const year = el.reportYear.value;
      const month = el.reportMonth.value;
      const months = monthsForYear(year);
      const totals = selectedPeriodTotals(year, month);
      const periodName = month === "all" ? `${year}-yil` : `${MONTH_LABELS[Number(month) - 1]} ${year}`;
      const net = totals.income - totals.expenses;
      const margin = totals.income ? net / totals.income * 100 : 0;
      el.reportKpis.innerHTML = [
        { title: "Umumiy daromad", value: fmt(totals.income), meta: periodName, cls: "income" },
        { title: "Umumiy xarajat", value: fmt(totals.expenses), meta: periodName, cls: "warn-kpi" },
        { title: "Sof foyda", value: fmt(net), meta: periodName, cls: net < 0 ? "danger-kpi" : "profit-kpi" },
        { title: "Foyda marjasi", value: `${margin.toFixed(1)}%`, meta: `${totals.paymentCount} ta tushum`, cls: "cash" }
      ].map(item => `<div class="kpi card ${item.cls}"><div><h3>${item.title}</h3><div class="v">${item.value}</div></div><div class="meta">${item.meta}</div></div>`).join("");
      el.reportMonthsBody.innerHTML = months
        .filter(row => month === "all" || row.month.endsWith(`-${month}`))
        .map(row => `<tr><td>${row.label}</td><td>${fmt(row.income)}</td><td>${fmt(row.expenses)}</td><td>${fmt(row.income - row.expenses)}</td><td>${row.paymentCount}</td><td>${row.expenseCount}</td></tr>`)
        .join("") || `<tr><td colspan="6">Tanlangan davrda yozuv yo'q.</td></tr>`;
      drawCompareChart(el.reportTrendChart, el.reportTrendLegend, months);
    }

    function csvCell(value) {
      let text = String(value ?? "");
      if (/^[=+\-@]/.test(text)) text = "'" + text;
      return `"${text.replace(/"/g, '""')}"`;
    }

    function exportReportCsv() {
      const year = el.reportYear.value;
      const month = el.reportMonth.value;
      const lines = [[
        "Sana", "Oy", "Tur", "Zakaz", "Mijoz / oluvchi", "Kategoriya", "Summa (UZS)", "To'lov turi", "Izoh", "Arxiv"
      ]];
      ledgerRows()
        .filter(row => row.month.startsWith(`${year}-`) && (month === "all" || row.month.endsWith(`-${month}`)))
        .sort((a, b) => String(a.record.date || a.month).localeCompare(String(b.record.date || b.month)))
        .forEach(row => {
          const record = row.record;
          if (row.kind === "income") {
            const project = state.finance.projects.find(item => item.id === record.projectId);
            lines.push([
              record.date || row.month, row.month, "Daromad", project?.name || record.projectName || "Zakaz arxivda",
              project?.client || record.clientName || "", "Mijoz to'lovi", num(record.amount), record.paymentType || "", record.note || "", row.archived ? "Ha" : "Yo'q"
            ]);
          } else {
            const allocations = expenseAllocations(record);
            const projectLabel = allocations.length
              ? allocations.map(allocation => `${allocation.projectName || state.finance.projects.find(project => project.id === allocation.projectId)?.name || "Zakaz"} (${num(allocation.amount)})`).join("; ")
              : "Eski yozuv: zakaz biriktirilmagan";
            const worker = state.finance.workers.find(item => item.id === record.workerId)?.name || record.workerName || "";
            const founder = state.finance.founders.find(item => item.id === record.founderId)?.name || record.founderName || "";
            lines.push([
              record.date || row.month, row.month, "Xarajat", projectLabel, worker || founder,
              EXPENSE_LABEL[record.type] || record.type, num(record.amount), EXPENSE_PAYMENT_LABEL[record.paymentType] || record.paymentType || "",
              record.note || "", row.archived ? "Ha" : "Yo'q"
            ]);
          }
        });
      const csv = "\uFEFF" + lines.map(line => line.map(csvCell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `planet-print-hisobot-${year}${month === "all" ? "" : "-" + month}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        const scale = it.value >= 1000000 ? 1000000 : it.value >= 1000 ? 1000 : 1;
        const suffix = scale === 1000000 ? "m" : scale === 1000 ? "k" : "";
        const t = money ? `${scale === 1 ? Math.round(it.value) : (it.value / scale).toFixed(1)}${suffix}` : String(it.value);
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
      if (state.currentUser.role !== "super_admin") { el.usersBody.innerHTML = `<tr><td colspan="5">Faqat super admin ko'ra oladi.</td></tr>`; return; }
      el.usersBody.innerHTML = state.users.map((u) => `<tr>
        <td>${clean(u.username)}</td><td>${clean(u.phone || "Kiritilmagan")}</td><td>${clean(u.role === "worker" ? "Montajnik" : u.role)}</td><td>${(u.permissions || []).map(p => clean(PAGE_TITLES[p] || p)).join(", ") || "-"}</td>
        <td>${u.role === "super_admin" ? "-" : `<button class="small-btn" type="button" data-edit-u="${clean(u.id)}">Tahrirlash</button> <button class="danger small-btn" type="button" data-del-u="${u.id}">O'chirish</button>`}</td>
      </tr>`).join("");
      el.usersBody.querySelectorAll("[data-edit-u]").forEach(button => button.addEventListener("click", () => {
        const user = state.users.find(u => u.id === button.dataset.editU);
        editingUserId = user.id;
        el.uName.value = user.username; el.uName.disabled = true;
        document.getElementById("uPhone").value = user.phone || "";
        el.uEmail.required = false; el.uEmail.disabled = true;
        el.uPass.value = ""; el.uPass.required = false;
        el.uPass.placeholder = "O'zgartirish uchun yangi parol";
        el.uRole.value = user.role;
        renderPermGrid(user.permissions || []);
        el.userForm.querySelector('[type="submit"]').textContent = "O'zgarishlarni saqlash";
        document.getElementById("userCancelEdit").classList.remove("hidden");
        el.userForm.scrollIntoView({ behavior: "smooth" });
      }));
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
      fillPaymentProjectSelect();
      renderWorkSelectors();
      ensureReportPeriods();
      renderSummary();
      renderProjectAlerts();
      renderProjects();
      renderDesigns();
      renderMeasurements();
      renderWorkers();
      renderFounders();
      renderExpenses();
      renderPayments();
      renderArchives();
      renderReports();
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
      el.pAdvance.disabled = false;
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
      renderAllocationRows([]);
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
      el.designsBody.addEventListener("click", async (event) => {
        const photoButton = event.target.closest("[data-open-photo]");
        if (photoButton) {
          try { await showTelegramPhoto(photoButton.dataset.openPhoto); }
          catch (err) { msg(el.designMsg, err.message, "err"); }
          return;
        }
        const sendButton = event.target.closest("[data-send-design]");
        if (!sendButton) return;
        const design = state.finance.designs.find(item => item.id === sendButton.dataset.sendDesign);
        try {
          sendButton.disabled = true;
          await deliverDesign(design);
          msg(el.designMsg, "Dizayn ruxsat berilgan foydalanuvchilarga yuborildi.", "ok");
        } catch (err) {
          msg(el.designMsg, err.message || "Dizayn yuborilmadi.", "err");
        } finally {
          sendButton.disabled = false;
        }
      });
      el.measurementsBody.addEventListener("click", async (event) => {
        const photoButton = event.target.closest("[data-open-photo]");
        if (!photoButton) return;
        try { await showTelegramPhoto(photoButton.dataset.openPhoto); }
        catch (err) { msg(el.measurementMsg, err.message, "err"); }
      });
      el.photoDialog.addEventListener("close", () => {
        const url = el.photoPreview.dataset.objectUrl;
        if (url) URL.revokeObjectURL(url);
        delete el.photoPreview.dataset.objectUrl;
        el.photoPreview.removeAttribute("src");
      });
      el.designForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (blockIfPaymentLocked(el.designMsg)) return;
        if (!el.designApproved.checked) return msg(el.designMsg, "Avval mijoz tasdig'ini belgilang.", "err");
        const project = state.finance.projects.find(item => item.id === el.designProject.value);
        if (!project) return msg(el.designMsg, "Zakazni tanlang.", "err");
        const file = el.designImage.files?.[0];
        if (!file) return msg(el.designMsg, "Dizayn rasmini tanlang.", "err");
        el.designSubmitBtn.disabled = true;
        msg(el.designMsg, "Dizayn yuklanmoqda...", "warn");
        try {
          const photoFileId = await uploadPhoto("design", file);
          const design = {
            id: uid(),
            date: today(),
            projectId: project.id,
            projectName: project.name,
            clientName: project.client,
            note: clean(el.designNote.value),
            dimensions: clean(el.designDimensions.value),
            photoFileId,
            approved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: state.currentUser.username,
            sent: false
          };
          state.finance.designs.push(design);
          if (!await saveFinance()) {
            state.finance.designs = state.finance.designs.filter(item => item.id !== design.id);
            throw new Error("Dizayn yuklandi, ammo platformaga saqlab bo'lmadi. Qayta urinib ko'ring.");
          }
          renderDesigns();
          await deliverDesign(design);
          el.designForm.reset();
          msg(el.designMsg, "Tasdiqlangan dizayn, o‘lcham va vazifa ruxsat berilgan foydalanuvchilarga yuborildi.", "ok");
        } catch (err) {
          msg(el.designMsg, err.message || "Dizaynni yuborishda xatolik.", "err");
        } finally {
          el.designSubmitBtn.disabled = false;
        }
      });
      el.measurementForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (blockIfPaymentLocked(el.measurementMsg)) return;
        const project = state.finance.projects.find(item => item.id === el.measurementProject.value);
        const file = el.measurementPhoto.files?.[0];
        if (!file) return msg(el.measurementMsg, "Joyga borganingizni tasdiqlash uchun rasm yuklang.", "err");
        el.measurementSubmitBtn.disabled = true;
        msg(el.measurementMsg, "Rasm yuklanmoqda...", "warn");
        try {
          const photoFileId = await uploadPhoto("measurement", file);
          const visit = {
            id: uid(),
            date: el.measurementDate.value,
            client: clean(el.measurementClient.value),
            projectId: project?.id || "",
            projectName: project?.name || "",
            address: clean(el.measurementAddress.value),
            workerName: clean(el.measurementWorker.value),
            dimensions: clean(el.measurementSizes.value),
            note: clean(el.measurementNote.value),
            photoFileId,
            createdAt: new Date().toISOString()
          };
          state.finance.measurements.push(visit);
          if (!await saveFinance()) {
            state.finance.measurements = state.finance.measurements.filter(item => item.id !== visit.id);
            throw new Error("Rasm yuklandi, ammo qayd platformaga saqlanmadi. Qayta urinib ko'ring.");
          }
          el.measurementForm.reset();
          el.measurementDate.value = today();
          el.measurementWorker.value = state.currentUser.username;
          renderMeasurements();
          msg(el.measurementMsg, "Joyga chiqish va o'lchovlar saqlandi.", "ok");
        } catch (err) {
          msg(el.measurementMsg, err.message || "O'lchovlarni saqlashda xatolik.", "err");
        } finally {
          el.measurementSubmitBtn.disabled = false;
        }
      });
      const refreshTelegramStaff = async () => {
        const status = document.getElementById("telegramStaffStatus");
        try {
          const result = await apiRequest("/api/telegram/staff");
          document.getElementById("telegramStaffList").innerHTML = result.workers.map(w => `<p>${clean(w.name)} — ${clean(w.phone || "Telefon yo'q")} — ${w.chatId ? `Chat ID: ${clean(w.chatId)} <button type="button" class="ghost small-btn" data-unlink-worker="${clean(w.id)}">Bog'lanishni uzish</button>` : "Botga bog'lanmagan"}</p>`).join("");
          document.querySelectorAll("[data-unlink-worker]").forEach(button => button.addEventListener("click", async () => {
            try { await apiRequest(`/api/telegram/staff/${encodeURIComponent(button.dataset.unlinkWorker)}`, { method: "DELETE" }); await refreshTelegramStaff(); }
            catch (error) { msg(status, error.message, "err"); }
          }));
          msg(status, `${result.workers.filter(w => w.chatId).length} / ${result.workers.length} xodim bog'langan.`, "ok");
        } catch (error) { msg(status, error.message, "err"); }
      };
      document.getElementById("telegramRefresh").addEventListener("click", refreshTelegramStaff);
      document.getElementById("telegramSetup").addEventListener("click", async () => {
        try {
          await apiRequest("/api/telegram/setup-webhook", { method: "POST", body: "{}" });
          msg(document.getElementById("telegramStaffStatus"), "Bot ulandi. Endi xodimlar /start bosishi mumkin.", "ok");
        } catch (error) { msg(document.getElementById("telegramStaffStatus"), error.message, "err"); }
      });
      el.announcementForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          const result = await apiRequest("/api/telegram/announcement", {
            method: "POST",
            body: JSON.stringify({ text: el.announcementText.value })
          });
          if (result.ok) {
            el.announcementForm.reset();
            msg(el.announcementMsg, `Yuborildi: ${result.sent.sent}. Yuborilmadi: ${result.sent.failed}.${result.sent.sent === 0 ? " Xodim telefoni, bog'lanishi va xabar sozlamalarini tekshiring." : ""}`, result.sent.failed || !result.sent.sent ? "warn" : "ok");
          }
        } catch (err) {
          msg(el.announcementMsg, err.message || "E'lon yuborilmadi.", "err");
        }
      });
      el.eType.addEventListener("change", toggleExpenseTypeInputs);
      el.dashboardYear.addEventListener("change", renderDashboardPeriod);
      el.dashboardMonth.addEventListener("change", renderDashboardPeriod);
      el.reportYear.addEventListener("change", renderReports);
      el.reportMonth.addEventListener("change", renderReports);
      el.exportReportBtn.addEventListener("click", exportReportCsv);
      el.eAmount.addEventListener("input", updateAllocationTotal);
      el.expenseAllocations.addEventListener("input", updateAllocationTotal);
      el.expenseAllocations.addEventListener("change", updateAllocationTotal);
      el.expenseAllocations.addEventListener("click", event => {
        const removeButton = event.target.closest("[data-remove-allocation]");
        if (removeButton) {
          removeButton.closest("[data-allocation-row]").remove();
          if (!el.expenseAllocations.querySelector("[data-allocation-row]")) renderAllocationRows([]);
          updateAllocationTotal();
        }
      });
      el.addAllocationBtn.addEventListener("click", () => {
        const rows = Array.from(el.expenseAllocations.querySelectorAll("[data-allocation-row]")).map(row => ({
          projectId: row.querySelector("[data-allocation-project]").value,
          amount: row.querySelector("[data-allocation-amount]").value
        }));
        rows.push({ projectId: "", amount: "" });
        renderAllocationRows(rows);
      });
      if (el.markPaidBtn) {
        el.markPaidBtn.addEventListener("click", async () => {
          if (!isSuperAdmin()) return;
          msg(el.paymentLockMsg, "Saqlanmoqda...", "warn");
          try {
            const data = await apiRequest("/api/payment/mark-paid", { method: "POST", body: JSON.stringify({}) });
            if (data.finance) {
              const saved = data.finance;
              state.finance.projects = Array.isArray(saved.projects) ? saved.projects : [];
              state.finance.payments = Array.isArray(saved.payments) ? saved.payments : [];
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

      el.projectForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.projectMsg)) return;
        const existingProject = editState.projectId
          ? state.finance.projects.find(project => project.id === editState.projectId)
          : null;
        const rec = {
          id: editState.projectId || uid(),
          name: clean(el.pName.value), client: clean(el.pClient.value), clientLogin: clean(el.pClientLogin.value).toLowerCase(),
          startDate: el.pStart.value, dueDate: el.pDue.value,
          amount: num(el.pAmount.value), advance: existingProject ? num(existingProject.advance) : num(el.pAdvance.value),
          paymentType: clean(el.pType.value), status: clean(el.pStatus.value)
        };
        if (!rec.name || !rec.client || !rec.startDate || !rec.dueDate) return msg(el.projectMsg, "Majburiy maydonlarni to'ldiring.", "err");
        if (rec.dueDate < rec.startDate) return msg(el.projectMsg, "Topshirish muddati oldin bo'lishi mumkin emas.", "err");
        if (rec.amount <= 0 || rec.advance < 0 || rec.advance > rec.amount) return msg(el.projectMsg, "Summa/advance noto'g'ri.", "err");
        const previousProjects = state.finance.projects;
        const previousPayments = state.finance.payments;
        if (editState.projectId) state.finance.projects = state.finance.projects.map(p => p.id === rec.id ? rec : p);
        else {
          state.finance.projects = [rec, ...state.finance.projects];
          if (rec.advance > 0) state.finance.payments = [{
            id: uid(), projectId: rec.id, projectName: rec.name, clientName: rec.client,
            date: rec.startDate, amount: rec.advance, paymentType: rec.paymentType,
            note: "Zakaz ochilgandagi oldindan to'lov"
          }, ...state.finance.payments];
        }
        if (!await saveFinance()) {
          state.finance.projects = previousProjects;
          state.finance.payments = previousPayments;
          return msg(el.projectMsg, "Loyihani saqlashda xatolik yuz berdi.", "err");
        }
        resetProjectForm(); msg(el.projectMsg, "Loyiha saqlandi.", "ok"); refreshAll();
      });
      el.projectCancelEdit.addEventListener("click", resetProjectForm);
      el.projectReset.addEventListener("click", resetProjectForm);

      document.getElementById("paymentMax").addEventListener("click", () => {
        const project = state.finance.projects.find(p => p.id === el.paymentProjectId.value);
        el.paymentAmount.value = project ? Math.max(num(project.amount) - num(project.advance), 0) : "";
        msg(el.paymentMsg, "Qolgan summa kiritildi. To'lovni saqlash tugmasini bosing.", "ok");
      });
      el.paymentProjectId.addEventListener("change", () => { el.paymentAmount.value = ""; });
      el.paymentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.paymentMsg)) return;
        const project = state.finance.projects.find(item => item.id === el.paymentProjectId.value);
        const amount = num(el.paymentAmount.value);
        if (!project) return msg(el.paymentMsg, "Zakazni tanlang.", "err");
        if (amount <= 0 || amount > Math.max(num(project.amount) - num(project.advance), 0)) {
          return msg(el.paymentMsg, "To'lov summasi 0 dan katta va zakaz qarzidan oshmasligi kerak.", "err");
        }
        const payment = {
          id: uid(), projectId: project.id, projectName: project.name, clientName: project.client,
          date: el.paymentDate.value || today(), amount, paymentType: clean(el.paymentType.value),
          note: clean(el.paymentNote.value)
        };
        project.advance = num(project.advance) + amount;
        state.finance.payments.unshift(payment);
        const saved = await saveFinance();
        if (!saved) {
          project.advance -= amount;
          state.finance.payments = state.finance.payments.filter(item => item.id !== payment.id);
          return msg(el.paymentMsg, "To'lovni saqlashda xatolik yuz berdi.", "err");
        }
        el.paymentForm.reset();
        el.paymentDate.value = today();
        msg(el.paymentMsg, "To'lov saqlandi.", "ok");
        refreshAll();
      });

      el.workerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.workerMsg)) return;
        const rec = { id: editState.workerId || uid(), phone: document.getElementById("wPhone").value.replace(/\D/g, ""), name: clean(el.wName.value), role: clean(el.wRole.value), salary: num(el.wSalary.value) };
        if (!rec.name || !rec.role || rec.salary <= 0) return msg(el.workerMsg, "Ma'lumotlarni to'g'ri kiriting.", "err");
        const previousWorkers = [...state.finance.workers];
        const phoneKey = value => { const digits = String(value || "").replace(/\D/g, ""); return digits.length === 9 ? `998${digits}` : digits; };
        if (rec.phone && (!/^\d{9,15}$/.test(rec.phone) || previousWorkers.some(w => w.id !== rec.id && phoneKey(w.phone) === phoneKey(rec.phone)))) return msg(el.workerMsg, "Telefon noto'g'ri yoki boshqa xodimda ishlatilgan.", "err");
        if (editState.workerId) state.finance.workers = state.finance.workers.map(w => w.id === rec.id ? rec : w);
        else state.finance.workers.unshift(rec);
        if (!await saveFinance()) { state.finance.workers = previousWorkers; return msg(el.workerMsg, "Xodim saqlanmadi. Qayta urinib ko'ring.", "err"); }
        resetWorkerForm(); msg(el.workerMsg, "Ishchi saqlandi.", "ok"); refreshAll();
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

      el.expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.expenseMsg)) return;
        const existingExpense = editState.expenseId ? state.finance.expenses.find(x => x.id === editState.expenseId) : null;
        const allocations = readExpenseAllocations();
        const uniqueProjectIds = new Set(allocations.map(allocation => allocation.projectId));
        const allocationTotal = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
        const invalidProject = allocations.some(allocation =>
          !state.finance.projects.some(project => project.id === allocation.projectId) &&
          !expenseAllocations(existingExpense || {}).some(previous => previous.projectId === allocation.projectId)
        );
        if (!allocations.length || invalidProject || allocations.some(allocation => !allocation.projectId || allocation.amount <= 0) ||
            uniqueProjectIds.size !== allocations.length || Math.abs(allocationTotal - num(el.eAmount.value)) >= 0.01) {
          return msg(el.expenseMsg, "Xarajat summasini takrorlanmagan zakazlarga to'liq taqsimlang.", "err");
        }
        const rec = {
          id: editState.expenseId || uid(),
          date: el.eDate.value || today(),
          type: clean(el.eType.value),
          amount: num(el.eAmount.value),
          paymentType: clean(el.ePaymentType.value),
          note: clean(el.eNote.value),
          workerId: null,
          founderId: null,
          allocations
        };
        if (!rec.date || rec.amount <= 0) return msg(el.expenseMsg, "Sana va summa to'g'ri bo'lsin.", "err");
        if (!EXPENSE_PAYMENT_LABEL[rec.paymentType]) return msg(el.expenseMsg, "To'lov turini tanlang.", "err");
        if (rec.type === "oylik_avans" || rec.type === "oylik_tolov") {
          rec.workerId = el.eWorkerId.value;
          if (!rec.workerId) return msg(el.expenseMsg, "Ishchini tanlang.", "err");
          const worker = state.finance.workers.find(w => w.id === rec.workerId);
          if (!worker) return msg(el.expenseMsg, "Ishchi topilmadi.", "err");
          rec.workerName = worker.name;
          const oldAmount = existingExpense?.workerId === worker.id ? num(existingExpense.amount) : 0;
          const advanceTotal = workerAdvanceById()[worker.id] || 0;
          const salaryPaid = workerSalaryPaidById()[worker.id] || 0;
          const advanceAfterSave = advanceTotal - (existingExpense?.type === "oylik_avans" ? oldAmount : 0) + (rec.type === "oylik_avans" ? rec.amount : 0);
          const paidAfterSave = salaryPaid - (existingExpense?.type === "oylik_tolov" ? oldAmount : 0) + (rec.type === "oylik_tolov" ? rec.amount : 0);
          if (advanceAfterSave + paidAfterSave > num(worker.salary)) return msg(el.expenseMsg, "Oylik avansi va to'lovlari ishchi oyligidan oshib ketmoqda.", "err");
        }
        if (rec.type === "founder_avans") {
          rec.founderId = el.eFounderId.value;
          if (!rec.founderId) return msg(el.expenseMsg, "Ta'sischini tanlang.", "err");
          rec.founderName = state.finance.founders.find(founder => founder.id === rec.founderId)?.name || "";
        }
        const previousExpenses = state.finance.expenses;
        if (editState.expenseId) state.finance.expenses = state.finance.expenses.map(x => x.id === rec.id ? rec : x);
        else state.finance.expenses = [rec, ...state.finance.expenses];
        if (!await saveFinance()) {
          state.finance.expenses = previousExpenses;
          return msg(el.expenseMsg, "Xarajatni saqlashda xatolik yuz berdi.", "err");
        }
        resetExpenseForm(); msg(el.expenseMsg, "Xarajat saqlandi.", "ok"); refreshAll();
      });
      el.expenseCancelEdit.addEventListener("click", resetExpenseForm);
      el.expenseReset.addEventListener("click", () => {
        if (!isSuperAdmin()) return msg(el.expenseMsg, "Tozalash faqat super admin uchun.", "err");
        resetExpenseForm();
      });

      el.uRole.addEventListener("change", () => renderPermGrid());
      const resetUserEditor = () => {
        editingUserId = null; el.userForm.reset();
        el.uName.disabled = false; el.uEmail.disabled = false; el.uEmail.required = true;
        el.uPass.required = true; el.uPass.placeholder = "";
        el.userForm.querySelector('[type="submit"]').textContent = "Foydalanuvchi qo'shish";
        document.getElementById("userCancelEdit").classList.add("hidden"); renderPermGrid();
      };
      document.getElementById("userCancelEdit").addEventListener("click", resetUserEditor);
      el.userForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (state.currentUser.role !== "super_admin") return msg(el.userMsg, "Faqat super admin qo'sha oladi.", "err");
        const username = clean(el.uName.value), password = el.uPass.value, role = clean(el.uRole.value);
        if (!username || ((!editingUserId || password) && password.length < 8)) return msg(el.userMsg, "Login kiriting, parol kamida 8 belgi.", "err");
        const checks = Array.from(el.permGrid.querySelectorAll("input[data-perm]:checked")).map(i => i.getAttribute("data-perm"));
        const permissions = checks;
        try {
          // Create user via server API (uses admin SDK)
          const token = localStorage.getItem(TOKEN_KEY);
          const email = (el.uEmail && el.uEmail.value) ? el.uEmail.value.trim() : '';
          const phone = document.getElementById("uPhone").value.trim();
          const resp = await fetch(editingUserId ? `/api/users/${editingUserId}` : '/api/users', { method: editingUserId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ username, email, phone, password, role, permissions }) });
          const j = await resp.json().catch(() => ({}));
          if (!resp.ok) return msg(el.userMsg, j.error || 'Foydalanuvchi yaratishda xatolik', 'err');
          await loadUsers();
          resetUserEditor();
          msg(el.userMsg, "Foydalanuvchi saqlandi.", "ok");
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
        state.finance = { projects: [], payments: [], workers: [], founders: [], expenses: [], archives: state.finance.archives || [], measurements: [], designs: [], payment: state.finance.payment || { locked: false }, settings: { tax: 0, reserve: 0, other: 0 } };
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
      el.paymentDate.value = today();
      el.measurementDate.value = today();
      el.measurementWorker.value = state.currentUser?.username || "";
      toggleExpenseTypeInputs();
      await bootSession();
      window.setInterval(async () => {
        if (!state.currentUser || !localStorage.getItem(TOKEN_KEY)) return;
        try {
          const data = await apiRequest("/api/finance");
          if (data.finance?.payment) {
            if (state.finance.payment?.currentMonth && state.finance.payment.currentMonth !== data.finance.payment.currentMonth) {
              applyFinanceSnapshot(data.finance);
              refreshAll();
              return;
            }
            state.finance.payment = data.finance.payment;
            renderPaymentLock();
          }
        } catch (err) {
          console.error("Payment reminder refresh failed:", err);
        }
      }, 60000);

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
