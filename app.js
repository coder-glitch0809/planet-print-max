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
      news: "Yangiliklar",
      users: "Foydalanuvchilar",
      settings: "Sozlamalar"
    };
    const CLIENT_PAGE_TITLES = { projects: "Zakazlarim" };
    const MONTH_LABELS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

    const editState = { projectId: null, workerId: null, founderId: null, expenseId: null };

    const state = {
      finance: { projects: [], payments: [], workers: [], founders: [], expenses: [], archives: [], measurements: [], designs: [], payment: { locked: false, reminder: false, currentMonth: "", lastPaidMonth: "" }, settings: { tax: 0, reserve: 0, other: 0 } },
      users: [],
      currentUser: null,
      revision: 0,
      financeLoaded: false,
      news: { changelog: [], activity: [] }
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
      fName: document.getElementById("fName"), fShare: document.getElementById("fShare"), fNote: document.getElementById("fNote"), fPhone: document.getElementById("fPhone"),
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
      archiveMsg: document.getElementById("archiveMsg"),
      newsChangelog: document.getElementById("newsChangelog"),
      newsActivity: document.getElementById("newsActivity"),
      newsFilter: document.getElementById("newsFilter"),
      newsRefresh: document.getElementById("newsRefresh"),
      newsMsg: document.getElementById("newsMsg"),
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

    const fmt = (v) => {
      const n = Math.round(Number(v) || 0);
      return (n < 0 ? "−" : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
    };
    const clean = (t) => String(t || "").replace(/[<>"'`]/g, "").trim();
    const num = (v) => {
      const n = Number(String(v ?? "").replace(/\s/g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    // Pul summasi: "1 500 000", "1.500.000", "1,500,000" => 1500000; "1500,50" => 1500.5.
    // Noto'g'ri yozilgan summa NaN qaytaradi (jimgina 0 yoki 1.5 bo'lib qolmasligi uchun).
    function parseMoney(value) {
      const raw = String(value ?? "").replace(/(uzs|so'?m|сум)\s*$/i, "").replace(/[\s\u00a0'’]/g, "");
      if (!raw) return NaN;
      if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ""));
      if (/^\d+([.,]\d{1,2})?$/.test(raw)) return Number(raw.replace(",", "."));
      return NaN;
    }
    const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;
    function parsePercent(value) {
      const raw = String(value ?? "").replace(/[\s%]/g, "");
      if (!raw) return 0;
      return /^\d+([.,]\d+)?$/.test(raw) ? Number(raw.replace(",", ".")) : NaN;
    }
    const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 12) : Math.random().toString(36).slice(2, 12));
    // Sana doim Toshkent vaqti bo'yicha (UTC bo'yicha olinsa, tun 00:00–05:00 da kechagi sana yozilardi).
    const tashkentDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const today = () => tashkentDate();

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

    function applyFinanceSnapshot(saved, revision) {
      if (revision !== undefined) state.revision = Number(revision) || 0;
      state.financeLoaded = true;
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
        applyFinanceSnapshot(data.finance || {}, data.revision);
        setLoadError("");
        return true;
      } catch (err) {
        // Yuklanmagan bo'sh holatdan saqlash bazani tozalab yuborardi: saqlash bloklanadi.
        state.financeLoaded = false;
        setLoadError(`Ma'lumotlar yuklanmadi: ${err.message || "server javob bermadi"}. Sahifani yangilang. Yuklanmaguncha saqlash o'chirilgan.`);
        return false;
      }
    }
    function setLoadError(text) {
      const node = document.getElementById("loadError");
      if (!node) return;
      node.textContent = text;
      node.classList.toggle("hidden", !text);
    }
    let saving = false;
    // Barcha o'zgarishlar shu yerdan o'tadi: o'zgarish nusxada qilinadi, server qabul qilsagina ekranga qo'llanadi.
    // Server boshqa foydalanuvchi o'zgartirganini aytsa (409), yangi ma'lumot yuklanadi.
    async function commitFinance(mutate, node, okText, onSuccess) {
      if (!state.financeLoaded) { if (node) msg(node, "Ma'lumotlar yuklanmagan. Sahifani yangilang.", "err"); return false; }
      if (saving) { if (node) msg(node, "Oldingi saqlash tugashini kuting.", "warn"); return false; }
      const draft = structuredClone(state.finance);
      try {
        const problem = mutate(draft);
        if (problem) { if (node) msg(node, problem, "err"); return false; }
      } catch (err) {
        if (node) msg(node, err.message || "Xatolik.", "err");
        return false;
      }
      saving = true;
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const { resp, data } = await fetchJson("/api/finance", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ finance: draft, revision: state.revision })
        });
        if (resp.status === 409) {
          await loadFinance();
          refreshAll();
          if (node) msg(node, data.error || "Ma'lumotlar yangilandi. Amalni qayta bajaring.", "warn");
          return false;
        }
        if (!resp.ok) { if (node) msg(node, data.error || "Saqlashda xatolik yuz berdi.", "err"); return false; }
        state.finance = draft;
        state.revision = Number(data.revision) || state.revision;
        if (onSuccess) onSuccess();
        refreshAll();
        if (node) msg(node, data.warnings?.length ? `${okText || "Saqlandi."} ${data.warnings.join(" ")}` : (okText || "Saqlandi."), data.warnings?.length ? "warn" : "ok");
        loadNews();
        return true;
      } catch (err) {
        if (node) msg(node, err.name === "AbortError" ? "Server javob bermadi. Saqlanganini sahifani yangilab tekshiring." : (err.message || "Server bilan aloqa yo'q."), "err");
        return false;
      } finally {
        saving = false;
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
      el.themeBtn.textContent = dark ? "☀ Kunduzgi rejim" : "☾ Tungi rejim";
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
      if (!isClientUser()) visible.splice(Math.min(1, visible.length), 0, "news");
      el.tabs.innerHTML = visible.map((p, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-page="${p}">${pageTitle(p)}${p === "news" ? `<span id="newsBadge" class="tab-badge hidden"></span>` : ""}</button>`).join("");
      el.pages.forEach((x) => x.classList.remove("active"));
      if (visible[0]) document.getElementById(visible[0]).classList.add("active");
      el.appSection.dataset.page = visible[0] || "dashboard";
      if (el.pageHeading) el.pageHeading.textContent = pageTitle(visible[0]) || "Dashboard";
      Array.from(el.tabs.querySelectorAll(".tab")).forEach((btn) => {
        btn.addEventListener("click", () => showPage(btn.getAttribute("data-page")));
      });
    }
    function showPage(page) {
      const btn = el.tabs.querySelector(`[data-page="${page}"]`);
      if (!btn) return false;
      Array.from(el.tabs.querySelectorAll(".tab")).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      el.pages.forEach((x) => x.classList.remove("active"));
      document.getElementById(page).classList.add("active");
      el.appSection.dataset.page = page;
      if (el.pageHeading) el.pageHeading.textContent = pageTitle(page);
      setSidebar(false);
      if (page === "news") { loadNews().then(markNewsSeen); }
      drawCharts();
      return true;
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

    // Har bir ishchi alohida hisoblanadi: birining ortiqcha olgani boshqasining qarzini yopmaydi.
    function workerLedger() {
      const avMap = workerAdvanceById();
      const paidMap = workerSalaryPaidById();
      return state.finance.workers.map(w => {
        const salary = num(w.salary), advance = avMap[w.id] || 0, paid = paidMap[w.id] || 0;
        return { ...w, salary, advance, paid, remain: roundMoney(salary - advance - paid) };
      });
    }

    function summary() {
      // O'tgan oydan qarzi bilan ko'chgan zakazning summasi o'z oyida hisoblangan:
      // bu oyning soliq/zaxira/ta'sischi fondiga qayta qo'shilsa, daromad ikki marta hisoblanadi.
      const monthProjects = state.finance.projects.filter(p => !p.carriedFromMonth);
      const carriedProjects = state.finance.projects.filter(p => p.carriedFromMonth);
      const totalAmount = roundMoney(monthProjects.reduce((a, p) => a + num(p.amount), 0));
      const carriedDebt = carriedProjects.reduce((a, p) => a + Math.max(num(p.amount) - num(p.advance), 0), 0);
      const totalAdvance = state.finance.projects.reduce((a, p) => a + num(p.advance), 0);
      const receivable = state.finance.projects.reduce((a, p) => a + Math.max(num(p.amount) - num(p.advance), 0), 0);

      const workers = workerLedger();
      const salaryFundBase = workers.reduce((a, w) => a + w.salary, 0);
      const workerAdvanceTotal = workers.reduce((a, w) => a + w.advance, 0);
      const workerSalaryPaidTotal = workers.reduce((a, w) => a + w.paid, 0);
      const salaryPayableNow = roundMoney(workers.reduce((a, w) => a + Math.max(w.remain, 0), 0));
      const salaryOverpaid = roundMoney(workers.reduce((a, w) => a + Math.max(-w.remain, 0), 0));

      const taxPercent = Math.min(Math.max(num(state.finance.settings.tax), 0), 100);
      const reservePercent = Math.min(Math.max(num(state.finance.settings.reserve), 0), 100);
      const tax = roundMoney(totalAmount * taxPercent / 100);
      const reserve = roundMoney(totalAmount * reservePercent / 100);
      const manualOther = Math.max(num(state.finance.settings.other), 0);
      const expenseByType = {};
      state.finance.expenses.forEach((e) => { expenseByType[e.type] = (expenseByType[e.type] || 0) + num(e.amount); });
      const expensePaymentByType = {};
      state.finance.expenses.forEach((e) => {
        if (EXPENSE_PAYMENT_LABEL[e.paymentType]) expensePaymentByType[e.paymentType] = (expensePaymentByType[e.paymentType] || 0) + num(e.amount);
      });
      const explicitExpense = roundMoney(REAL_EXPENSE_TYPES.reduce((a, t) => a + (expenseByType[t] || 0), 0));
      // Ishchilarga shu oy hali to'lanmagan oylik ham majburiyat: u ta'sischilarga bo'linmasligi kerak.
      const totalRealExpenses = roundMoney(manualOther + tax + reserve + explicitExpense + salaryPayableNow);

      // Fond manfiy bo'lishi mumkin (zarar): u yashirilmaydi, ta'sischilarga ulushiga qarab tushadi.
      const founderPoolRaw = roundMoney(totalAmount - totalRealExpenses);
      const founderPool = founderPoolRaw;
      const founderShareTotal = state.finance.founders.reduce((a, f) => a + num(f.share), 0);
      const founderAvMap = founderAdvanceById();
      const founderRows = state.finance.founders.map((f) => {
        const base = roundMoney(founderPoolRaw * num(f.share) / 100);
        const founderAdvance = roundMoney(founderAvMap[f.id] || 0);
        const final = roundMoney(base - founderAdvance);
        return { ...f, base, founderAdvance, final };
      });
      const founderAdvanceTotal = roundMoney(Object.values(founderAvMap).reduce((a, v) => a + v, 0));
      const removedFounderAdvance = roundMoney(founderAdvanceTotal - founderRows.reduce((a, f) => a + f.founderAdvance, 0));
      const unassignedShare = Math.max(roundMoney(100 - founderShareTotal), 0);
      const unassignedAmount = roundMoney(founderPoolRaw * unassignedShare / 100);
      const founderPayable = roundMoney(founderRows.reduce((a, f) => a + Math.max(f.final, 0), 0));
      const founderOwes = roundMoney(founderRows.reduce((a, f) => a + Math.max(-f.final, 0), 0));
      const statuses = state.finance.projects.map(liveStatus);
      const overdueProjects = statuses.filter(s => s === "Kechiktirilgan zakaz").length;
      const dueTodayProjects = statuses.filter(s => s === "Topshirish vaqti").length;
      const completedProjects = statuses.filter(s => s === "Yakunlangan").length;

      return {
        totalAmount, carriedCount: carriedProjects.length, carriedDebt, totalAdvance, receivable,
        workers, salaryFundBase, workerAdvanceTotal, workerSalaryPaidTotal, salaryPayableNow, salaryOverpaid,
        taxPercent, reservePercent, tax, reserve, manualOther, expenseByType, expensePaymentByType, explicitExpense, totalRealExpenses,
        founderPoolRaw, founderPool, founderShareTotal, founderRows, founderAdvanceTotal, removedFounderAdvance,
        unassignedShare, unassignedAmount, founderPayable, founderOwes,
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
    // Yakunlangan zakaz muddatidan oldin, o'z vaqtida yoki kechikib topshirilganini ko'rsatadi.
    function completionNote(p) {
      if (p.status !== "Yakunlangan" || !p.completedAt) return "";
      const diff = p.dueDate ? Math.round((Date.parse(`${p.dueDate}T00:00:00Z`) - Date.parse(`${p.completedAt}T00:00:00Z`)) / 86400000) : NaN;
      const timing = !Number.isFinite(diff) ? "" : diff > 0 ? `muddatidan ${diff} kun oldin` : diff < 0 ? `${-diff} kun kechikib` : "o'z vaqtida";
      return `${clean(p.completedAt)}${timing ? ` · ${timing}` : ""}`;
    }
    function statusCls(s) {
      if (s === "Yakunlangan") return "pill s-done";
      if (s === "Jarayonda") return "pill s-progress";
      if (s === "Topshirish vaqti") return "pill s-due";
      if (s === "Kechiktirilgan zakaz") return "pill s-over";
      return "pill s-new";
    }

    // Manfiy summa qizil rangda va minus belgisi bilan ko'rsatiladi.
    const money = (value) => `<span class="${num(value) < 0 ? "neg" : ""}">${fmt(value)}</span>`;
    const calcStep = (label, value, cls = "", note = "") =>
      `<li class="${cls}"><span>${label}${note ? `<span class="note">${note}</span>` : ""}</span><b class="${num(value) < 0 && !cls.includes("minus") ? "neg" : ""}">${fmt(value)}</b></li>`;

    function renderSummary() {
      const s = summary();
      renderDashboardPeriod();
      el.formulaList.innerHTML = [
        calcStep("Shu oy olingan zakazlar summasi", s.totalAmount, "", s.carriedCount ? `O'tgan oydan ko'chgan ${s.carriedCount} ta zakaz qo'shilmaydi (daromadi o'z oyida hisoblangan, qolgan qarzi ${fmt(s.carriedDebt)})` : "Kassaga tushmagan qarz ham kiradi"),
        calcStep(`Soliq (${s.taxPercent}%)`, s.tax, "minus"),
        calcStep(`Zaxira (${s.reservePercent}%)`, s.reserve, "minus"),
        calcStep("Qo'lda kiritilgan umumiy xarajat", s.manualOther, "minus"),
        calcStep("Xarajatlar (material, oylik, ishchi avansi)", s.explicitExpense, "minus", "Ta'sischi avansi bu yerga kirmaydi — u ulushdan ayriladi"),
        calcStep("Ishchilarga hali to'lanmagan oylik", s.salaryPayableNow, "minus", "Ishchilarga beriladigan pul ta'sischilarga bo'linmaydi"),
        calcStep(s.founderPoolRaw < 0 ? "Ta'sischilar fondi — ZARAR" : "Ta'sischilar fondi", s.founderPoolRaw, "total",
          s.founderPoolRaw < 0 ? "Zarar ta'sischilarga ulushiga qarab taqsimlanadi" : `Ta'sischilarga berilgan avanslar: ${fmt(s.founderAdvanceTotal)}`)
      ].join("");
      const checks = [];
      const add = (text, alert = false) => checks.push(`<li class="${alert ? "is-alert" : ""}">${text}</li>`);
      add(`Loyihalar: ${state.finance.projects.length} ta — bugun topshiriladi: ${s.dueTodayProjects}, kechikkan: ${s.overdueProjects}`, s.overdueProjects > 0);
      add(`Xarajat to'lovlari: naqd ${fmt(s.expensePaymentByType.naqd || 0)}, Klik ${fmt(s.expensePaymentByType.klik || 0)}, karta (shot) ${fmt(s.expensePaymentByType.shot || 0)}`);
      if (s.founderShareTotal > 100.0001) add(`Ta'sischilar foizi jami ${s.founderShareTotal.toFixed(2)}% — 100% dan oshgan!`, true);
      else if (s.unassignedShare > 0 && state.finance.founders.length) add(`Ta'sischilar foizi jami ${s.founderShareTotal.toFixed(2)}%. Qolgan ${s.unassignedShare.toFixed(2)}% (${fmt(s.unassignedAmount)}) kompaniyada qoladi.`);
      else add(`Ta'sischilar foizi jami: ${s.founderShareTotal.toFixed(2)}%`);
      const overdrawn = s.founderRows.map(f => ({ f, over: founderDebtParts(f).overdrawn })).filter(x => x.over > 0);
      if (overdrawn.length) add(`Ulushidan ortiq avans olgan: ${overdrawn.map(x => `${clean(x.f.name)} (${fmt(x.over)} ortiqcha)`).join(", ")}`, true);
      if (s.founderPoolRaw < 0 && state.finance.founders.length) add(`Oy zarar bilan: ${fmt(-s.founderPoolRaw)} zarar ta'sischilarga ulushiga qarab yozildi`, true);
      if (s.removedFounderAdvance > 0) add(`O'chirilgan ta'sischilarga berilgan avans: ${fmt(s.removedFounderAdvance)} — hech kimning ulushidan ayrilmayapti`, true);
      add(`Ishchilarga qolgan oylik: ${fmt(s.salaryPayableNow)}`);
      if (s.salaryOverpaid > 0) add(`Ishchilarga oyligidan ortiq to'langan: ${fmt(s.salaryOverpaid)}`, true);
      const flows = orderFlows();
      if (flows.borrowings.length) add(`Zakazlar orasida qarz bor: ${flows.borrowings.length} ta (Xarajatlar bo'limida batafsil)`, true);
      if (flows.suspicious.length) add(`Izohida boshqa zakaz nomi bor xarajat: ${flows.suspicious.length} ta — to'g'ri zakazga yozilganini tekshiring`, true);
      el.checkList.innerHTML = checks.join("");
    }

    function renderProjectAlerts() {
      const alerts = state.finance.projects
        .map((p) => ({ project: p, status: liveStatus(p) }))
        .filter((item) => item.status === "Topshirish vaqti" || item.status === "Kechiktirilgan zakaz")
        .sort((a, b) => (a.status === b.status ? 0 : a.status === "Kechiktirilgan zakaz" ? -1 : 1))
        .map((item) => {
          const overdue = item.status === "Kechiktirilgan zakaz";
          const debt = Math.max(num(item.project.amount) - num(item.project.advance), 0);
          const text = overdue
            ? `Muddati ${clean(item.project.dueDate)} edi${debt ? ` · qarz <span class="nowrap">${fmt(debt)}</span>` : ""}`
            : `Bugun topshirilishi kerak${debt ? ` · qarz <span class="nowrap">${fmt(debt)}</span>` : ""}`;
          return `<div class="alert-card ${overdue ? "overdue" : "today"}"><span class="alert-icon" aria-hidden="true">${overdue ? "!" : "⏱"}</span><div><strong>${clean(item.project.name)} — ${overdue ? "kechikkan" : "bugun topshirish"}</strong>${text}</div></div>`;
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
            <td><span class="${statusCls(s)}">${s}</span>${completionNote(p) ? `<div class="expense-order-detail">${completionNote(p)}</div>` : ""}</td>
          </tr>`;
        }
        return `<tr>
          <td>${clean(p.name)}${p.carriedFromMonth ? `<div class="expense-order-detail">${clean(p.carriedFromMonth)} oyidan qarz bilan ko'chgan</div>` : ""}</td><td>${clean(p.client)}</td><td>${clean(p.clientLogin || "-")}</td><td>${clean(p.startDate)}</td><td>${clean(p.dueDate)}</td>
          <td>${fmt(p.amount)}</td><td>${fmt(p.advance)}</td><td>${fmt(remain)}</td><td>${clean(p.paymentType)}</td>
          <td><span class="${statusCls(s)}">${s}</span>${completionNote(p) ? `<div class="expense-order-detail">${completionNote(p)}</div>` : ""}</td>
          <td>
            ${s === "Yakunlangan" ? "" : `<button class="small-btn done-btn" type="button" data-done-p="${clean(p.id)}">✓ Yakunlandi</button>`}
            <button class="ghost small-btn" type="button" data-edit-p="${clean(p.id)}">Tahrirlash</button>
            <button class="danger small-btn" type="button" data-del-p="${clean(p.id)}">O'chirish</button>
          </td>
        </tr>`;
      }).join("");
      Array.from(el.projectsBody.querySelectorAll("[data-del-p]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-p");
        const project = state.finance.projects.find(p => p.id === id);
        if (!project) return;
        const paid = state.finance.payments.filter(p => p.projectId === id).length;
        const spent = state.finance.expenses.filter(e => expenseAllocations(e).some(a => a.projectId === id)).length;
        const extra = paid || spent ? `\nUnga ${paid} ta to'lov va ${spent} ta xarajat bog'langan: ular hisobotda qoladi, zakaz qarzi esa o'chadi.` : "";
        if (!confirm(`"${project.name}" zakazini o'chirasizmi?${extra}`)) return;
        if (editState.projectId === id) resetProjectForm();
        commitFinance(f => { f.projects = f.projects.filter(p => p.id !== id); }, el.projectMsg, "Zakaz o'chirildi.");
      }));
      // Ish muddatidan oldin yoki keyin tugasa ham bir tugma bilan yakunlanadi; sana va kechikish saqlanadi.
      Array.from(el.projectsBody.querySelectorAll("[data-done-p]")).forEach((b) => b.addEventListener("click", () => {
        if (blockIfPaymentLocked(el.projectMsg)) return;
        const id = b.getAttribute("data-done-p");
        const project = state.finance.projects.find(p => p.id === id);
        if (!project || !confirm(`"${project.name}" zakazi yakunlandimi?\nYakunlangan sana: ${today()} (muddat: ${project.dueDate || "-"})`)) return;
        commitFinance(f => {
          const target = f.projects.find(p => p.id === id);
          if (!target) return "Zakaz topilmadi.";
          target.status = "Yakunlangan";
          target.completedAt = today();
        }, el.projectMsg, "Zakaz yakunlandi.");
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
      keepValue(el.designProject, () => { el.designProject.innerHTML = `<option value="">Zakazni tanlang</option>${options}`; });
      keepValue(el.measurementProject, () => { el.measurementProject.innerHTML = `<option value="">Zakazsiz</option>${options}`; });
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
      if (state.finance.designs.some(item => item.id === design.id)) {
        const saved = await commitFinance(f => {
          const target = f.designs.find(item => item.id === design.id);
          if (!target) return "Dizayn topilmadi.";
          Object.assign(target, { sent: result.delivery.failed === 0, telegramMessageId: result.messageId, sentAt: new Date().toISOString() });
        }, null);
        if (!saved) throw new Error("Telegramga yuborildi, lekin yuborilgan holatini bazaga saqlab bo'lmadi.");
      }
      renderDesigns();
      if (result.delivery.failed) throw new Error(`${result.delivery.sent} ta xodimga yuborildi, ${result.delivery.failed} tasiga yuborilmadi. Qayta yuborish mumkin.`);
    }

    function renderWorkers() {
      if (!state.finance.workers.length) { el.workersBody.innerHTML = `<tr><td colspan="7">Hozircha ishchi yo'q.</td></tr>`; return; }
      el.workersBody.innerHTML = workerLedger().map((w) => {
        const remainCell = w.remain < 0
          ? `<span class="neg">${fmt(w.remain)}</span><div class="expense-order-detail">Oyligidan ${fmt(-w.remain)} ortiq to'langan</div>`
          : fmt(w.remain);
        return `<tr>
          <td>${clean(w.name)}<br><small>${clean(w.phone || "Telefon kiritilmagan")}</small></td><td>${clean(w.role)}</td>
          <td class="num">${fmt(w.salary)}</td><td class="num">${fmt(w.advance)}</td><td class="num">${fmt(w.paid)}</td><td class="num">${remainCell}</td>
          <td>
            ${hasPerm("expenses") ? `<button class="small-btn" type="button" data-advance-w="${clean(w.id)}">Avans berish</button>` : ""}
            <button class="ghost small-btn" type="button" data-edit-w="${clean(w.id)}">Tahrirlash</button>
            <button class="danger small-btn" type="button" data-del-w="${clean(w.id)}">O'chirish</button>
          </td>
        </tr>`;
      }).join("");
      Array.from(el.workersBody.querySelectorAll("[data-del-w]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-w");
        const worker = state.finance.workers.find(w => w.id === id);
        if (!worker || !confirm(`"${worker.name}" ishchisini o'chirasizmi? Unga berilgan avans va oyliklar xarajatlarda qoladi.`)) return;
        if (editState.workerId === id) resetWorkerForm();
        commitFinance(f => { f.workers = f.workers.filter(w => w.id !== id); }, el.workerMsg, "Ishchi o'chirildi.");
      }));
      Array.from(el.workersBody.querySelectorAll("[data-advance-w]")).forEach((b) => b.addEventListener("click", () => openAdvanceForm("oylik_avans", b.getAttribute("data-advance-w"))));
      Array.from(el.workersBody.querySelectorAll("[data-edit-w]")).forEach((b) => b.addEventListener("click", () => {
        const w = state.finance.workers.find(x => x.id === b.getAttribute("data-edit-w")); if (!w) return;
        editState.workerId = w.id;
        document.getElementById("wPhone").value = w.phone || "";
        el.wName.value = w.name; el.wRole.value = w.role; el.wSalary.value = w.salary;
        setFormEditMode(el.workerForm, el.workerSubmitBtn, el.workerCancelEdit, true);
      }));
    }

    // Manfiy hisobning ikki sababi bo'lishi mumkin: oy zarari ulushi va ulushdan ortiq olingan avans.
    function founderDebtParts(f) {
      const lossShare = Math.max(-f.base, 0);
      const overdrawn = roundMoney(Math.max(f.founderAdvance - Math.max(f.base, 0), 0));
      return { lossShare, overdrawn };
    }
    function founderStatus(final) {
      if (final < 0) return `<span class="pill s-over">Kompaniyaga qarzdor</span>`;
      if (final > 0) return `<span class="pill s-done">Olishi kerak</span>`;
      return `<span class="pill s-new">Hisob yopiq</span>`;
    }

    function renderFounders() {
      const s = summary();
      el.founderCalcList.innerHTML = [
        calcStep(s.founderPoolRaw < 0 ? "Ta'sischilar fondi (zarar)" : "Ta'sischilar fondi", s.founderPoolRaw, "", "Hisob-kitob markazidagi formula bo'yicha"),
        calcStep(`Ta'sischilarga tegishli qism (${Math.min(s.founderShareTotal, 100).toFixed(2)}%)`, roundMoney(s.founderPoolRaw - s.unassignedAmount)),
        ...(s.unassignedShare > 0 && state.finance.founders.length ? [calcStep(`Taqsimlanmagan ${s.unassignedShare.toFixed(2)}% — kompaniyada qoladi`, s.unassignedAmount)] : []),
        calcStep("Ta'sischilar olgan avanslar", roundMoney(s.founderAdvanceTotal - s.removedFounderAdvance), "minus"),
        calcStep("Yakuniy qoldiq (ulush − avans)", roundMoney(s.founderPayable - s.founderOwes), "total"),
        calcStep("shundan ta'sischilarga to'lanadi", s.founderPayable, "", "Qoldig'i musbat ta'sischilar"),
        ...(s.founderOwes > 0 ? [`<li><span>shundan ta'sischilarning kompaniyaga qarzi<span class="note">Zarar ulushi va ulushdan ortiq olingan avans</span></span><b class="neg">${fmt(-s.founderOwes)}</b></li>`] : [])
      ].join("");
      if (!state.finance.founders.length) { el.foundersBody.innerHTML = `<tr><td colspan="8">Hozircha ta'sischi yo'q.</td></tr>`; return; }
      el.foundersBody.innerHTML = s.founderRows.map((f) => `<tr>
        <td>${clean(f.name)}${f.phone ? `<br><small>${clean(f.phone)}</small>` : ""}</td><td class="num">${num(f.share).toFixed(2)}%</td><td>${clean(f.note || "-")}</td>
        <td class="num">${money(f.base)}</td>
        <td class="num">${fmt(f.founderAdvance)}<div class="expense-order-detail">${founderAdvanceProjectDetails(f.id)}</div></td>
        <td class="num"><b>${money(f.final)}</b>${f.final < 0 ? (() => { const d = founderDebtParts(f); return `<div class="expense-order-detail">${d.lossShare ? `zarar ulushi ${fmt(d.lossShare)}` : ""}${d.lossShare && d.overdrawn ? "<br>" : ""}${d.overdrawn ? `ortiqcha avans ${fmt(d.overdrawn)}` : ""}</div>`; })() : ""}</td>
        <td>${founderStatus(f.final)}</td>
        <td>
          ${hasPerm("expenses") ? `<button class="small-btn" type="button" data-advance-f="${clean(f.id)}">Avans berish</button>` : ""}
          <button class="ghost small-btn" type="button" data-edit-f="${clean(f.id)}">Tahrirlash</button>
          <button class="danger small-btn" type="button" data-del-f="${clean(f.id)}">O'chirish</button>
        </td>
      </tr>`).join("");
      Array.from(el.foundersBody.querySelectorAll("[data-del-f]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-f");
        const founder = state.finance.founders.find(f => f.id === id);
        if (!founder || !confirm(`"${founder.name}" ta'sischini o'chirasizmi?`)) return;
        if (editState.founderId === id) resetFounderForm();
        commitFinance(f => { f.founders = f.founders.filter(x => x.id !== id); }, el.founderMsg, "Ta'sischi o'chirildi.");
      }));
      Array.from(el.foundersBody.querySelectorAll("[data-advance-f]")).forEach((b) => b.addEventListener("click", () => openAdvanceForm("founder_avans", b.getAttribute("data-advance-f"))));
      Array.from(el.foundersBody.querySelectorAll("[data-edit-f]")).forEach((b) => b.addEventListener("click", () => {
        const f = state.finance.founders.find(x => x.id === b.getAttribute("data-edit-f")); if (!f) return;
        editState.founderId = f.id;
        el.fName.value = f.name; el.fShare.value = f.share; el.fNote.value = f.note || ""; el.fPhone.value = f.phone || "";
        setFormEditMode(el.founderForm, el.founderSubmitBtn, el.founderCancelEdit, true);
      }));
    }

    function keepValue(select, render) {
      const previous = select.value;
      render();
      if (previous && Array.from(select.options).some(option => option.value === previous)) select.value = previous;
    }
    function fillExpenseRelatedSelects() {
      keepValue(el.eWorkerId, () => { el.eWorkerId.innerHTML = state.finance.workers.map(w => `<option value="${clean(w.id)}">${clean(w.name)} (${clean(w.role)})</option>`).join(""); });
      keepValue(el.eFounderId, () => { el.eFounderId.innerHTML = state.finance.founders.map(f => `<option value="${clean(f.id)}">${clean(f.name)}</option>`).join(""); });
      renderAllocationRows();
    }
    // Ishchi avansi/oyligi va ta'sischi avansida zakaz tanlash ixtiyoriy.
    const PERSON_EXPENSE_TYPES = ["oylik_avans", "oylik_tolov", "founder_avans"];
    const isPersonExpense = () => PERSON_EXPENSE_TYPES.includes(el.eType.value);
    function toggleExpenseTypeInputs() {
      const t = el.eType.value;
      el.eWorkerWrap.classList.toggle("hidden", t !== "oylik_avans" && t !== "oylik_tolov");
      el.eFounderWrap.classList.toggle("hidden", t !== "founder_avans");
      const title = document.getElementById("allocationTitle");
      if (title) title.textContent = isPersonExpense() ? "Zakaz (ixtiyoriy) — avans ma'lum zakaz pulidan berilgan bo'lsa tanlang" : "Zakazlarga taqsimlash";
      const help = document.getElementById("allocationHelp");
      if (help) {
        help.dataset.default ||= help.textContent;
        help.textContent = isPersonExpense() ? "Zakazni bo'sh qoldirsangiz, avans umumiy hisoblanadi. Zakaz tanlasangiz, summa shu zakazlarga to'liq taqsimlanishi kerak." : help.dataset.default;
      }
      // Ta'sischi avansida zakaz = pul olingan zakazning o'zi, alohida "pul manbai" kerak emas.
      renderAllocationRows();
    }
    // Ishchilar/Ta'sischilar jadvalidagi "Avans berish" va Xarajatlardagi tezkor tugmalar shu formani ochadi.
    function openAdvanceForm(type, personId = "") {
      if (!showPage("expenses")) return;
      resetExpenseForm();
      el.eType.value = type;
      toggleExpenseTypeInputs();
      if (personId && type === "founder_avans") el.eFounderId.value = personId;
      else if (personId) el.eWorkerId.value = personId;
      renderAllocationRows([]);
      el.expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => el.eAmount.focus(), 300);
      msg(el.expenseMsg, type === "founder_avans" ? "Ta'sischi avansi: summani kiriting va saqlang." : "Ishchi avansi: summani kiriting va saqlang.", "warn");
    }

    function expenseAllocations(expense) {
      if (Array.isArray(expense.allocations) && expense.allocations.length) return expense.allocations;
      if (expense.sourceProjectId) {
        return [{ projectId: expense.sourceProjectId, projectName: expense.sourceProjectName || "", amount: num(expense.amount) }];
      }
      return [];
    }

    // Xarajat qaysi zakaz pulidan to'langani: berilmagan bo'lsa — o'sha zakazning o'zi.
    function allocationFundingId(expense, allocation) {
      return expense.type === "founder_avans" ? allocation.projectId : (allocation.fundedByProjectId || allocation.projectId);
    }

    function knownProjectName(id, fallback = "") {
      return state.finance.projects.find(project => project.id === id)?.name
        || fallback
        || state.finance.expenses.flatMap(expenseAllocations).find(a => a.projectId === id)?.projectName
        || state.finance.expenses.flatMap(expenseAllocations).find(a => a.fundedByProjectId === id)?.fundedByProjectName
        || "O'chirilgan zakaz";
    }

    function allocationProjectOptions(selectedId = "", { placeholder = "Zakazni tanlang", allowEmpty = false } = {}) {
      const options = state.finance.projects.map(project =>
        `<option value="${clean(project.id)}" ${project.id === selectedId ? "selected" : ""}>${clean(project.name)}${project.client ? ` — ${clean(project.client)}` : ""}</option>`
      );
      if (selectedId && !state.finance.projects.some(project => project.id === selectedId)) {
        options.unshift(`<option value="${clean(selectedId)}" selected>${clean(knownProjectName(selectedId))} (faol emas)</option>`);
      }
      const first = allowEmpty
        ? `<option value="" ${selectedId ? "" : "selected"}>${placeholder}</option>`
        : `<option value="" ${selectedId ? "" : "selected"} disabled>${placeholder}</option>`;
      return first + options.join("");
    }

    function renderAllocationRows(allocations = null) {
      if (!el.expenseAllocations) return;
      const existingRows = allocations === null ? Array.from(el.expenseAllocations.querySelectorAll("[data-allocation-row]")).map(row => ({
        projectId: row.querySelector("[data-allocation-project]")?.value || "",
        fundedByProjectId: row.querySelector("[data-allocation-source]")?.value || "",
        amount: row.querySelector("[data-allocation-amount]")?.value || ""
      })) : allocations;
      const rows = existingRows.length ? existingRows : [{ projectId: "", fundedByProjectId: "", amount: "" }];
      const founderMode = el.eType.value === "founder_avans";
      const optional = isPersonExpense();
      el.expenseAllocations.innerHTML = rows.map((allocation, index) => `
        <div class="allocation-row${founderMode ? " no-source" : ""}" data-allocation-row>
          <label class="allocation-select-label">${founderMode ? "Pul olingan zakaz" : optional ? "Zakaz" : "Xarajat qaysi zakaz uchun"} ${rows.length > 1 ? index + 1 : ""}<select data-allocation-project ${optional ? "" : "required"}>${allocationProjectOptions(allocation.projectId || "", optional ? { placeholder: "Zakazsiz (umumiy)", allowEmpty: true } : {})}</select></label>
          <label class="allocation-source">Pul qaysi zakazdan olindi<select data-allocation-source>${allocationProjectOptions(allocation.fundedByProjectId && allocation.fundedByProjectId !== allocation.projectId ? allocation.fundedByProjectId : "", { placeholder: "Shu zakazning o'z pulidan", allowEmpty: true })}</select></label>
          <label>Summa (UZS)<input data-allocation-amount inputmode="decimal" value="${clean(allocation.amount)}" placeholder="0" ${optional ? "" : "required"} /></label>
          <button class="danger small-btn" type="button" data-remove-allocation aria-label="Zakaz taqsimotini o'chirish">O'chirish</button>
        </div>`).join("");
      updateAllocationTotal();
    }

    function updateAllocationTotal() {
      if (!el.allocationTotal || !el.expenseAllocations) return;
      const assigned = roundMoney(Array.from(el.expenseAllocations.querySelectorAll("[data-allocation-amount]"))
        .reduce((total, input) => total + (parseMoney(input.value) || 0), 0));
      const amount = parseMoney(el.eAmount.value) || 0;
      if (isPersonExpense() && !readExpenseAllocations().length) {
        el.allocationTotal.textContent = "Zakazga bog'lanmagan umumiy avans — bu ham to'g'ri. Zakaz pulidan berilgan bo'lsa, zakazni tanlang.";
        el.allocationTotal.classList.add("is-valid");
        el.allocationTotal.classList.remove("is-invalid");
        return;
      }
      const matches = amount > 0 && Math.abs(assigned - amount) < 0.01;
      const diff = roundMoney(amount - assigned);
      el.allocationTotal.textContent = !amount && !assigned
        ? "Avval xarajat summasini kiriting, keyin uni zakazlarga taqsimlang."
        : `Taqsimlangan: ${fmt(assigned)} / ${fmt(amount)}${matches ? " — to'liq" : diff > 0 ? ` — yana ${fmt(diff)} taqsimlash kerak` : ` — ${fmt(-diff)} ortiqcha taqsimlangan`}`;
      el.allocationTotal.classList.toggle("is-valid", matches);
      el.allocationTotal.classList.toggle("is-invalid", !matches);
    }

    function readExpenseAllocations() {
      const founderMode = el.eType.value === "founder_avans";
      const optional = isPersonExpense();
      return Array.from(el.expenseAllocations.querySelectorAll("[data-allocation-row]")).filter(row =>
        // Avansda bo'sh qoldirilgan qator hisobga olinmaydi.
        !optional || row.querySelector("[data-allocation-project]").value || String(row.querySelector("[data-allocation-amount]").value).trim()
      ).map(row => {
        const projectId = row.querySelector("[data-allocation-project]").value;
        const fundedBy = founderMode ? "" : (row.querySelector("[data-allocation-source]")?.value || "");
        const allocation = {
          projectId,
          projectName: knownProjectName(projectId, ""),
          amount: parseMoney(row.querySelector("[data-allocation-amount]").value)
        };
        if (fundedBy && fundedBy !== projectId) {
          allocation.fundedByProjectId = fundedBy;
          allocation.fundedByProjectName = knownProjectName(fundedBy, "");
        }
        return allocation;
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

    // Zakazlar bo'yicha pul oqimi: xarajat (kimga tegishli) va kassa (kimning pulidan).
    function orderFlows() {
      const rows = new Map();
      const ensure = (id, name) => {
        if (!rows.has(id)) {
          const project = state.finance.projects.find(p => p.id === id) || null;
          rows.set(id, { id, project, name: project?.name || knownProjectName(id, name), cost: 0, founderAdvances: new Map(), received: 0, cashUsed: 0, borrowed: 0, lent: 0 });
        }
        return rows.get(id);
      };
      state.finance.projects.forEach(project => ensure(project.id, project.name));
      state.finance.payments.forEach(payment => { if (payment.projectId) ensure(payment.projectId, payment.projectName).received += num(payment.amount); });
      const unassigned = { cost: 0, founderAdvances: new Map() };
      const pairs = new Map();
      const suspicious = [];
      state.finance.expenses.forEach(expense => {
        const allocations = expenseAllocations(expense);
        if (!allocations.length) {
          if (expense.type === "founder_avans") unassigned.founderAdvances.set(expense.founderId || "unknown", (unassigned.founderAdvances.get(expense.founderId || "unknown") || 0) + num(expense.amount));
          else unassigned.cost += num(expense.amount);
        }
        allocations.forEach(allocation => {
          const amount = num(allocation.amount);
          const target = ensure(allocation.projectId, allocation.projectName);
          const sourceId = allocationFundingId(expense, allocation);
          const source = ensure(sourceId, allocation.fundedByProjectName);
          source.cashUsed += amount;
          if (expense.type === "founder_avans") {
            const key = expense.founderId || "unknown";
            target.founderAdvances.set(key, (target.founderAdvances.get(key) || 0) + amount);
            return;
          }
          target.cost += amount;
          if (sourceId !== allocation.projectId) {
            target.borrowed += amount;
            source.lent += amount;
            const key = `${sourceId}|${allocation.projectId}`;
            pairs.set(key, (pairs.get(key) || 0) + amount);
          }
        });
        // Izohda boshqa zakaz nomi yozilgan, lekin xarajat unga biriktirilmagan bo'lsa — ehtimol xato zakazga yozilgan.
        const note = String(expense.note || "").toLowerCase();
        if (note && expense.type !== "founder_avans") {
          const linked = new Set(allocations.flatMap(a => [a.projectId, allocationFundingId(expense, a)]));
          const mentioned = state.finance.projects.find(p => String(p.name || "").trim().length >= 3 && !linked.has(p.id) && note.includes(String(p.name).trim().toLowerCase()));
          if (mentioned) suspicious.push({ expenseId: expense.id, projectName: mentioned.name });
        }
      });
      // Qarama-qarshi qarzlarni o'zaro hisoblaymiz: A→B 300, B→A 100 bo'lsa, A→B 200.
      const borrowings = [];
      const seen = new Set();
      pairs.forEach((amount, key) => {
        if (seen.has(key)) return;
        const [from, to] = key.split("|");
        const reverseKey = `${to}|${from}`;
        seen.add(key); seen.add(reverseKey);
        const net = roundMoney(amount - (pairs.get(reverseKey) || 0));
        if (Math.abs(net) < 0.01) return;
        borrowings.push(net > 0 ? { from, to, amount: net } : { from: to, to: from, amount: -net });
      });
      return { rows: Array.from(rows.values()), unassigned, borrowings, suspicious };
    }

    function renderOrderExpenseSummary() {
      const flows = orderFlows();
      const founderName = id => state.finance.founders.find(f => f.id === id)?.name || "Noma'lum ta'sischi";
      const advanceText = map => Array.from(map, ([id, amount]) => `${clean(founderName(id))}: <span class="nowrap">${fmt(amount)}</span>`).join("<br>");
      const nameOf = id => clean(flows.rows.find(r => r.id === id)?.name || knownProjectName(id));
      const borrowNode = document.getElementById("orderBorrowings");
      if (borrowNode) {
        borrowNode.innerHTML = flows.borrowings.length ? `<div class="borrow-list">${flows.borrowings.map(b => `
          <div class="borrow-item"><b>${nameOf(b.from)}</b><span class="borrow-arrow">pulidan →</span><b>${nameOf(b.to)}</b><span class="borrow-arrow">uchun ishlatilgan:</span><b>${fmt(b.amount)}</b>
          <span class="expense-order-detail" style="flex-basis:100%;margin:0;">${nameOf(b.to)} mijozi to'laganda bu summa ${nameOf(b.from)} kassasiga qaytariladi. Foyda hisobida xarajat ${nameOf(b.to)} zakaziga yozilgan.</span></div>`).join("")}</div>` : "";
      }
      const rows = flows.rows
        .filter(r => r.project || r.cost || r.founderAdvances.size || r.cashUsed || r.received)
        .map(r => {
          const advanceTotal = Array.from(r.founderAdvances.values()).reduce((a, v) => a + v, 0);
          const amount = r.project ? num(r.project.amount) : null;
          const profit = amount === null ? null : roundMoney(amount - r.cost - advanceTotal);
          const cash = roundMoney(r.received - r.cashUsed);
          return `<tr>
            <td>${clean(r.name)}${r.project ? (r.project.carriedFromMonth ? `<div class="expense-order-detail">${clean(r.project.carriedFromMonth)} oyidan ko'chgan</div>` : "") : `<div class="expense-order-detail">faol emas</div>`}</td>
            <td class="num">${amount === null ? "-" : fmt(amount)}</td>
            <td class="num">${fmt(r.cost)}</td>
            <td>${advanceText(r.founderAdvances) || `<span class="expense-order-detail">Olinmagan</span>`}</td>
            <td class="num">${profit === null ? "-" : `<b>${money(profit)}</b>`}</td>
            <td class="num">${fmt(r.received)}</td>
            <td class="num">${r.borrowed ? `<span class="neg">${fmt(r.borrowed)}</span>` : "—"}</td>
            <td class="num">${r.lent ? fmt(r.lent) : "—"}</td>
            <td class="num"><b>${money(cash)}</b></td>
          </tr>`;
        });
      const unassignedAdvance = Array.from(flows.unassigned.founderAdvances.values()).reduce((a, v) => a + v, 0);
      if (flows.unassigned.cost || unassignedAdvance) {
        rows.push(`<tr>
          <td>Umumiy / eski yozuvlar<div class="expense-order-detail">zakaz ko'rsatilmagan</div></td><td class="num">-</td><td class="num">${fmt(flows.unassigned.cost)}</td>
          <td>${advanceText(flows.unassigned.founderAdvances) || "—"}</td><td class="num">-</td><td class="num">-</td><td class="num">—</td><td class="num">—</td><td class="num">-</td>
        </tr>`);
      }
      el.orderExpensesBody.innerHTML = rows.length ? rows.join("") : `<tr><td colspan="9">Hozircha zakazlar yoki xarajatlar yo'q.</td></tr>`;
    }

    function renderExpenses() {
      if (!state.finance.expenses.length) {
        el.expensesBody.innerHTML = `<tr><td colspan="8">Hozircha xarajat yo'q.</td></tr>`;
        renderOrderExpenseSummary();
        return;
      }
      const suspicious = new Map(orderFlows().suspicious.map(item => [item.expenseId, item.projectName]));
      el.expensesBody.innerHTML = state.finance.expenses.map((e) => {
        const worker = e.workerId ? state.finance.workers.find(w => w.id === e.workerId)?.name || e.workerName : "";
        const founder = e.founderId ? state.finance.founders.find(f => f.id === e.founderId)?.name || e.founderName : "";
        const target = worker || founder || "-";
        const allocations = expenseAllocations(e);
        const projectCell = allocations.length
          ? allocations.map(allocation => {
              const name = clean(knownProjectName(allocation.projectId, allocation.projectName));
              const sourceId = allocationFundingId(e, allocation);
              const borrowed = sourceId !== allocation.projectId
                ? `<div class="expense-order-detail">puli <b>${clean(knownProjectName(sourceId, allocation.fundedByProjectName))}</b> zakazidan olingan</div>` : "";
              return `${name} <span class="expense-order-detail">(${fmt(allocation.amount)})</span>${borrowed}`;
            }).join("<br>")
          : PERSON_EXPENSE_TYPES.includes(e.type) ? "Zakazsiz (umumiy)" : "Zakaz biriktirilmagan (eski yozuv)";
        const warning = suspicious.has(e.id)
          ? `<div class="row-warning" title="Tahrirlash orqali to'g'ri zakazni yoki pul manbaini tanlang">⚠ Izohda «${clean(suspicious.get(e.id))}» bor — zakaz to'g'ri tanlanganini tekshiring</div>` : "";
        const paymentType = EXPENSE_PAYMENT_LABEL[e.paymentType] || (e.paymentType ? clean(e.paymentType) : "Ko'rsatilmagan");
        return `<tr>
          <td>${clean(e.date)}</td><td>${EXPENSE_LABEL[e.type] || clean(e.type)}</td><td class="num">${fmt(e.amount)}</td><td>${paymentType}</td><td>${clean(target)}</td><td>${projectCell}${warning}</td><td>${clean(e.note || "-")}</td>
          <td>
            <button class="ghost small-btn" type="button" data-edit-e="${clean(e.id)}">Tahrirlash</button>
            <button class="danger small-btn" type="button" data-del-e="${clean(e.id)}">O'chirish</button>
          </td>
        </tr>`;
      }).join("");
      Array.from(el.expensesBody.querySelectorAll("[data-del-e]")).forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-del-e");
        const expense = state.finance.expenses.find(e => e.id === id);
        if (!expense || !confirm(`${EXPENSE_LABEL[expense.type] || expense.type} xarajatini (${fmt(expense.amount)}) o'chirasizmi?`)) return;
        if (editState.expenseId === id) resetExpenseForm();
        commitFinance(f => { f.expenses = f.expenses.filter(e => e.id !== id); }, el.expenseMsg, "Xarajat o'chirildi.");
      }));
      Array.from(el.expensesBody.querySelectorAll("[data-edit-e]")).forEach((b) => b.addEventListener("click", () => {
        const e = state.finance.expenses.find(x => x.id === b.getAttribute("data-edit-e")); if (!e) return;
        editState.expenseId = e.id;
        el.eDate.value = e.date; el.eType.value = e.type; el.eAmount.value = e.amount; el.ePaymentType.value = e.paymentType || "naqd"; el.eNote.value = e.note || "";
        fillExpenseRelatedSelects(); renderAllocationRows(expenseAllocations(e)); toggleExpenseTypeInputs();
        if (e.workerId) el.eWorkerId.value = e.workerId;
        if (e.founderId) el.eFounderId.value = e.founderId;
        setFormEditMode(el.expenseForm, el.expenseSubmitBtn, el.expenseCancelEdit, true);
        el.expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
      renderOrderExpenseSummary();
    }

    function fillPaymentProjectSelect() {
      if (!el.paymentProjectId) return;
      keepValue(el.paymentProjectId, () => el.paymentProjectId.innerHTML = state.finance.projects.map(project => {
        const due = Math.max(num(project.amount) - num(project.advance), 0);
        return `<option value="${clean(project.id)}">${clean(project.name)} — qolgan ${fmt(due)}</option>`;
      }).join(""));
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
      Array.from(el.paymentsBody.querySelectorAll("[data-delete-payment]")).forEach(button => button.addEventListener("click", () => {
        const id = button.getAttribute("data-delete-payment");
        const payment = state.finance.payments.find(item => item.id === id);
        if (!payment || !confirm(`${fmt(payment.amount)} to'lovni o'chirasizmi? Zakaz qarzi shu summaga ko'payadi.`)) return;
        commitFinance(f => {
          const target = f.payments.find(item => item.id === id);
          if (!target) return "To'lov topilmadi.";
          const project = f.projects.find(item => item.id === target.projectId);
          // Advance to'lovlar yig'indisiga teng bo'lishi kerak: server ham shuni tekshiradi.
          if (project) project.advance = Math.max(num(project.advance) - num(target.amount), 0);
          f.payments = f.payments.filter(item => item.id !== id);
        }, el.paymentMsg, "To'lov o'chirildi.");
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
            <td>${isSuperAdmin() && !closed ? `<button class="ghost small-btn" type="button" data-close-debt="${clean(archive.id)}|${clean(p.id)}">Qarz yopildi</button>` : "-"}</td>
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
      Array.from(el.archiveBody.querySelectorAll("[data-close-debt]")).forEach((btn) => btn.addEventListener("click", () => {
        const [archiveId, projectId] = String(btn.getAttribute("data-close-debt") || "").split("|");
        if (!confirm("Bu arxiv zakazi qarzini yopilgan deb belgilaysizmi? To'lov yozuvi yaratilmaydi.")) return;
        commitFinance(f => {
          f.archives = (f.archives || []).map((archive) => archive.id !== archiveId ? archive : {
            ...archive,
            projects: (archive.projects || []).map((project) => project.id === projectId ? { ...project, debtClosed: true, debtClosedAt: new Date().toISOString() } : project)
          });
        }, el.archiveMsg, "Qarz yopildi.");
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
        // Ta'sischi avansi foydani taqsimlash: xarajat emas, alohida hisoblanadi.
        kind: row.kind === "expense" && row.record.type === "founder_avans" ? "founder" : row.kind,
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
        founderAdvances: 0,
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
        } else if (row.kind === "founder") {
          target.founderAdvances += num(row.record.amount);
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
          founderAdvances: total.founderAdvances + row.founderAdvances,
          paymentCount: total.paymentCount + row.paymentCount,
          expenseCount: total.expenseCount + row.expenseCount
        }), { income: 0, expenses: 0, founderAdvances: 0, paymentCount: 0, expenseCount: 0 });
    }

    // ---------- Diagramma dvigateli (canvas, HiDPI, tooltip) ----------
    const CHART_FONT = '"Inter", "Segoe UI", system-ui, sans-serif';
    function compactMoney(value) {
      const abs = Math.abs(value), sign = value < 0 ? "−" : "";
      const short = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");
      if (abs >= 1e9) return `${sign}${short(abs / 1e9)} mlrd`;
      if (abs >= 1e6) return `${sign}${short(abs / 1e6)} mln`;
      if (abs >= 1e3) return `${sign}${short(abs / 1e3)} ming`;
      return `${sign}${Math.round(abs)}`;
    }
    function chartColors() {
      const cs = getComputedStyle(document.body);
      const v = (name) => cs.getPropertyValue(name).trim();
      return {
        surface: v("--surface"), grid: v("--chart-grid"), axis: v("--chart-axis"), text: v("--text"), text2: v("--text-2"),
        s1: v("--series-1"), s2: v("--series-2"), s3: v("--series-3"), s4: v("--series-4"), neg: v("--negative")
      };
    }
    function prepareCanvas(canvas) {
      if (!canvas || !canvas.offsetParent) return null; // yashirin sahifa: ochilganda chiziladi
      const height = Number(canvas.dataset.height) || 260;
      const width = Math.max(Math.round(canvas.getBoundingClientRect().width), 240);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.height = `${height}px`;
      if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
      if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.textBaseline = "middle";
      ctx.font = `12px ${CHART_FONT}`;
      canvas._hits = [];
      bindChartHover(canvas);
      return { ctx, width, height, c: chartColors() };
    }
    // Ustun: ma'lumot uchi 4px yumaloq, asosi to'g'ri burchak.
    function barPath(ctx, x, y, w, h, direction = "up") {
      const r = Math.min(4, Math.abs(w) / 2, Math.abs(h));
      ctx.beginPath();
      if (direction === "up") {
        ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h);
      } else if (direction === "right") {
        ctx.moveTo(x, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x, y + h);
      } else { // left
        ctx.moveTo(x + w, y); ctx.lineTo(x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
        ctx.lineTo(x, y + h - r); ctx.quadraticCurveTo(x, y + h, x + r, y + h); ctx.lineTo(x + w, y + h);
      }
      ctx.closePath();
    }
    function niceStep(max, count = 4) {
      if (max <= 0) return 1;
      const raw = max / count, mag = 10 ** Math.floor(Math.log10(raw)), norm = raw / mag;
      return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    }
    function emptyChart(p, text = "Bu davrda ma'lumot yo'q") {
      p.ctx.fillStyle = p.c.axis; p.ctx.textAlign = "center"; p.ctx.font = `13px ${CHART_FONT}`;
      p.ctx.fillText(text, p.width / 2, p.height / 2);
    }
    let chartTipNode = null;
    function chartTip() {
      if (!chartTipNode) {
        chartTipNode = document.createElement("div");
        chartTipNode.className = "chart-tooltip";
        chartTipNode.setAttribute("role", "status");
        document.body.appendChild(chartTipNode);
        window.addEventListener("scroll", hideChartTip, { passive: true });
      }
      return chartTipNode;
    }
    function hideChartTip() { if (chartTipNode) chartTipNode.classList.remove("show"); }
    const tipRow = (color, label, value) => `<div class="tt-row"><span>${color ? `<i class="dot" style="background:${color}"></i>` : ""}${label}</span><b>${value}</b></div>`;
    function bindChartHover(canvas) {
      if (canvas._hoverBound) return;
      canvas._hoverBound = true;
      const show = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left, y = event.clientY - rect.top;
        const hit = (canvas._hits || []).find(h => h.test ? h.test(x, y) : x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
        if (!hit) return hideChartTip();
        const tip = chartTip();
        tip.innerHTML = hit.html;
        tip.classList.add("show");
        const w = tip.offsetWidth, h = tip.offsetHeight;
        let left = event.clientX + 14, top = event.clientY - h - 12;
        if (left + w > window.innerWidth - 8) left = event.clientX - w - 14;
        if (top < 8) top = event.clientY + 16;
        tip.style.left = `${Math.max(8, left)}px`;
        tip.style.top = `${top}px`;
      };
      canvas.addEventListener("pointermove", show);
      canvas.addEventListener("pointerdown", show);
      canvas.addEventListener("pointerleave", hideChartTip);
    }

    // Daromad va xarajat ustunlari (12 oy). Tanlangan oy ajratib ko'rsatiladi.
    function drawCompareChart(canvas, legend, rows, highlightMonth = null) {
      if (!canvas) return;
      const totalIncome = rows.filter(r => !highlightMonth || r.month === highlightMonth).reduce((a, r) => a + r.income, 0);
      const totalExpense = rows.filter(r => !highlightMonth || r.month === highlightMonth).reduce((a, r) => a + r.expenses, 0);
      const colors = chartColors();
      if (legend) legend.innerHTML = `<span><i class="dot" style="background:${colors.s1}"></i>Daromad <b>${fmt(totalIncome)}</b></span><span><i class="dot" style="background:${colors.s2}"></i>Xarajat <b>${fmt(totalExpense)}</b></span>`;
      const p = prepareCanvas(canvas);
      if (!p) return;
      const { ctx, width, height, c } = p;
      const max = Math.max(0, ...rows.flatMap(r => [r.income, r.expenses]));
      if (!max) return emptyChart(p);
      const left = 62, right = 10, top = 12, bottom = 28;
      const plotW = width - left - right, plotH = height - top - bottom;
      const step = niceStep(max), ticks = Math.max(1, Math.ceil(max / step)), scaleMax = step * ticks;
      ctx.lineWidth = 1;
      for (let i = 0; i <= ticks; i++) {
        const y = Math.round(top + plotH - plotH * i / ticks) + .5;
        ctx.strokeStyle = c.grid; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
        ctx.fillStyle = c.axis; ctx.textAlign = "right"; ctx.font = `11px ${CHART_FONT}`;
        ctx.fillText(compactMoney(step * i), left - 8, y);
      }
      const groupW = plotW / rows.length;
      const barW = Math.max(3, Math.min(24, (groupW - 10) / 2));
      rows.forEach((row, index) => {
        const cx = left + groupW * (index + .5);
        const active = !highlightMonth || row.month === highlightMonth;
        if (highlightMonth && row.month === highlightMonth) {
          ctx.fillStyle = c.grid; ctx.globalAlpha = .55; ctx.fillRect(cx - groupW / 2 + 2, top, groupW - 4, plotH); ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = active ? 1 : .35;
        [[row.income, c.s1, cx - 1 - barW], [row.expenses, c.s2, cx + 1]].forEach(([value, color, x]) => {
          if (value <= 0) return;
          const h = Math.max(2, value / scaleMax * plotH);
          ctx.fillStyle = color; barPath(ctx, x, top + plotH - h, barW, h, "up"); ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.fillStyle = active ? c.text2 : c.axis; ctx.textAlign = "center";
        ctx.font = `${active && highlightMonth ? "600 " : ""}11px ${CHART_FONT}`;
        ctx.fillText(groupW < 34 ? row.label.slice(0, 1) : row.label.slice(0, 3), cx, height - 12);
        const net = row.income - row.expenses;
        canvas._hits.push({ x: cx - groupW / 2, y: top, w: groupW, h: plotH + bottom, html:
          `<div class="tt-title">${row.label} ${row.month.slice(0, 4)}</div>${tipRow(c.s1, "Daromad", fmt(row.income))}${tipRow(c.s2, "Xarajat", fmt(row.expenses))}${tipRow("", "Sof foyda", `<span class="${net < 0 ? "neg" : ""}">${fmt(net)}</span>`)}${row.founderAdvances ? tipRow("", "Ta'sischi avansi", fmt(row.founderAdvances)) : ""}` });
      });
      ctx.strokeStyle = c.axis; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(left, top + plotH + .5); ctx.lineTo(width - right, top + plotH + .5); ctx.stroke(); ctx.globalAlpha = 1;
    }

    const kpiCard = (item) => `<div class="kpi card ${item.cls}"><div><h3>${item.title}</h3><div class="v${item.negative ? " is-negative" : ""}">${item.value}</div></div><div class="meta">${item.meta}</div></div>`;

    function renderDashboardPeriod() {
      if (!el.dashboardYear || !el.dashboardMonth) return;
      const year = el.dashboardYear.value;
      const month = el.dashboardMonth.value;
      const totals = selectedPeriodTotals(year, month);
      const periodName = month === "all" ? `${year}-yil` : `${MONTH_LABELS[Number(month) - 1]} ${year}`;
      const net = roundMoney(totals.income - totals.expenses);
      const projectCount = state.finance.projects.length;
      const unpaid = state.finance.projects.reduce((sum, project) => sum + Math.max(num(project.amount) - num(project.advance), 0), 0);
      const debtors = state.finance.projects.filter(project => num(project.amount) - num(project.advance) > 0.01).length;
      const statuses = state.finance.projects.map(liveStatus);
      const count = (s) => statuses.filter(x => x === s).length;
      const completed = count("Yakunlangan");
      const active = Math.max(projectCount - completed, 0);
      el.kpiGrid.innerHTML = [
        { title: "Daromad (tushgan pul)", value: fmt(totals.income), meta: `${periodName} · ${totals.paymentCount} ta to'lov`, cls: "income" },
        { title: "Xarajat", value: fmt(totals.expenses), meta: `${periodName} · ${totals.expenseCount} ta yozuv`, cls: "warn-kpi" },
        { title: "Sof foyda (kassa)", value: fmt(net), meta: net < 0 ? "Xarajat daromaddan ko'p" : "Daromad − xarajat", cls: net < 0 ? "danger-kpi" : "profit-kpi", negative: net < 0 },
        { title: "Ta'sischi avanslari", value: fmt(totals.founderAdvances), meta: "Foydadan olingan, xarajatga kirmaydi", cls: "neutral-kpi" },
        { title: "Mijozlar qarzi", value: fmt(unpaid), meta: `${debtors} ta zakaz bo'yicha yig'ilishi kerak`, cls: "danger-kpi" },
        { title: "Loyihalar", value: `${active} <span style="font-size:14px;font-weight:600;color:var(--muted)">faol</span>`, meta: `${completed} ta tugallangan · jami ${projectCount} ta`, cls: "cash" }
      ].map(kpiCard).join("");
      el.dashboardChartCaption.textContent = month === "all" ? `${year}-yil, oylar bo'yicha` : `${periodName} ajratib ko'rsatilgan`;
      const c = chartColors();
      const statusDefs = [
        ["Yangi", "var(--info)"], ["Jarayonda", "var(--warn)"], ["Topshirish vaqti", c.s4],
        ["Kechiktirilgan zakaz", "var(--danger)"], ["Yakunlangan", "var(--ok)"]
      ];
      const bar = projectCount ? statusDefs.filter(([s]) => count(s)).map(([s, color]) => `<span title="${s}: ${count(s)}" style="width:${count(s) / projectCount * 100}%;background:${color}"></span>`).join("") : "";
      el.projectStatusSummary.innerHTML = `
        <div class="status-bar" role="img" aria-label="Loyihalar holati">${bar}</div>
        ${statusDefs.map(([s, color]) => `<div class="status-stat"><span><i class="dot" style="background:${color}"></i> ${s === "Kechiktirilgan zakaz" ? "Kechikkan" : s}</span><strong>${count(s)}</strong></div>`).join("")}
        <div class="status-stat"><span>Ochiq qarzdorlik</span><strong>${fmt(unpaid)}</strong></div>`;
      drawCompareChart(el.financeTrendChart, el.financeTrendLegend, monthsForYear(year), month === "all" ? null : `${year}-${month}`);
    }

    function renderReports() {
      if (!el.reportYear || !el.reportMonth) return;
      const year = el.reportYear.value;
      const month = el.reportMonth.value;
      const months = monthsForYear(year);
      const totals = selectedPeriodTotals(year, month);
      const periodName = month === "all" ? `${year}-yil` : `${MONTH_LABELS[Number(month) - 1]} ${year}`;
      const net = roundMoney(totals.income - totals.expenses);
      const margin = totals.income ? net / totals.income * 100 : 0;
      el.reportKpis.innerHTML = [
        { title: "Umumiy daromad", value: fmt(totals.income), meta: `${periodName} · ${totals.paymentCount} ta tushum`, cls: "income" },
        { title: "Umumiy xarajat", value: fmt(totals.expenses), meta: `${periodName} · ${totals.expenseCount} ta yozuv`, cls: "warn-kpi" },
        { title: "Sof foyda", value: fmt(net), meta: periodName, cls: net < 0 ? "danger-kpi" : "profit-kpi", negative: net < 0 },
        { title: "Foyda marjasi", value: `${margin.toFixed(1).replace(".", ",")}%`, meta: "Sof foyda ÷ daromad", cls: "cash", negative: margin < 0 },
        { title: "Ta'sischi avanslari", value: fmt(totals.founderAdvances), meta: "Foydadan olingan, xarajatga kirmaydi", cls: "neutral-kpi" }
      ].map(kpiCard).join("");
      const visible = months.filter(row => month === "all" || row.month.endsWith(`-${month}`));
      el.reportMonthsBody.innerHTML = visible
        .map(row => `<tr><td>${row.label}</td><td class="num">${fmt(row.income)}</td><td class="num">${fmt(row.expenses)}</td><td class="num">${money(row.income - row.expenses)}</td><td class="num">${fmt(row.founderAdvances)}</td><td class="num">${row.paymentCount}</td><td class="num">${row.expenseCount}</td></tr>`)
        .join("") + (visible.length > 1 ? `<tr class="archive-expense-row"><td>Jami</td><td class="num">${fmt(totals.income)}</td><td class="num">${fmt(totals.expenses)}</td><td class="num">${money(net)}</td><td class="num">${fmt(totals.founderAdvances)}</td><td class="num">${totals.paymentCount}</td><td class="num">${totals.expenseCount}</td></tr>` : "");
      drawCompareChart(el.reportTrendChart, el.reportTrendLegend, months, month === "all" ? null : `${year}-${month}`);
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
              ? allocations.map(allocation => `${knownProjectName(allocation.projectId, allocation.projectName)} (${num(allocation.amount)})${allocation.fundedByProjectId && record.type !== "founder_avans" ? ` — puli ${knownProjectName(allocation.fundedByProjectId, allocation.fundedByProjectName)} zakazidan` : ""}`).join("; ")
              : "Eski yozuv: zakaz biriktirilmagan";
            const worker = state.finance.workers.find(item => item.id === record.workerId)?.name || record.workerName || "";
            const founder = state.finance.founders.find(item => item.id === record.founderId)?.name || record.founderName || "";
            lines.push([
              record.date || row.month, row.month, row.kind === "founder" ? "Ta'sischi avansi (xarajat emas)" : "Xarajat", projectLabel, worker || founder,
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

    // Halqa diagramma: bo'laklar orasida 2px fon rangidagi oraliq, markazda jami summa.
    function drawDonut(canvas, legendNode, items) {
      const total = items.reduce((a, i) => a + i.value, 0);
      legendNode.innerHTML = total
        ? items.map((it) => `<span><i class="dot" style="background:${it.color}"></i>${it.label} <b>${fmt(it.value)}</b> <em>${(it.value / total * 100).toFixed(1).replace(".", ",")}%</em></span>`).join("")
        : "";
      const p = prepareCanvas(canvas);
      if (!p) return;
      const { ctx, width, height, c } = p;
      if (!total) return emptyChart(p, "Hali to'lov tushmagan");
      const cx = width / 2, cy = height / 2, r = Math.min(width, height) / 2 - 6, inner = r * .64;
      let start = -Math.PI / 2;
      const segments = [];
      items.filter(it => it.value > 0).forEach((it) => {
        const angle = it.value / total * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, start, start + angle); ctx.arc(cx, cy, inner, start + angle, start, true); ctx.closePath();
        ctx.fillStyle = it.color; ctx.fill();
        if (angle < Math.PI * 2 - .001) { ctx.strokeStyle = c.surface; ctx.lineWidth = 2; ctx.stroke(); }
        segments.push({ ...it, start, end: start + angle });
        start += angle;
      });
      ctx.textAlign = "center"; ctx.fillStyle = c.text; ctx.font = `700 18px ${CHART_FONT}`;
      ctx.fillText(compactMoney(total), cx, cy - 7);
      ctx.fillStyle = c.axis; ctx.font = `12px ${CHART_FONT}`; ctx.fillText("jami tushum", cx, cy + 13);
      const hit = {
        test: (x, y) => {
          const d = Math.hypot(x - cx, y - cy);
          if (d < inner || d > r + 4) return false;
          let a = Math.atan2(y - cy, x - cx);
          if (a < -Math.PI / 2) a += Math.PI * 2;
          const seg = segments.find(s => a >= s.start && a < s.end);
          if (seg) hit.html = `<div class="tt-title">${seg.label}</div>${tipRow(seg.color, "Summa", fmt(seg.value))}${tipRow("", "Ulushi", `${(seg.value / total * 100).toFixed(1).replace(".", ",")}%`)}`;
          return !!seg;
        }
      };
      canvas._hits.push(hit);
    }

    // Gorizontal ustunlar. diverging=true bo'lsa nol chizig'idan o'ngga (musbat) va chapga (manfiy, qizil).
    function drawHBars(canvas, items, { diverging = false, tooltip } = {}) {
      canvas.dataset.height = String(Math.max(120, items.length * 38 + 16));
      const p = prepareCanvas(canvas);
      if (!p) return;
      const { ctx, width, c } = p;
      if (!items.length || items.every(i => !i.value)) return emptyChart(p);
      const labelW = Math.min(150, Math.max(90, width * .28)), valueW = 104, top = 8, rowH = 38, barH = 18;
      const x0 = labelW + 10, plotW = Math.max(40, width - x0 - valueW);
      const min = diverging ? Math.min(0, ...items.map(i => i.value)) : 0;
      const max = Math.max(0, ...items.map(i => i.value));
      const span = (max - min) || 1;
      const zeroX = x0 + (-min) / span * plotW;
      items.forEach((it, i) => {
        const y = top + i * rowH, cy = y + rowH / 2;
        ctx.fillStyle = c.text2; ctx.textAlign = "left"; ctx.font = `12.5px ${CHART_FONT}`;
        let label = it.label;
        while (ctx.measureText(label).width > labelW && label.length > 3) label = label.slice(0, -2);
        ctx.fillText(label === it.label ? label : `${label}…`, 0, cy);
        const w = Math.abs(it.value) / span * plotW;
        const negative = it.value < 0;
        if (w > 0) {
          ctx.fillStyle = negative ? c.neg : (it.color || c.s1);
          barPath(ctx, negative ? zeroX - w : zeroX, cy - barH / 2, Math.max(w, 2), barH, negative ? "left" : "right");
          ctx.fill();
        }
        ctx.fillStyle = negative ? c.neg : c.text; ctx.textAlign = "right"; ctx.font = `600 12.5px ${CHART_FONT}`;
        ctx.fillText(fmt(it.value), width, cy);
        canvas._hits.push({ x: 0, y, w: width, h: rowH, html: tooltip ? tooltip(it) : `<div class="tt-title">${it.label}</div>${tipRow(it.color || c.s1, "Summa", fmt(it.value))}` });
      });
      if (diverging && min < 0) {
        ctx.strokeStyle = c.axis; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(Math.round(zeroX) + .5, top); ctx.lineTo(Math.round(zeroX) + .5, top + items.length * rowH); ctx.stroke();
      }
    }

    function drawCharts() {
      const s = summary();
      const c = chartColors();
      // Haqiqatda tushgan to'lovlar bo'yicha (zakaz summasi hali olinmagan pulni ham qo'shib yuborardi).
      const byType = {};
      state.finance.payments.forEach((p) => { byType[p.paymentType] = (byType[p.paymentType] || 0) + num(p.amount); });
      drawDonut(el.paymentChart, el.paymentLegend, [
        { label: "Naqd", value: byType["Naqd"] || 0, color: c.s1 },
        { label: "Karta", value: byType["Karta"] || 0, color: c.s2 },
        { label: "Bank o'tkazma", value: byType["Bank o'tkazma"] || 0, color: c.s3 },
        { label: "Aralash", value: byType["Aralash"] || 0, color: c.s4 }
      ]);
      // Barcha xarajat turlari (avval "Boshqa" va "Ishchi oyligi" diagrammada yo'q edi).
      const expenseTotal = REAL_EXPENSE_TYPES.reduce((a, t) => a + (s.expenseByType[t] || 0), 0);
      const expenseItems = REAL_EXPENSE_TYPES
        .map(type => ({ label: EXPENSE_LABEL[type], value: roundMoney(s.expenseByType[type] || 0) }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
      drawHBars(el.expenseChart, expenseItems, {
        tooltip: (it) => `<div class="tt-title">${it.label}</div>${tipRow(c.s1, "Summa", fmt(it.value))}${tipRow("", "Ulushi", `${(it.value / (expenseTotal || 1) * 100).toFixed(1).replace(".", ",")}%`)}`
      });
      el.expenseLegend.innerHTML = expenseItems.length ? `<span>Jami xarajat: <b>${fmt(expenseTotal)}</b></span>` : "";
      drawHBars(el.founderChart, s.founderRows.map(f => ({ label: f.name || "Ta'sischi", value: f.final, row: f })), {
        diverging: true,
        tooltip: (it) => `<div class="tt-title">${clean(it.label)} — ${num(it.row.share).toFixed(2)}%</div>${tipRow("", "Foydadagi ulushi", fmt(it.row.base))}${tipRow("", "Olgan avansi", fmt(it.row.founderAdvance))}${tipRow(it.value < 0 ? c.neg : c.s1, it.value < 0 ? "Kompaniyaga qarzdor" : "Olishi kerak", fmt(Math.abs(it.value)))}`
      });
      el.founderLegend.innerHTML = s.founderRows.length
        ? `<span><i class="dot" style="background:${c.s1}"></i>Olishi kerak</span><span><i class="dot" style="background:${c.neg}"></i>Kompaniyaga qarzdor (zarar yoki ortiqcha avans)</span>`
        : "";
      drawCompareChart(el.financeTrendChart, el.financeTrendLegend, monthsForYear(el.dashboardYear.value), el.dashboardMonth.value === "all" ? null : `${el.dashboardYear.value}-${el.dashboardMonth.value}`);
      drawCompareChart(el.reportTrendChart, el.reportTrendLegend, monthsForYear(el.reportYear.value), el.reportMonth.value === "all" ? null : `${el.reportYear.value}-${el.reportMonth.value}`);
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

    // --- Yangiliklar ---
    const esc = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const NEWS_ACTIONS = { added: { label: "Qo'shildi", cls: "s-done" }, changed: { label: "O'zgardi", cls: "s-progress" }, deleted: { label: "O'chirildi", cls: "s-over" } };
    const NEWS_CATEGORIES = { projects: "Zakazlar", payments: "To'lovlar", expenses: "Xarajatlar", workers: "Ishchilar", founders: "Ta'sischilar", measurements: "O'lchovlar", designs: "Dizaynlar", settings: "Sozlamalar", archive: "Arxiv", users: "Foydalanuvchilar", system: "Tizim" };
    const newsSeenKey = () => `pp_news_seen_${state.currentUser?.id || "anon"}`;
    function newsSeen() {
      try { return JSON.parse(localStorage.getItem(newsSeenKey()) || "{}") || {}; } catch { return {}; }
    }
    function newsLatest() {
      return {
        version: state.news.changelog[0]?.version || "",
        at: state.news.activity.reduce((max, entry) => Math.max(max, Number(entry.at) || 0), 0)
      };
    }
    function markNewsSeen() {
      try { localStorage.setItem(newsSeenKey(), JSON.stringify(newsLatest())); } catch {}
      updateNewsBadge();
    }
    function updateNewsBadge() {
      const badge = document.getElementById("newsBadge");
      if (!badge) return;
      const seen = newsSeen();
      const releases = state.news.changelog.filter(entry => !seen.version || entry.version > seen.version).length;
      const changes = state.news.activity.filter(entry => (Number(entry.at) || 0) > (Number(seen.at) || 0) && entry.userId !== state.currentUser?.id).length;
      const count = releases + changes;
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.toggle("hidden", !count || el.appSection.dataset.page === "news");
    }
    function renderNews() {
      if (!el.newsChangelog || !el.newsActivity) return;
      const seen = newsSeen();
      el.newsChangelog.innerHTML = state.news.changelog.length ? state.news.changelog.map(entry => `
        <article class="news-release">
          <div class="news-release-head">
            <strong>${esc(entry.title)}</strong>
            <span class="news-date">${esc(entry.date)}</span>
            ${!seen.version || entry.version > seen.version ? '<span class="pill s-new">Yangi</span>' : ""}
          </div>
          <ul class="tight">${(entry.items || []).map(item => `<li>${esc(item)}</li>`).join("")}</ul>
        </article>`).join("") : '<p class="section-help">Hozircha yangilanish yo\'q.</p>';
      if (el.newsFilter) {
        const selected = el.newsFilter.value || "all";
        const present = [...new Set(state.news.activity.map(entry => entry.category))].filter(key => NEWS_CATEGORIES[key]);
        el.newsFilter.innerHTML = '<option value="all">Barcha bo\'limlar</option>' + present.map(key => `<option value="${esc(key)}">${esc(NEWS_CATEGORIES[key])}</option>`).join("");
        el.newsFilter.value = present.includes(selected) ? selected : "all";
      }
      const filter = el.newsFilter?.value || "all";
      const rows = state.news.activity.filter(entry => filter === "all" || entry.category === filter);
      el.newsActivity.innerHTML = rows.length ? rows.map(entry => {
        const action = NEWS_ACTIONS[entry.action] || NEWS_ACTIONS.changed;
        const when = new Date(Number(entry.at) || 0).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const fresh = (Number(entry.at) || 0) > (Number(seen.at) || 0) && entry.userId !== state.currentUser?.id;
        return `<li class="news-item${fresh ? " is-fresh" : ""}">
          <div class="news-item-head"><span class="pill ${action.cls}">${action.label}</span><strong>${esc(NEWS_CATEGORIES[entry.category] || entry.category)}</strong></div>
          <div class="news-text">${esc(entry.text)}</div>
          <div class="news-meta">${esc(when)} · ${esc(entry.username)}</div>
        </li>`;
      }).join("") : '<li class="news-empty">Hozircha o\'zgarish qayd etilmagan.</li>';
    }
    async function loadNews() {
      if (!state.currentUser || isClientUser()) return;
      try {
        const data = await apiRequest("/api/news");
        state.news = { changelog: Array.isArray(data.changelog) ? data.changelog : [], activity: Array.isArray(data.activity) ? data.activity : [] };
        if (el.newsMsg) msg(el.newsMsg, "", "");
      } catch (err) {
        if (el.newsMsg) msg(el.newsMsg, err.message || "Yangiliklarni yuklab bo'lmadi.", "err");
      }
      renderNews();
      updateNewsBadge();
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
      renderNews();
      updateNewsBadge();
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
      state.financeLoaded = false;
      state.news = { changelog: [], activity: [] };
      el.appSection.classList.add("hidden");
      setSidebar(false);
      el.authSection.classList.remove("hidden");
      el.loginForm.reset();
      msg(el.loginMsg, "", "");
      showAuthMode();
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
          const saved = await commitFinance(f => { f.designs.push(design); }, el.designMsg);
          if (!saved) return;
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
          await commitFinance(f => { f.measurements.push(visit); }, el.measurementMsg, "Joyga chiqish va o'lchovlar saqlandi.", () => {
            el.measurementForm.reset();
            el.measurementDate.value = today();
            el.measurementWorker.value = state.currentUser.username;
          });
        } catch (err) {
          msg(el.measurementMsg, err.message || "O'lchovlarni saqlashda xatolik.", "err");
        } finally {
          el.measurementSubmitBtn.disabled = false;
        }
      });
      document.querySelectorAll("[data-quick-expense]").forEach(button => button.addEventListener("click", () => openAdvanceForm(button.dataset.quickExpense)));
      const refreshTelegramStaff = async () => {
        const status = document.getElementById("telegramStaffStatus");
        try {
          const result = await apiRequest("/api/telegram/staff");
          document.getElementById("telegramStaffList").innerHTML = result.workers.map(w => `<p><b>${clean(w.name)}</b> <span class="pill s-new">${clean(w.roleName || w.role || "")}</span> ${clean(w.phone || "Telefon yo'q")} — ${w.chatId ? `<span class="pill s-done">Ulangan</span> Chat ID: ${clean(w.chatId)} <button type="button" class="ghost small-btn" data-unlink-worker="${clean(w.id)}">Bog'lanishni uzish</button>` : `<span class="pill s-over">Botga ulanmagan</span>`}</p>`).join("");
          document.querySelectorAll("[data-unlink-worker]").forEach(button => button.addEventListener("click", async () => {
            try { await apiRequest(`/api/telegram/staff/${encodeURIComponent(button.dataset.unlinkWorker)}`, { method: "DELETE" }); await refreshTelegramStaff(); }
            catch (error) { msg(status, error.message, "err"); }
          }));
          msg(status, `${result.workers.filter(w => w.chatId).length} / ${result.workers.length} xodim bog'langan.`, "ok");
        } catch (error) { msg(status, error.message, "err"); }
      };
      document.getElementById("telegramRefresh").addEventListener("click", refreshTelegramStaff);
      // Bot nima uchun javob bermayotganini ko'rsatadi: token, webhook manzili va oxirgi xato.
      const refreshTelegramStatus = async () => {
        const box = document.getElementById("telegramStatusBox");
        box.classList.remove("hidden");
        box.innerHTML = "Tekshirilmoqda...";
        try {
          const s = await apiRequest("/api/telegram/status");
          const row = (label, value, ok) => `<div class="tg-row"><span>${label}</span><b class="${ok === false ? "neg" : ""}">${value}</b></div>`;
          box.innerHTML = [
            s.problem ? `<div class="tg-problem">⚠ ${esc(s.problem)}</div>` : `<div class="tg-ok">✓ Bot ishlayapti. Xodimlar /start bosishi mumkin.</div>`,
            row("Bot", s.bot ? `@${esc(s.bot)}` : s.token ? "-" : "Token yo'q", !!s.bot),
            row("Webhook", esc(s.webhookUrl || "o'rnatilmagan"), !!s.webhookUrl && s.webhookUrl === s.expectedUrl),
            row("Kutilgan manzil", esc(s.expectedUrl || "-")),
            s.pending ? row("Navbatdagi xabarlar", String(s.pending)) : "",
            s.lastError ? row("Oxirgi xato", `${esc(s.lastError)}${s.lastErrorAt ? ` (${new Date(s.lastErrorAt).toLocaleString("uz-UZ")})` : ""}`, false) : "",
            row("Guruh", s.groupChatId ? `${esc(s.groupTitle || "")} ${esc(s.groupChatId)}` : "ulanmagan", !!s.groupChatId || undefined),
            row("Rasm saqlash", s.mediaChatId ? `Media chat ${esc(s.mediaChatId)}` : "yuklovchining bot chati (avtomatik)"),
            row("Qo'llanma rasmlari", `${s.guideImages || 0} ta`)
          ].join("");
          document.getElementById("tgGroupChatId").value = s.groupChatId || "";
          document.getElementById("tgMediaChatId").value = s.mediaChatId || "";
        } catch (error) { box.innerHTML = `<div class="tg-problem">${esc(error.message)}</div>`; }
      };
      document.getElementById("telegramStatusBtn").addEventListener("click", refreshTelegramStatus);
      document.getElementById("telegramSetup").addEventListener("click", async () => {
        try {
          const result = await apiRequest("/api/telegram/setup-webhook", { method: "POST", body: "{}" });
          msg(document.getElementById("telegramStaffStatus"), `Bot ulandi (${result.url}). Endi xodimlar /start bosishi mumkin.`, "ok");
          refreshTelegramStatus();
        } catch (error) { msg(document.getElementById("telegramStaffStatus"), error.message, "err"); }
      });
      document.getElementById("telegramGuideBtn").addEventListener("click", async () => {
        const status = document.getElementById("telegramStaffStatus");
        if (!confirm("Qo'llanma (rasmlar va matn) botga ulangan barcha xodimlarga yuborilsinmi?")) return;
        msg(status, "Yuborilmoqda...", "warn");
        try {
          const result = await apiRequest("/api/telegram/send-guide", { method: "POST", body: "{}" });
          msg(status, `Qo'llanma yuborildi: ${result.sent} ta. Yuborilmadi: ${result.failed}.`, result.failed || !result.sent ? "warn" : "ok");
        } catch (error) { msg(status, error.message, "err"); }
      });
      document.getElementById("telegramConfigSave").addEventListener("click", async () => {
        const node = document.getElementById("telegramConfigMsg");
        try {
          await apiRequest("/api/telegram/config", { method: "PUT", body: JSON.stringify({
            groupChatId: document.getElementById("tgGroupChatId").value.trim(),
            mediaChatId: document.getElementById("tgMediaChatId").value.trim()
          }) });
          msg(node, "Telegram sozlamalari saqlandi.", "ok");
        } catch (error) { msg(node, error.message, "err"); }
      });
      document.getElementById("telegramGroupTest").addEventListener("click", async () => {
        const node = document.getElementById("telegramConfigMsg");
        try { await apiRequest("/api/telegram/test-group", { method: "POST", body: "{}" }); msg(node, "Guruhga test xabar yuborildi.", "ok"); }
        catch (error) { msg(node, error.message, "err"); }
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
      el.newsFilter.addEventListener("change", renderNews);
      el.newsRefresh.addEventListener("click", () => loadNews().then(markNewsSeen));
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
              applyFinanceSnapshot(data.finance, data.revision);
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
        const editingId = editState.projectId;
        const amount = parseMoney(el.pAmount.value);
        const advance = editingId ? 0 : (String(el.pAdvance.value).trim() ? parseMoney(el.pAdvance.value) : 0);
        if (!Number.isFinite(amount) || !Number.isFinite(advance)) return msg(el.projectMsg, "Summani faqat raqam bilan kiriting, masalan: 1 500 000.", "err");
        const rec = {
          id: editingId || uid(),
          name: clean(el.pName.value), client: clean(el.pClient.value), clientLogin: clean(el.pClientLogin.value).toLowerCase(),
          startDate: el.pStart.value, dueDate: el.pDue.value,
          amount, paymentType: clean(el.pType.value), status: clean(el.pStatus.value)
        };
        if (!rec.name || !rec.client || !rec.startDate || !rec.dueDate) return msg(el.projectMsg, "Majburiy maydonlarni to'ldiring.", "err");
        if (rec.dueDate < rec.startDate) return msg(el.projectMsg, "Topshirish muddati oldin bo'lishi mumkin emas.", "err");
        if (rec.amount <= 0 || advance < 0 || advance > rec.amount) return msg(el.projectMsg, "Summa noto'g'ri yoki oldindan to'lov zakaz summasidan katta.", "err");
        await commitFinance(f => {
          if (editingId) {
            const index = f.projects.findIndex(p => p.id === editingId);
            if (index < 0) return "Zakaz topilmadi: boshqa foydalanuvchi o'chirgan bo'lishi mumkin.";
            // To'langan summa faqat to'lovlar orqali o'zgaradi; zakazning boshqa maydonlari (ko'chgan oy, mijoz ID) saqlanadi.
            const paid = num(f.projects[index].advance);
            if (rec.amount < paid) return `Zakaz summasi allaqachon to'langan ${fmt(paid)} dan kam bo'lishi mumkin emas.`;
            const old = f.projects[index];
            f.projects[index] = { ...old, ...rec, advance: paid };
            if (rec.status === "Yakunlangan" && !old.completedAt) f.projects[index].completedAt = today();
            if (rec.status !== "Yakunlangan") delete f.projects[index].completedAt;
          } else {
            f.projects.unshift({ ...rec, advance, ...(rec.status === "Yakunlangan" ? { completedAt: today() } : {}) });
            if (advance > 0) f.payments.unshift({
              id: uid(), projectId: rec.id, projectName: rec.name, clientName: rec.client,
              date: rec.startDate <= today() ? rec.startDate : today(), amount: advance, paymentType: rec.paymentType,
              note: "Zakaz ochilgandagi oldindan to'lov"
            });
          }
        }, el.projectMsg, "Loyiha saqlandi.", resetProjectForm);
      });
      el.projectCancelEdit.addEventListener("click", resetProjectForm);
      el.projectReset.addEventListener("click", resetProjectForm);

      document.getElementById("paymentMax").addEventListener("click", () => {
        const project = state.finance.projects.find(p => p.id === el.paymentProjectId.value);
        el.paymentAmount.value = project ? String(roundMoney(Math.max(num(project.amount) - num(project.advance), 0))) : "";
        msg(el.paymentMsg, "Qolgan summa kiritildi. To'lovni saqlash tugmasini bosing.", "ok");
      });
      el.paymentProjectId.addEventListener("change", () => { el.paymentAmount.value = ""; });
      el.paymentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.paymentMsg)) return;
        const projectId = el.paymentProjectId.value;
        const amount = parseMoney(el.paymentAmount.value);
        if (!state.finance.projects.some(item => item.id === projectId)) return msg(el.paymentMsg, "Zakazni tanlang.", "err");
        if (!Number.isFinite(amount) || amount <= 0) return msg(el.paymentMsg, "To'lov summasini raqam bilan kiriting, masalan: 500 000.", "err");
        await commitFinance(f => {
          const project = f.projects.find(item => item.id === projectId);
          if (!project) return "Zakaz topilmadi.";
          const due = roundMoney(Math.max(num(project.amount) - num(project.advance), 0));
          if (amount > due + 0.001) return `To'lov zakaz qarzidan (${fmt(due)}) oshmasligi kerak.`;
          project.advance = roundMoney(num(project.advance) + amount);
          f.payments.unshift({
            id: uid(), projectId: project.id, projectName: project.name, clientName: project.client,
            date: el.paymentDate.value || today(), amount, paymentType: clean(el.paymentType.value),
            note: clean(el.paymentNote.value)
          });
        }, el.paymentMsg, "To'lov saqlandi.", () => {
          el.paymentForm.reset();
          el.paymentDate.value = today();
        });
      });

      el.workerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.workerMsg)) return;
        const editingId = editState.workerId;
        const rec = { id: editingId || uid(), phone: document.getElementById("wPhone").value.replace(/\D/g, ""), name: clean(el.wName.value), role: clean(el.wRole.value), salary: parseMoney(el.wSalary.value) };
        if (!rec.name || !rec.role || !Number.isFinite(rec.salary) || rec.salary <= 0) return msg(el.workerMsg, "Ism, lavozim va oylikni to'g'ri kiriting (masalan: 3 000 000).", "err");
        const phoneKey = value => { const digits = String(value || "").replace(/\D/g, ""); return digits.length === 9 ? `998${digits}` : digits; };
        if (rec.phone && (!/^\d{9,15}$/.test(rec.phone) || state.finance.workers.some(w => w.id !== rec.id && phoneKey(w.phone) === phoneKey(rec.phone)))) return msg(el.workerMsg, "Telefon noto'g'ri yoki boshqa xodimda ishlatilgan.", "err");
        await commitFinance(f => {
          if (editingId) {
            const index = f.workers.findIndex(w => w.id === editingId);
            if (index < 0) return "Ishchi topilmadi.";
            f.workers[index] = { ...f.workers[index], ...rec };
          } else f.workers.unshift(rec);
        }, el.workerMsg, "Ishchi saqlandi.", resetWorkerForm);
      });
      el.workerCancelEdit.addEventListener("click", resetWorkerForm);
      el.workerReset.addEventListener("click", () => { el.workerForm.reset(); msg(el.workerMsg, "", ""); });

      el.founderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.founderMsg)) return;
        const editingId = editState.founderId;
        const rec = { id: editingId || uid(), name: clean(el.fName.value), share: parsePercent(el.fShare.value), note: clean(el.fNote.value), phone: el.fPhone.value.replace(/\D/g, "") };
        if (!rec.name || !Number.isFinite(rec.share) || rec.share <= 0 || rec.share > 100) return msg(el.founderMsg, "Ism va foizni to'g'ri kiriting (0 dan 100 gacha).", "err");
        if (rec.phone && !/^\d{9,15}$/.test(rec.phone)) return msg(el.founderMsg, "Telefon raqami noto'g'ri (masalan: +998901234567).", "err");
        await commitFinance(f => {
          const totalWithout = f.founders.filter(x => x.id !== rec.id).reduce((a, x) => a + num(x.share), 0);
          if (totalWithout + rec.share > 100.0001) return `Jami foiz 100% dan oshib ketadi (boshqalar: ${totalWithout.toFixed(2)}%).`;
          if (editingId) {
            const index = f.founders.findIndex(x => x.id === editingId);
            if (index < 0) return "Ta'sischi topilmadi.";
            f.founders[index] = { ...f.founders[index], ...rec };
          } else f.founders.push(rec);
        }, el.founderMsg, "Ta'sischi saqlandi.", resetFounderForm);
      });
      el.founderCancelEdit.addEventListener("click", resetFounderForm);
      el.founderReset.addEventListener("click", () => { el.founderForm.reset(); msg(el.founderMsg, "", ""); });

      el.expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (blockIfPaymentLocked(el.expenseMsg)) return;
        const existingExpense = editState.expenseId ? state.finance.expenses.find(x => x.id === editState.expenseId) : null;
        const expenseAmount = parseMoney(el.eAmount.value);
        if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) return msg(el.expenseMsg, "Xarajat summasini raqam bilan kiriting, masalan: 250 000.", "err");
        const allocations = readExpenseAllocations();
        if (allocations.some(allocation => !Number.isFinite(allocation.amount))) return msg(el.expenseMsg, "Zakazga ajratilgan summani raqam bilan kiriting.", "err");
        const uniqueProjectIds = new Set(allocations.map(allocation => allocation.projectId));
        const allocationTotal = roundMoney(allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
        const previousIds = new Set(expenseAllocations(existingExpense || {}).flatMap(previous => [previous.projectId, previous.fundedByProjectId]).filter(Boolean));
        const knownId = id => state.finance.projects.some(project => project.id === id) || previousIds.has(id);
        const invalidProject = allocations.some(allocation => !knownId(allocation.projectId) || (allocation.fundedByProjectId && !knownId(allocation.fundedByProjectId)));
        const unallocatedAdvance = isPersonExpense() && !allocations.length;
        if (!unallocatedAdvance && (!allocations.length || invalidProject || allocations.some(allocation => !allocation.projectId || allocation.amount <= 0) ||
            uniqueProjectIds.size !== allocations.length || Math.abs(allocationTotal - expenseAmount) >= 0.01)) {
          return msg(el.expenseMsg, isPersonExpense()
            ? "Zakaz tanlagan bo'lsangiz, summani to'liq taqsimlang — yoki zakazni bo'sh qoldiring."
            : "Xarajat summasini takrorlanmagan zakazlarga to'liq taqsimlang.", "err");
        }
        const rec = {
          id: editState.expenseId || uid(),
          date: el.eDate.value || today(),
          type: clean(el.eType.value),
          amount: expenseAmount,
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
          if (advanceAfterSave + paidAfterSave > num(worker.salary) + 0.001) return msg(el.expenseMsg, "Oylik avansi va to'lovlari ishchi oyligidan oshib ketmoqda.", "err");
        }
        if (rec.type === "founder_avans") {
          rec.founderId = el.eFounderId.value;
          if (!rec.founderId) return msg(el.expenseMsg, "Ta'sischini tanlang.", "err");
          rec.founderName = state.finance.founders.find(founder => founder.id === rec.founderId)?.name || "";
        }
        await commitFinance(f => {
          if (existingExpense) {
            const index = f.expenses.findIndex(x => x.id === rec.id);
            if (index < 0) return "Xarajat topilmadi: boshqa foydalanuvchi o'chirgan bo'lishi mumkin.";
            f.expenses[index] = rec;
          } else f.expenses.unshift(rec);
        }, el.expenseMsg, "Xarajat saqlandi.", resetExpenseForm);
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
        const tax = parsePercent(el.sTax.value), reserve = parsePercent(el.sReserve.value);
        const other = String(el.sOther.value).trim() ? parseMoney(el.sOther.value) : 0;
        if (![tax, reserve, other].every(Number.isFinite) || tax > 100 || reserve > 100) return msg(el.settingsMsg, "Qiymatlar noto'g'ri: foizlar 0–100, summa raqam bo'lsin.", "err");
        commitFinance(f => { f.settings = { tax, reserve, other }; }, el.settingsMsg, "Sozlamalar saqlandi.");
      });
      el.clearData.addEventListener("click", () => {
        if (!isSuperAdmin()) return msg(el.settingsMsg, "Barcha ma'lumotni tozalash faqat super admin uchun.", "err");
        if (!confirm("Barcha loyiha/ishchi/ta'sischi/xarajat ma'lumotlarini tozalaysizmi?")) return;
        commitFinance(f => {
          Object.assign(f, { projects: [], payments: [], workers: [], founders: [], expenses: [], measurements: [], designs: [], settings: { tax: 0, reserve: 0, other: 0 } });
        }, el.settingsMsg, "Barcha joriy ma'lumotlar 0 qilindi (arxiv saqlandi).", () => {
          resetProjectForm(); resetWorkerForm(); resetFounderForm(); resetExpenseForm();
        });
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
        await loadNews();
        if (el.appSection.dataset.page === "news") markNewsSeen();
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
      let resizeTimer;
      window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.currentUser) drawCharts(); }, 150); });
      await bootSession();
      window.setInterval(async () => {
        if (!state.currentUser || !localStorage.getItem(TOKEN_KEY)) return;
        try {
          const data = await apiRequest("/api/finance");
          if (data.finance?.payment) {
            // Boshqa foydalanuvchi saqlagan bo'lsa (yoki oy almashgan bo'lsa) yangi ma'lumot ko'rsatiladi.
            if (!saving && (!state.financeLoaded || Number(data.revision) !== state.revision)) {
              applyFinanceSnapshot(data.finance, data.revision);
              setLoadError("");
              refreshAll();
              loadNews();
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
