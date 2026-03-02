const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const showLoginBtn = document.getElementById("showLogin");
const showSignupBtn = document.getElementById("showSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const authMessage = document.getElementById("authMessage");
const themeToggle = document.getElementById("themeToggle");
const welcomeText = document.getElementById("welcomeText");
const appMessage = document.getElementById("appMessage");
const globalCurrency = document.getElementById("globalCurrency");
const saveCurrencyBtn = document.getElementById("saveCurrencyBtn");
const dashboardSection = document.getElementById("dashboardSection");
const detailPage = document.getElementById("detailPage");
const allLoansPage = document.getElementById("allLoansPage");
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtnDetail = document.getElementById("logoutBtnDetail");
const logoutBtnAllLoans = document.getElementById("logoutBtnAllLoans");
const openAllLoansPage = document.getElementById("openAllLoansPage");
const scrollToAddLoanBtn = document.getElementById("scrollToAddLoanBtn");
const addLoanSection = document.getElementById("addLoanSection");
const loanForm = document.getElementById("loanForm");
const loanCurrency = document.getElementById("loanCurrency");
const loanCalcMode = document.getElementById("loanCalcMode");
const loanPills = document.getElementById("loanPills");
const detailSection = document.getElementById("detailSection");
const detailTitle = document.getElementById("detailTitle");
const detailMeta = document.getElementById("detailMeta");
const detailStats = document.getElementById("detailStats");
const editLoanBtn = document.getElementById("editLoanBtn");
const deleteLoanBtn = document.getElementById("deleteLoanBtn");
const editLoanPanel = document.getElementById("editLoanPanel");
const editLoanForm = document.getElementById("editLoanForm");
const editLoanName = document.getElementById("editLoanName");
const editLoanAmount = document.getElementById("editLoanAmount");
const editLoanDuration = document.getElementById("editLoanDuration");
const editLoanEmi = document.getElementById("editLoanEmi");
const editLoanCalcMode = document.getElementById("editLoanCalcMode");
const editLoanRate = document.getElementById("editLoanRate");
const editLoanFee = document.getElementById("editLoanFee");
const editLoanLateFee = document.getElementById("editLoanLateFee");
const editLoanGraceDays = document.getElementById("editLoanGraceDays");
const editLoanCurrency = document.getElementById("editLoanCurrency");
const editLoanDeductionDay = document.getElementById("editLoanDeductionDay");
const editLoanStart = document.getElementById("editLoanStart");
const cancelEditLoan = document.getElementById("cancelEditLoan");
const portfolioStats = document.getElementById("portfolioStats");
const dueList = document.getElementById("dueList");
const recommendationList = document.getElementById("recommendationList");
const activityList = document.getElementById("activityList");
const goalLoanSelect = document.getElementById("goalLoanSelect");
const goalExtraInput = document.getElementById("goalExtraInput");
const runGoalPlanBtn = document.getElementById("runGoalPlanBtn");
const goalPlanResult = document.getElementById("goalPlanResult");
const penaltyStats = document.getElementById("penaltyStats");
const penaltyLogList = document.getElementById("penaltyLogList");
const exportLoanSelect = document.getElementById("exportLoanSelect");
const exportLoanCsvBtn = document.getElementById("exportLoanCsvBtn");
const exportLoanPdfBtn = document.getElementById("exportLoanPdfBtn");
const exportPortfolioCsvBtn = document.getElementById("exportPortfolioCsvBtn");
const exportPortfolioPdfBtn = document.getElementById("exportPortfolioPdfBtn");
const backToDashboard = document.getElementById("backToDashboard");
const backFromAllLoans = document.getElementById("backFromAllLoans");
const allLoansHead = document.getElementById("allLoansHead");
const allLoansBody = document.getElementById("allLoansBody");
const scheduleBody = document.getElementById("scheduleBody");
const summaryDonut = document.getElementById("summaryDonut");
const summaryDonutText = document.getElementById("summaryDonutText");
const summaryDonutMeta = document.getElementById("summaryDonutMeta");
const trendModeTabs = document.getElementById("trendModeTabs");
const trendBars = document.getElementById("trendBars");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";
const DISPLAY_CURRENCY_KEY = "loanTrackerDisplayCurrency";
const THEME_KEY = "loanTrackerTheme";
const REQUEST_TIMEOUT_MS = 20000;

let supabaseClient = null;
let currentUser = null;
let selectedLoanId = null;
let selectedDisplayCurrency = "AUTO";
let selectedLoanData = null;
let cachedLoans = [];
let dashboardRenderPromise = null;
let loadingWatchdog = null;
let selectedTrendMode = "due";

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function percent(value) {
  return `${(parseNumber(value) || 0).toFixed(2)}%`;
}

function formatCurrency(value, currencyCode = "USD") {
  const code = currencyCode || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(parseNumber(value));
  } catch (_error) {
    return `${Math.round(parseNumber(value))} ${code}`;
  }
}

function getDisplayCurrency(loan) {
  if (selectedDisplayCurrency && selectedDisplayCurrency !== "AUTO") {
    return selectedDisplayCurrency;
  }
  return (loan && loan.currency_code) || "USD";
}

function loadSavedDisplayCurrency() {
  const saved = localStorage.getItem(DISPLAY_CURRENCY_KEY);
  return saved || "AUTO";
}

function saveDisplayCurrency(value) {
  localStorage.setItem(DISPLAY_CURRENCY_KEY, value || "AUTO");
}

function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  if (themeToggle) {
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function setLoading(isLoading, text = "Loading...") {
  if (!loadingOverlay) return;
  if (loadingText) {
    loadingText.textContent = text;
  }
  loadingOverlay.classList.toggle("hidden", !isLoading);

  if (loadingWatchdog) {
    clearTimeout(loadingWatchdog);
    loadingWatchdog = null;
  }

  if (isLoading) {
    loadingWatchdog = setTimeout(() => {
      loadingOverlay.classList.add("hidden");
      setAppMessage("Request took too long. Please try again.", true);
    }, REQUEST_TIMEOUT_MS + 5000);
  }
}

function setLoanSubmitDisabled(disabled) {
  if (!loanForm) return;
  const submitBtn = loanForm.querySelector('button[type="submit"]');
  if (!submitBtn) return;
  submitBtn.disabled = !!disabled;
  submitBtn.textContent = disabled ? "Saving..." : "Create Loan";
}

async function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timerId = null;
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

function monthLabelFromIndex(startMonth, offset) {
  const [year, month] = startMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function dueDateForIndex(startMonth, offset, deductionDay) {
  const [year, month] = startMonth.split("-").map(Number);
  const targetYear = year;
  const targetMonthIndex = month - 1 + offset;
  const lastDay = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  const day = Math.max(1, Math.min(parseInt(deductionDay, 10) || 1, lastDay));
  return new Date(targetYear, targetMonthIndex, day);
}

function monthKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthDateFromKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function monthKeyAdd(monthKey, offset) {
  const date = monthDateFromKey(monthKey);
  date.setMonth(date.getMonth() + offset);
  return monthKeyFromDate(date);
}

function longMonthLabel(monthKey) {
  return monthDateFromKey(monthKey).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function normalizeStartMonth(monthValue) {
  return `${monthValue}-01`;
}

function createDefaultSchedule(durationMonths) {
  return Array.from({ length: durationMonths }, () => ({ paid: false, extra: 0 }));
}

function normalizeLoan(loan) {
  const duration = Math.max(1, Math.floor(parseNumber(loan.duration_months)));
  const existing = Array.isArray(loan.schedule) ? loan.schedule : [];
  const schedule = createDefaultSchedule(duration).map((item, idx) => {
    const row = existing[idx] || item;
    return {
      paid: !!row.paid,
      extra: Math.max(parseNumber(row.extra), 0),
    };
  });

  return {
    ...loan,
    amount: Math.max(parseNumber(loan.amount), 0),
    emi: Math.max(parseNumber(loan.emi), 0),
    duration_months: duration,
    calc_mode: loan.calc_mode === "tracking" ? "tracking" : "calculated",
    annual_rate: Math.max(parseNumber(loan.annual_rate), 0),
    processing_fee: Math.max(parseNumber(loan.processing_fee), 0),
    deduction_day: Math.max(1, Math.min(parseInt(loan.deduction_day, 10) || 1, 28)),
    late_fee_per_day: Math.max(parseNumber(loan.late_fee_per_day), 0),
    grace_days: Math.max(parseInt(loan.grace_days, 10) || 0, 0),
    currency_code: loan.currency_code || "USD",
    schedule,
  };
}

function buildBaseRows(loan) {
  const rows = [];
  let remainingPrincipal = loan.amount;
  const monthlyRate = loan.annual_rate / 1200;

  for (let i = 0; i < loan.duration_months; i += 1) {
    const monthData = loan.schedule[i] || { paid: false, extra: 0 };
    const dueDate = dueDateForIndex(loan.start_month, i, loan.deduction_day);
    const monthName = monthLabelFromIndex(loan.start_month, i);

    let interestDue = 0;
    let plannedEmi = loan.emi;
    let principalDue = loan.emi;

    if (loan.calc_mode === "calculated") {
      interestDue = remainingPrincipal > 0 ? remainingPrincipal * monthlyRate : 0;
      plannedEmi = remainingPrincipal > 0 ? Math.min(loan.emi, remainingPrincipal + interestDue) : 0;
      principalDue = Math.max(plannedEmi - interestDue, 0);
    }

    rows.push({
      index: i,
      monthName,
      dueDate,
      interestDue,
      principalDue,
      emiDue: plannedEmi,
      extra: Math.max(parseNumber(monthData.extra), 0),
      paid: !!monthData.paid,
      remaining: 0,
      totalDue: 0,
      isClosed: false,
      isOverdue: false,
    });

    if (loan.calc_mode === "calculated") {
      remainingPrincipal = Math.max(remainingPrincipal - principalDue, 0);
    }
  }

  return rows;
}

function applyTailExtraReduction(rows, plannerMonthlyExtra = 0) {
  const adjusted = rows.map((row) => ({ ...row }));
  const extraPoolFromRows = adjusted.reduce((sum, row) => sum + row.extra, 0);
  const plannerExtraPool = Math.max(parseNumber(plannerMonthlyExtra), 0) * adjusted.length;
  let extraPool = extraPoolFromRows + plannerExtraPool;

  for (let i = adjusted.length - 1; i >= 0 && extraPool > 0; i -= 1) {
    const row = adjusted[i];
    const reducible = Math.min(row.emiDue, extraPool);
    row.emiDue -= reducible;

    let left = reducible;
    const principalCut = Math.min(row.principalDue, left);
    row.principalDue -= principalCut;
    left -= principalCut;

    if (left > 0) {
      row.interestDue = Math.max(row.interestDue - left, 0);
    }

    extraPool -= reducible;
  }

  return {
    rows: adjusted,
    usedExtra: extraPoolFromRows + plannerExtraPool - extraPool,
    unusedExtra: extraPool,
  };
}

function finalizeRows(rows, loan) {
  let remainingPrincipal = loan.amount;
  let trackingRemaining = rows.reduce((sum, row) => sum + row.emiDue, 0);
  const today = new Date();
  return rows.map((row) => {
    if (loan.calc_mode === "calculated") {
      remainingPrincipal = Math.max(remainingPrincipal - row.principalDue, 0);
    } else {
      trackingRemaining = Math.max(trackingRemaining - row.emiDue, 0);
    }
    const isClosed = row.emiDue <= 0.0001;
    const graceDate = new Date(row.dueDate);
    graceDate.setDate(graceDate.getDate() + loan.grace_days);
    const isOverdue = !row.paid && !isClosed && today > graceDate;
    const overdueDays = isOverdue
      ? Math.max(Math.floor((today.getTime() - graceDate.getTime()) / (1000 * 60 * 60 * 24)), 0)
      : 0;
    const penaltyAccrued = overdueDays * loan.late_fee_per_day;
    return {
      ...row,
      emiDue: Math.max(row.emiDue, 0),
      interestDue: Math.max(row.interestDue, 0),
      principalDue: Math.max(row.principalDue, 0),
      totalDue: Math.max(row.emiDue + row.extra, 0),
      remaining: loan.calc_mode === "calculated" ? remainingPrincipal : trackingRemaining,
      isClosed,
      isOverdue,
      overdueDays,
      penaltyAccrued,
    };
  });
}

function summarizeRows(rows, loan, usedExtra, baselineInterest) {
  const projectedInterest = rows.reduce((sum, row) => sum + row.interestDue, 0);
  const projectedPrincipal = rows.reduce((sum, row) => sum + row.principalDue, 0);
  const projectedEmiTotal = rows.reduce((sum, row) => sum + row.emiDue, 0);
  const projectedTotal = projectedEmiTotal + loan.processing_fee;
  const effectiveMonths = rows.filter((row) => row.emiDue > 0.0001).length;
  const paidInterest = rows.reduce((sum, row) => sum + (row.paid ? row.interestDue : 0), 0);
  const paidPrincipalByEmi = rows.reduce((sum, row) => sum + (row.paid ? row.principalDue : 0), 0);
  const paidPrincipal = paidPrincipalByEmi + usedExtra;
  const paidMonths = rows.filter((row) => row.paid && row.emiDue > 0.0001).length;
  const overdueCount = rows.filter((row) => row.isOverdue).length;
  const dueTillToday = rows.filter((row) => row.emiDue > 0.0001 && row.dueDate <= new Date()).length;
  const onTimeRate = dueTillToday > 0 ? (paidMonths / dueTillToday) * 100 : 100;
  const remaining = rows.length ? rows[rows.length - 1].remaining : loan.amount;

  return {
    projectedInterest,
    projectedPrincipal,
    projectedTotal,
    paidInterest,
    paidPrincipal,
    usedExtra,
    effectiveMonths,
    monthsReduced: Math.max(loan.duration_months - effectiveMonths, 0),
    interestSaved: Math.max(baselineInterest - projectedInterest, 0),
    overdueCount,
    onTimeRate,
    remaining,
    deductionDay: loan.deduction_day,
  };
}

function computeSchedule(loanInput, plannerMonthlyExtra = 0) {
  const loan = normalizeLoan(loanInput);
  const baseRows = buildBaseRows(loan);
  const baselineInterest = baseRows.reduce((sum, row) => sum + row.interestDue, 0);
  const extraAdjusted = applyTailExtraReduction(baseRows, plannerMonthlyExtra);
  const finalRows = finalizeRows(extraAdjusted.rows, loan);
  const totals = summarizeRows(finalRows, loan, extraAdjusted.usedExtra, baselineInterest);

  return {
    rows: finalRows,
    totals,
    loan,
  };
}

function toMonthInputValue(startMonthValue) {
  if (!startMonthValue) return "";
  return String(startMonthValue).slice(0, 7);
}

function normalizeScheduleForDuration(schedule, durationMonths) {
  const existing = Array.isArray(schedule) ? schedule : [];
  return createDefaultSchedule(durationMonths).map((item, index) => {
    const row = existing[index] || item;
    return {
      paid: !!row.paid,
      extra: Math.max(parseNumber(row.extra), 0),
    };
  });
}

function openEditPanel(loan) {
  if (!loan || !editLoanPanel) return;
  editLoanName.value = loan.name || "";
  editLoanAmount.value = loan.amount || 0;
  editLoanDuration.value = loan.duration_months || 1;
  editLoanEmi.value = loan.emi || 0;
  editLoanCalcMode.value = loan.calc_mode || "calculated";
  editLoanRate.value = loan.annual_rate || 0;
  editLoanFee.value = loan.processing_fee || 0;
  editLoanLateFee.value = loan.late_fee_per_day || 0;
  editLoanGraceDays.value = loan.grace_days || 0;
  editLoanCurrency.value = loan.currency_code || "USD";
  editLoanDeductionDay.value = loan.deduction_day || 1;
  editLoanStart.value = toMonthInputValue(loan.start_month);
  syncCalcModeFields(editLoanCalcMode.value, true);
  editLoanPanel.classList.remove("hidden");
}

function closeEditPanel() {
  if (!editLoanPanel) return;
  editLoanPanel.classList.add("hidden");
}

function syncCalcModeFields(mode, isEdit = false) {
  const rateInput = isEdit ? editLoanRate : document.getElementById("loanRate");
  const feeInput = isEdit ? editLoanFee : document.getElementById("loanFee");
  const lateFeeInput = isEdit ? editLoanLateFee : document.getElementById("loanLateFee");
  const graceInput = isEdit ? editLoanGraceDays : document.getElementById("loanGraceDays");
  const trackingMode = mode === "tracking";

  [rateInput, feeInput, lateFeeInput, graceInput].forEach((input) => {
    if (!input) return;
    input.disabled = trackingMode;
    if (trackingMode) input.value = 0;
  });
}

function renderStats(container, items) {
  if (!container) return;
  container.innerHTML = "";
  items.forEach((item) => {
    const block = document.createElement("div");
    block.className = "stat-item";
    block.innerHTML = `<strong>${item.label}</strong><span>${item.value}</span>`;
    container.appendChild(block);
  });
}

function refreshAllSections(loans) {
  const safeLoans = Array.isArray(loans) ? loans : [];
  cachedLoans = safeLoans;
  renderLoanPills(safeLoans);
  renderAllLoansSheet(safeLoans);
  buildPortfolioStats(safeLoans);
  buildRecommendationsAndActivity(safeLoans);
  buildVisualAnalytics(safeLoans);
  buildPenaltyTracker(safeLoans);
  populateLoanSelectors(safeLoans);
  runGoalPlanner();
}

function buildVisualAnalytics(loans) {
  if (!summaryDonut || !summaryDonutText || !summaryDonutMeta || !trendBars) return;

  if (!loans.length) {
    summaryDonut.style.setProperty("--donut-fill", "0");
    summaryDonutText.textContent = "0%";
    summaryDonutMeta.textContent = "No loans yet";
    trendBars.innerHTML = '<p class="muted">Add loans to view monthly trend.</p>';
    return;
  }

  let paidTotal = 0;
  let projectedTotal = 0;
  const monthTotals = new Map();
  const preferredCurrency = getDisplayCurrency(loans[0]);

  loans.forEach((loan) => {
    const computed = computeSchedule(loan);
    projectedTotal += computed.totals.projectedTotal;

    computed.rows.forEach((row) => {
      if (row.paid) {
        paidTotal += row.totalDue;
      }
      let monthlyValue = 0;
      if (selectedTrendMode === "paid") {
        monthlyValue = row.paid ? row.totalDue : 0;
      } else if (selectedTrendMode === "extra") {
        monthlyValue = row.extra;
      } else {
        monthlyValue = row.emiDue;
      }

      if (monthlyValue > 0.0001) {
        const monthKey = monthKeyFromDate(row.dueDate);
        monthTotals.set(monthKey, (monthTotals.get(monthKey) || 0) + monthlyValue);
      }
    });
  });

  const paidPct = projectedTotal > 0 ? (paidTotal / projectedTotal) * 100 : 0;
  const safePaidPct = Math.max(0, Math.min(100, paidPct));
  summaryDonut.style.setProperty("--donut-fill", safePaidPct.toFixed(1));
  summaryDonutText.textContent = `${Math.round(safePaidPct)}%`;

  const remainingAmount = Math.max(projectedTotal - paidTotal, 0);
  summaryDonutMeta.textContent = `${formatCurrency(paidTotal, preferredCurrency)} paid · ${formatCurrency(
    remainingAmount,
    preferredCurrency
  )} left`;

  const monthlyEntries = Array.from(monthTotals.entries())
    .sort((a, b) => monthDateFromKey(a[0]) - monthDateFromKey(b[0]))
    .slice(-6);
  const maxMonthly = monthlyEntries.reduce((max, [, value]) => Math.max(max, value), 0);

  if (!monthlyEntries.length || maxMonthly <= 0) {
    trendBars.innerHTML = '<p class="muted">No monthly EMI trend available yet.</p>';
    return;
  }

  trendBars.innerHTML = "";
  monthlyEntries.forEach(([monthKey, amount]) => {
    const bar = document.createElement("div");
    bar.className = "trend-bar";
    if (selectedTrendMode === "paid") bar.classList.add("mode-paid");
    if (selectedTrendMode === "extra") bar.classList.add("mode-extra");
    const heightPct = Math.max((amount / maxMonthly) * 100, 18);
    bar.style.height = `${heightPct}%`;
    bar.title = `${longMonthLabel(monthKey)}: ${formatCurrency(amount, preferredCurrency)}`;

    const label = document.createElement("span");
    label.textContent = monthDateFromKey(monthKey).toLocaleString("en-US", { month: "short" });
    bar.appendChild(label);
    trendBars.appendChild(bar);
  });
}

function setTrendMode(mode) {
  const safeMode = mode === "paid" || mode === "extra" ? mode : "due";
  selectedTrendMode = safeMode;
  if (trendModeTabs) {
    trendModeTabs.querySelectorAll(".chart-tab").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === safeMode);
    });
  }
  buildVisualAnalytics(cachedLoans);
}

function buildPortfolioStats(loans) {
  if (!loans.length) {
    renderStats(portfolioStats, [{ label: "No Data", value: "Add loans to see analytics" }]);
    dueList.innerHTML = '<li class="muted">No upcoming dues.</li>';
    return;
  }

  let projectedInterest = 0;
  let paidInterest = 0;
  let paidPrincipal = 0;
  let usedExtra = 0;
  let remaining = 0;
  let overdueCount = 0;
  let dueCount = 0;
  let paidCount = 0;
  const dueSoon = [];
  const today = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(today.getDate() + 7);

  loans.forEach((loan) => {
    const computed = computeSchedule(loan);
    projectedInterest += computed.totals.projectedInterest;
    paidInterest += computed.totals.paidInterest;
    paidPrincipal += computed.totals.paidPrincipal;
    usedExtra += computed.totals.usedExtra;
    remaining += computed.totals.remaining;
    overdueCount += computed.totals.overdueCount;

    computed.rows.forEach((row) => {
      if (row.emiDue > 0.0001 && row.dueDate <= today) {
        dueCount += 1;
        if (row.paid) paidCount += 1;
      }
      if (!row.paid && row.emiDue > 0.0001 && row.dueDate >= today && row.dueDate <= sevenDays) {
        dueSoon.push({
          loan: loan.name,
          month: row.monthName,
          dueDate: row.dueDate,
          amount: row.emiDue,
          currency: getDisplayCurrency(loan),
        });
      }
    });
  });

  const onTimeRate = dueCount > 0 ? (paidCount / dueCount) * 100 : 100;

  renderStats(portfolioStats, [
    { label: "Total Loans", value: String(loans.length) },
    { label: "Outstanding Principal", value: formatCurrency(remaining, getDisplayCurrency(loans[0])) },
    { label: "Projected Interest", value: formatCurrency(projectedInterest, getDisplayCurrency(loans[0])) },
    { label: "Interest Paid", value: formatCurrency(paidInterest, getDisplayCurrency(loans[0])) },
    { label: "Principal Paid", value: formatCurrency(paidPrincipal, getDisplayCurrency(loans[0])) },
    { label: "Extra Paid", value: formatCurrency(usedExtra, getDisplayCurrency(loans[0])) },
    { label: "Overdue EMIs", value: String(overdueCount) },
    { label: "On-time %", value: percent(onTimeRate) },
  ]);

  dueSoon.sort((a, b) => a.dueDate - b.dueDate);
  if (!dueSoon.length) {
    dueList.innerHTML = '<li class="muted">No dues in next 7 days.</li>';
    return;
  }

  dueList.innerHTML = dueSoon
    .slice(0, 8)
    .map(
      (item) =>
        `<li><strong>${item.loan}</strong> - ${item.month} (${item.dueDate.toLocaleDateString(
          "en-US"
        )}) - ${formatCurrency(item.amount, item.currency)}</li>`
    )
    .join("");
}

function buildRecommendationsAndActivity(loans) {
  if (!recommendationList || !activityList) return;

  const recommendations = [];
  const activity = [];

  if (!loans.length) {
    recommendationList.innerHTML = "<li>Add your first loan to get recommendations.</li>";
    activityList.innerHTML = "<li>No activity yet.</li>";
    return;
  }

  loans.forEach((loan) => {
    const computed = computeSchedule(loan);
    const overdue = computed.rows.filter((row) => row.isOverdue).length;
    const reduced = computed.totals.monthsReduced;
    const saved = computed.totals.interestSaved;

    if (overdue > 0) {
      recommendations.push(
        `<strong>${loan.name}</strong>: ${overdue} overdue EMI(s). Consider enabling a reminder 3 days before due date.`
      );
    }
    if (reduced > 0) {
      recommendations.push(
        `<strong>${loan.name}</strong>: extra payments reduced ${reduced} month(s) and saved ${formatCurrency(
          saved,
          getDisplayCurrency(loan)
        )}.`
      );
    }
    if (loan.annual_rate > 12) {
      recommendations.push(
        `<strong>${loan.name}</strong>: APR is ${percent(loan.annual_rate)}. Prioritize prepayments.`
      );
    }

    const paidRows = computed.rows.filter((row) => row.paid);
    paidRows.slice(-2).forEach((row) => {
      activity.push({
        sortDate: row.dueDate,
        text: `<strong>${loan.name}</strong>: EMI marked paid for ${row.monthName}.`,
      });
    });
  });

  if (!recommendations.length) {
    recommendations.push("Your portfolio looks healthy. Keep paying on due date to avoid penalties.");
  }

  recommendationList.innerHTML = recommendations.slice(0, 6).map((item) => `<li>${item}</li>`).join("");

  activity.sort((a, b) => b.sortDate - a.sortDate);
  if (!activity.length) {
    activityList.innerHTML = "<li>No recent payment activity.</li>";
    return;
  }
  activityList.innerHTML = activity
    .slice(0, 8)
    .map((item) => `<li>${item.text}</li>`)
    .join("");
}

function populateLoanSelectors(loans) {
  const optionsHtml = loans
    .map((loan) => `<option value="${loan.id}">${loan.name}</option>`)
    .join("");

  if (goalLoanSelect) {
    goalLoanSelect.innerHTML = optionsHtml || "<option value=\"\">No loans</option>";
  }
  if (exportLoanSelect) {
    exportLoanSelect.innerHTML = optionsHtml || "<option value=\"\">No loans</option>";
  }
}

function runGoalPlanner() {
  if (!goalLoanSelect || !goalPlanResult) return;
  const loanId = goalLoanSelect.value;
  const loan = cachedLoans.find((item) => item.id === loanId);
  if (!loan) {
    renderStats(goalPlanResult, [{ label: "Planner", value: "Add a loan first" }]);
    return;
  }

  const monthlyExtra = Math.max(parseNumber(goalExtraInput ? goalExtraInput.value : 0), 0);
  const base = computeSchedule(loan, 0);
  const planned = computeSchedule(loan, monthlyExtra);
  const activeRows = planned.rows.filter((row) => row.emiDue > 0.0001);
  const closeDate = activeRows.length
    ? activeRows[activeRows.length - 1].dueDate.toLocaleDateString("en-US")
    : "Already Closed";

  renderStats(goalPlanResult, [
    { label: "Close By", value: closeDate },
    { label: "Months Saved", value: String(Math.max(base.totals.effectiveMonths - planned.totals.effectiveMonths, 0)) },
    {
      label: "Interest Saved",
      value: formatCurrency(
        Math.max(base.totals.projectedInterest - planned.totals.projectedInterest, 0),
        getDisplayCurrency(loan)
      ),
    },
    {
      label: "Projected Total",
      value: formatCurrency(planned.totals.projectedTotal, getDisplayCurrency(loan)),
    },
  ]);
}

function buildPenaltyTracker(loans) {
  if (!penaltyStats || !penaltyLogList) return;
  if (!loans.length) {
    renderStats(penaltyStats, [{ label: "Penalty", value: "No loans" }]);
    penaltyLogList.innerHTML = "<li>No late-fee data yet.</li>";
    return;
  }

  let totalAccrued = 0;
  let potentialNext30 = 0;
  const logs = [];

  loans.forEach((loan) => {
    const computed = computeSchedule(loan);
    computed.rows.forEach((row) => {
      if (row.isOverdue && row.penaltyAccrued > 0) {
        totalAccrued += row.penaltyAccrued;
        const projected = loan.late_fee_per_day * 30;
        potentialNext30 += projected;
        logs.push(
          `${loan.name} - ${row.monthName}: ${row.overdueDays} overdue day(s), accrued ${formatCurrency(
            row.penaltyAccrued,
            getDisplayCurrency(loan)
          )}, avoid ${formatCurrency(projected, getDisplayCurrency(loan))} by paying now.`
        );
      }
    });
  });

  renderStats(penaltyStats, [
    { label: "Accrued Late Fee", value: formatCurrency(totalAccrued, getDisplayCurrency(loans[0])) },
    { label: "Projected 30-day Penalty", value: formatCurrency(potentialNext30, getDisplayCurrency(loans[0])) },
    { label: "Penalty Avoidable Now", value: formatCurrency(potentialNext30, getDisplayCurrency(loans[0])) },
  ]);

  penaltyLogList.innerHTML = logs.length
    ? logs.slice(0, 10).map((item) => `<li>${item}</li>`).join("")
    : "<li>No overdue penalty logs.</li>";
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function loanRowsToCsv(loan) {
  const computed = computeSchedule(loan);
  const headers = [
    "Loan Name",
    "Month",
    "Due Date",
    "EMI Due",
    "Interest",
    "Principal",
    "Extra",
    "Status",
    "Remaining",
  ];
  const lines = [headers.join(",")];
  computed.rows.forEach((row) => {
    const status = row.paid ? "Paid" : row.isClosed ? "Closed" : row.isOverdue ? "Overdue" : "Pending";
    lines.push(
      [
        `"${loan.name}"`,
        `"${row.monthName}"`,
        `"${row.dueDate.toLocaleDateString("en-US")}"`,
        row.emiDue.toFixed(2),
        row.interestDue.toFixed(2),
        row.principalDue.toFixed(2),
        row.extra.toFixed(2),
        status,
        row.remaining.toFixed(2),
      ].join(",")
    );
  });
  return lines.join("\n");
}

function portfolioToCsv(loans) {
  const headers = [
    "Loan Name",
    "Amount",
    "EMI",
    "APR",
    "Deduction Day",
    "Outstanding",
    "Projected Interest",
    "Overdue EMIs",
  ];
  const lines = [headers.join(",")];
  loans.forEach((loan) => {
    const computed = computeSchedule(loan);
    lines.push(
      [
        `"${loan.name}"`,
        loan.amount.toFixed(2),
        loan.emi.toFixed(2),
        loan.annual_rate.toFixed(2),
        loan.deduction_day,
        computed.totals.remaining.toFixed(2),
        computed.totals.projectedInterest.toFixed(2),
        computed.totals.overdueCount,
      ].join(",")
    );
  });
  return lines.join("\n");
}

function openPrintHtml(title, bodyHtml) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head><title>${title}</title></head>
      <body style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>${title}</h2>
        ${bodyHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function exportSelectedLoanCsv() {
  const loan = cachedLoans.find((item) => item.id === (exportLoanSelect ? exportLoanSelect.value : ""));
  if (!loan) {
    setAppMessage("Select a loan to export.");
    return;
  }
  downloadTextFile(`${loan.name.replace(/\\s+/g, "_")}_statement.csv`, loanRowsToCsv(loan), "text/csv");
}

function exportPortfolioCsv() {
  if (!cachedLoans.length) {
    setAppMessage("No loans to export.");
    return;
  }
  downloadTextFile("portfolio_statement.csv", portfolioToCsv(cachedLoans), "text/csv");
}

function exportSelectedLoanPdf() {
  const loan = cachedLoans.find((item) => item.id === (exportLoanSelect ? exportLoanSelect.value : ""));
  if (!loan) {
    setAppMessage("Select a loan to export.");
    return;
  }
  const rows = computeSchedule(loan).rows;
  const rowsHtml = rows
    .map(
      (row) =>
        `<tr><td>${row.monthName}</td><td>${row.dueDate.toLocaleDateString(
          "en-US"
        )}</td><td>${formatCurrency(row.emiDue, getDisplayCurrency(loan))}</td><td>${formatCurrency(
          row.remaining,
          getDisplayCurrency(loan)
        )}</td></tr>`
    )
    .join("");
  openPrintHtml(
    `${loan.name} Statement`,
    `<table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Month</th><th>Due Date</th><th>EMI</th><th>Remaining</th></tr></thead><tbody>${rowsHtml}</tbody></table>`
  );
}

function exportPortfolioPdf() {
  if (!cachedLoans.length) {
    setAppMessage("No loans to export.");
    return;
  }
  const rowsHtml = cachedLoans
    .map((loan) => {
      const totals = computeSchedule(loan).totals;
      return `<tr><td>${loan.name}</td><td>${formatCurrency(
        loan.amount,
        getDisplayCurrency(loan)
      )}</td><td>${formatCurrency(loan.emi, getDisplayCurrency(loan))}</td><td>${formatCurrency(
        totals.remaining,
        getDisplayCurrency(loan)
      )}</td></tr>`;
    })
    .join("");
  openPrintHtml(
    "Portfolio Statement",
    `<table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Loan</th><th>Amount</th><th>EMI</th><th>Outstanding</th></tr></thead><tbody>${rowsHtml}</tbody></table>`
  );
}

function updateAuthTabs(showLogin) {
  showLoginBtn.classList.toggle("active", showLogin);
  showSignupBtn.classList.toggle("active", !showLogin);
  loginForm.classList.toggle("hidden", !showLogin);
  signupForm.classList.toggle("hidden", showLogin);
}

function showAuth() {
  authView.classList.remove("hidden");
  appView.classList.add("hidden");
}

function showApp() {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function showDashboardPage() {
  if (dashboardSection) dashboardSection.classList.remove("hidden");
  if (detailPage) detailPage.classList.add("hidden");
  if (allLoansPage) allLoansPage.classList.add("hidden");
}

function showDetailPage() {
  if (dashboardSection) dashboardSection.classList.add("hidden");
  if (detailPage) detailPage.classList.remove("hidden");
  if (allLoansPage) allLoansPage.classList.add("hidden");
}

function showAllLoansSheetPage() {
  if (dashboardSection) dashboardSection.classList.add("hidden");
  if (detailPage) detailPage.classList.add("hidden");
  if (allLoansPage) allLoansPage.classList.remove("hidden");
}

function setAuthMessage(text, isError = true) {
  authMessage.style.color = isError ? "#b91c1c" : "#166534";
  authMessage.textContent = text;
}

function setAppMessage(text, isError = true) {
  if (!appMessage) return;
  appMessage.style.color = isError ? "#b91c1c" : "#166534";
  appMessage.textContent = text;
}

function getMissingColumnFromError(message) {
  if (typeof message !== "string") return "";
  const match = message.match(/column\\s+[^.]+\\.([a-zA-Z0-9_]+)\\s+does not exist/i);
  return match && match[1] ? match[1] : "";
}

async function insertLoanAdaptive(payload) {
  const mutablePayload = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabaseClient.from("loans").insert(mutablePayload).select("id").single();
    if (!result.error) return result;

    const missingColumn = getMissingColumnFromError(result.error.message);
    if (!missingColumn || !(missingColumn in mutablePayload)) {
      return result;
    }
    delete mutablePayload[missingColumn];
  }

  return { data: null, error: { message: "Insert failed after adaptive retries." } };
}

async function updateLoanAdaptive(loanId, userId, payload) {
  const mutablePayload = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabaseClient
      .from("loans")
      .update(mutablePayload)
      .eq("id", loanId)
      .eq("user_id", userId);

    if (!result.error) return result;

    const missingColumn = getMissingColumnFromError(result.error.message);
    if (!missingColumn || !(missingColumn in mutablePayload)) {
      return result;
    }
    delete mutablePayload[missingColumn];
  }

  return { error: { message: "Update failed after adaptive retries." } };
}

async function getLoans() {
  if (!currentUser) return [];
  const query = await supabaseClient
    .from("loans")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (query.error) {
    setAppMessage(query.error.message);
    return [];
  }

  return (query.data || []).map(normalizeLoan);
}

function renderLoanPills(loans) {
  loanPills.innerHTML = "";
  if (!loans.length) {
    loanPills.innerHTML = '<p class="muted">No loans yet. Add your first loan.</p>';
    return;
  }

  loans.forEach((loan) => {
    const computed = computeSchedule(loan);
    const totals = computed.totals;
    const overdue = computed.rows.filter((row) => row.isOverdue).length;
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "loan-card-btn";
    pill.innerHTML = `
      <span class="loan-card-title">${loan.name}</span>
      <span class="loan-card-meta">EMI: ${formatCurrency(loan.emi, getDisplayCurrency(loan))}</span>
      <span class="loan-card-meta">Remaining: ${formatCurrency(
        totals.remaining,
        getDisplayCurrency(loan)
      )}</span>
      <span class="loan-card-meta">Due Day: ${loan.deduction_day} | Overdue: ${overdue}</span>
    `;
    pill.addEventListener("click", () => {
      selectedLoanId = loan.id;
      renderLoanDetails(loan.id);
      showDetailPage();
    });
    loanPills.appendChild(pill);
  });
}

function buildAllLoansColumns(loans) {
  if (!loans.length) return [];

  let minStart = null;
  let maxEnd = null;

  loans.forEach((loan) => {
    const startKey = monthKeyFromDate(new Date(loan.start_month));
    const computed = computeSchedule(loan);
    const monthsCount = computed.rows.length;
    const endKey = monthKeyAdd(startKey, monthsCount - 1);
    if (!minStart || startKey < minStart) minStart = startKey;
    if (!maxEnd || endKey > maxEnd) maxEnd = endKey;
  });

  const columns = [];
  let current = minStart;
  while (current <= maxEnd) {
    columns.push(current);
    current = monthKeyAdd(current, 1);
  }

  return columns;
}

function renderAllLoansSheet(loans) {
  allLoansHead.innerHTML = "";
  allLoansBody.innerHTML = "";

  if (!loans.length) {
    allLoansBody.innerHTML = '<tr><td class="muted">No loans yet. Add a loan to see the sheet.</td></tr>';
    return;
  }

  const columns = buildAllLoansColumns(loans);
  const headRow = document.createElement("tr");
  headRow.innerHTML = `<th>Loan Name</th>${columns
    .map((monthKey) => `<th>${longMonthLabel(monthKey)}</th>`)
    .join("")}`;
  allLoansHead.appendChild(headRow);

  loans.forEach((loan) => {
    const row = document.createElement("tr");
    const computed = computeSchedule(loan);
    const loanMonthMap = {};
    const startKey = monthKeyFromDate(new Date(loan.start_month));

    computed.rows.forEach((item, index) => {
      const monthKey = monthKeyAdd(startKey, index);
      loanMonthMap[monthKey] = item;
    });

    let rowHtml = `<td class="loan-name">${loan.name}</td>`;
    columns.forEach((monthKey) => {
      if (!(monthKey in loanMonthMap)) {
        rowHtml += "<td></td>";
        return;
      }

      const monthCell = loanMonthMap[monthKey];
      if (monthCell.emiDue > 0.0001) {
        const stateClass = monthCell.paid
          ? "paid-cell"
          : monthCell.isOverdue
          ? "overdue-cell"
          : "pending-cell";
        rowHtml += `<td class="${stateClass}">${formatCurrency(
          monthCell.emiDue,
          getDisplayCurrency(loan)
        )}</td>`;
      } else {
        rowHtml += '<td class="closed-cell">0</td>';
      }
    });

    row.innerHTML = rowHtml;
    allLoansBody.appendChild(row);
  });
}

async function renderLoanDetails(loanId) {
  const loans = await getLoans();
  const loan = loans.find((item) => item.id === loanId);
  if (!loan) return;
  selectedLoanData = loan;
  closeEditPanel();

  const computed = computeSchedule(loan);
  const rows = computed.rows;
  const totals = computed.totals;
  const modeLabel = loan.calc_mode === "tracking" ? "Tracking only" : "Calculated";

  detailTitle.textContent = loan.name;
  detailMeta.textContent = `${formatCurrency(loan.amount, getDisplayCurrency(loan))} | APR ${percent(
    loan.annual_rate
  )} | EMI ${formatCurrency(loan.emi, getDisplayCurrency(loan))} | Due day ${
    loan.deduction_day
  } | Late fee/day ${formatCurrency(loan.late_fee_per_day, getDisplayCurrency(loan))}`;

  renderStats(detailStats, [
    { label: "Projected Interest", value: formatCurrency(totals.projectedInterest, getDisplayCurrency(loan)) },
    { label: "Mode", value: modeLabel },
    { label: "Interest Paid", value: formatCurrency(totals.paidInterest, getDisplayCurrency(loan)) },
    { label: "Principal Paid", value: formatCurrency(totals.paidPrincipal, getDisplayCurrency(loan)) },
    { label: "Interest Saved", value: formatCurrency(totals.interestSaved, getDisplayCurrency(loan)) },
    { label: "Extra Paid", value: formatCurrency(totals.usedExtra, getDisplayCurrency(loan)) },
    { label: "Months Reduced", value: String(totals.monthsReduced) },
    { label: "Overdue", value: String(totals.overdueCount) },
    { label: "On-time %", value: percent(totals.onTimeRate) },
    { label: "Processing Fee", value: formatCurrency(loan.processing_fee, getDisplayCurrency(loan)) },
    { label: "Total Outflow", value: formatCurrency(totals.projectedTotal, getDisplayCurrency(loan)) },
  ]);

  scheduleBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    if (row.paid) tr.classList.add("paid");
    else if (row.isClosed) tr.classList.add("closed");
    else if (row.isOverdue) tr.classList.add("overdue");

    const status = row.paid ? "Paid" : row.isClosed ? "Closed" : row.isOverdue ? "Overdue" : "Pending";

    tr.innerHTML = `
      <td>${row.monthName}</td>
      <td>${row.dueDate.toLocaleDateString("en-US")}</td>
      <td>${formatCurrency(row.interestDue, getDisplayCurrency(loan))}</td>
      <td>${formatCurrency(row.principalDue, getDisplayCurrency(loan))}</td>
      <td>${formatCurrency(row.emiDue, getDisplayCurrency(loan))}</td>
      <td>
        <input type="number" min="0" value="${row.extra}" data-action="extra" data-index="${row.index}" ${
      row.isClosed ? "disabled" : ""
    } />
      </td>
      <td>${formatCurrency(row.totalDue, getDisplayCurrency(loan))}</td>
      <td>${status}</td>
      <td>${formatCurrency(row.remaining, getDisplayCurrency(loan))}</td>
      <td>
        <input type="checkbox" data-action="paid" data-index="${row.index}" ${
      row.paid ? "checked" : ""
    } ${row.isClosed ? "disabled" : ""} />
      </td>
    `;

    scheduleBody.appendChild(tr);
  });

  detailSection.classList.remove("hidden");
  showDetailPage();
}

async function renderDashboard() {
  if (dashboardRenderPromise) {
    return dashboardRenderPromise;
  }

  dashboardRenderPromise = (async () => {
  if (!currentUser) {
    showAuth();
    return;
  }

  showApp();
  setAppMessage("");
  const metadataName =
    currentUser && currentUser.user_metadata ? currentUser.user_metadata.name : "";
  const name = metadataName || (currentUser ? currentUser.email : "") || "User";
  welcomeText.textContent = `Welcome, ${name}`;

  const loans = await getLoans();
  refreshAllSections(loans);

  showDashboardPage();
  })();

  try {
    await dashboardRenderPromise;
  } finally {
    dashboardRenderPromise = null;
  }
}

async function signup(event) {
  event.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    setAuthMessage(error.message);
    return;
  }

  setAuthMessage("Account created. Please login (or confirm your email if required).", false);
  signupForm.reset();
  updateAuthTabs(true);
}

async function login(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  setLoading(true, "Signing in...");
  try {
    const { data, error } = await withTimeout(
      supabaseClient.auth.signInWithPassword({ email, password }),
      REQUEST_TIMEOUT_MS,
      "Login timed out. Please check your internet/Supabase and try again."
    );
    if (error) {
      setAuthMessage(error.message);
      return;
    }

    currentUser = data.user;
    loginForm.reset();
    selectedLoanId = null;
    setAuthMessage("");
    await withTimeout(
      renderDashboard(),
      REQUEST_TIMEOUT_MS,
      "Loading dashboard timed out. Please refresh and try again."
    );
  } catch (error) {
    setAuthMessage(error && error.message ? error.message : "Login failed.");
  } finally {
    setLoading(false);
  }
}

async function loginWithGoogle() {
  if (!supabaseClient) {
    setAuthMessage("Supabase is not initialized.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });

  if (error) {
    setAuthMessage(error.message);
  }
}

async function logout() {
  try {
    if (supabaseClient && supabaseClient.auth) {
      await supabaseClient.auth.signOut();
    }
  } catch (_error) {
    // Fall through: local logout still proceeds even if network/API signout fails.
  }
  currentUser = null;
  cachedLoans = [];
  selectedLoanId = null;
  selectedLoanData = null;
  closeEditPanel();
  setAppMessage("Logged out.", false);
  showDashboardPage();
  showAuth();
}

async function deleteSelectedLoan() {
  if (!currentUser || !selectedLoanId || !selectedLoanData) {
    setAppMessage("Open a loan before deleting.");
    return;
  }

  const loanName = selectedLoanData.name || "this loan";
  const confirmed = window.confirm(`Delete "${loanName}" permanently? This cannot be undone.`);
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("loans")
    .delete()
    .eq("id", selectedLoanId)
    .eq("user_id", currentUser.id);

  if (error) {
    setAppMessage(error.message);
    return;
  }

  selectedLoanId = null;
  selectedLoanData = null;
  closeEditPanel();
  const loans = await getLoans();
  refreshAllSections(loans);
  showDashboardPage();
  setAppMessage(`Deleted "${loanName}".`, false);
}

async function saveEditedLoan(event) {
  event.preventDefault();
  if (!currentUser || !selectedLoanId || !selectedLoanData) {
    setAppMessage("Select a loan before editing.");
    return;
  }

  const name = editLoanName.value.trim();
  const amount = Math.max(parseNumber(editLoanAmount.value), 0);
  const durationMonths = Math.max(parseInt(editLoanDuration.value, 10) || 0, 1);
  const emi = Math.max(parseNumber(editLoanEmi.value), 0);
  const calcMode = editLoanCalcMode.value === "tracking" ? "tracking" : "calculated";
  const annualRate = Math.max(parseNumber(editLoanRate.value), 0);
  const processingFee = Math.max(parseNumber(editLoanFee.value), 0);
  const lateFeePerDay = Math.max(parseNumber(editLoanLateFee.value), 0);
  const graceDays = Math.max(parseInt(editLoanGraceDays.value, 10) || 0, 0);
  const currencyCode = editLoanCurrency.value || "USD";
  const deductionDay = Math.max(1, Math.min(parseInt(editLoanDeductionDay.value, 10) || 1, 28));
  const startMonthInput = editLoanStart.value;

  if (!name || !amount || !emi || !startMonthInput) {
    setAppMessage("Please fill all required edit fields.");
    return;
  }

  const resizedSchedule = normalizeScheduleForDuration(selectedLoanData.schedule, durationMonths);
  const fullPayload = {
    name,
    amount,
    duration_months: durationMonths,
    emi,
    calc_mode: calcMode,
    annual_rate: annualRate,
    processing_fee: processingFee,
    late_fee_per_day: lateFeePerDay,
    grace_days: graceDays,
    currency_code: currencyCode,
    deduction_day: deductionDay,
    start_month: normalizeStartMonth(startMonthInput),
    schedule: resizedSchedule,
  };

  const updateResult = await updateLoanAdaptive(selectedLoanId, currentUser.id, fullPayload);

  if (updateResult.error) {
    setAppMessage(updateResult.error.message);
    return;
  }

  closeEditPanel();
  setAppMessage("Loan updated successfully.", false);
  await renderLoanDetails(selectedLoanId);
  const loans = await getLoans();
  refreshAllSections(loans);
}

async function addLoan(event) {
  event.preventDefault();
  const name = document.getElementById("loanName").value.trim();
  const amount = Math.max(parseNumber(document.getElementById("loanAmount").value), 0);
  const durationMonths = Math.max(parseInt(document.getElementById("loanDuration").value, 10) || 0, 1);
  const emi = Math.max(parseNumber(document.getElementById("loanEmi").value), 0);
  const calcMode = loanCalcMode && loanCalcMode.value === "tracking" ? "tracking" : "calculated";
  const annualRate = Math.max(parseNumber(document.getElementById("loanRate").value), 0);
  const processingFee = Math.max(parseNumber(document.getElementById("loanFee").value), 0);
  const lateFeePerDay = Math.max(parseNumber(document.getElementById("loanLateFee").value), 0);
  const graceDays = Math.max(parseInt(document.getElementById("loanGraceDays").value, 10) || 0, 0);
  const deductionDay = Math.max(
    1,
    Math.min(parseInt(document.getElementById("loanDeductionDay").value, 10) || 1, 28)
  );
  const currencyCode = document.getElementById("loanCurrency").value;
  const startMonthInput = document.getElementById("loanStart").value;

  if (!currentUser) {
    setAppMessage("Session expired. Please login again.");
    return;
  }

  if (!name || !amount || !durationMonths || !emi || !startMonthInput) {
    setAppMessage("Please fill all required loan fields.");
    return;
  }

  const payload = {
    user_id: currentUser.id,
    name,
    amount,
    duration_months: durationMonths,
    emi,
    calc_mode: calcMode,
    annual_rate: annualRate,
    processing_fee: processingFee,
    late_fee_per_day: lateFeePerDay,
    grace_days: graceDays,
    deduction_day: deductionDay,
    currency_code: currencyCode || "USD",
    start_month: normalizeStartMonth(startMonthInput),
    schedule: createDefaultSchedule(durationMonths),
  };

  setLoading(true, "Creating loan...");
  setLoanSubmitDisabled(true);
  try {
    const insertResult = await withTimeout(
      insertLoanAdaptive(payload),
      REQUEST_TIMEOUT_MS,
      "Create loan request timed out."
    );

    if (insertResult.error) {
      setAppMessage(insertResult.error.message);
      return;
    }

    loanForm.reset();
    if (loanCalcMode) {
      syncCalcModeFields(loanCalcMode.value, false);
    }
    if (loanCurrency && selectedDisplayCurrency !== "AUTO") {
      loanCurrency.value = selectedDisplayCurrency;
    }
    selectedLoanId = insertResult.data.id;
    const loans = await withTimeout(
      getLoans(),
      REQUEST_TIMEOUT_MS,
      "Refreshing dashboard timed out after creating loan."
    );
    refreshAllSections(loans);
    await withTimeout(
      renderLoanDetails(insertResult.data.id),
      REQUEST_TIMEOUT_MS,
      "Loading new loan details timed out."
    );
    setAppMessage("Loan created and dashboard refreshed.", false);
  } catch (error) {
    setAppMessage(error && error.message ? error.message : "Failed to create loan.");
  } finally {
    setLoanSubmitDisabled(false);
    setLoading(false);
  }
}

async function updateLoanSchedule(loanId, rowIndex, type, value) {
  const { data: loan, error: readError } = await supabaseClient
    .from("loans")
    .select("id, user_id, duration_months, schedule")
    .eq("id", loanId)
    .eq("user_id", currentUser.id)
    .single();

  if (readError || !loan) {
    setAppMessage((readError && readError.message) || "Failed to load loan.");
    return;
  }

  const normalized = normalizeLoan(loan);
  const schedule = normalized.schedule;

  if (!schedule[rowIndex]) {
    schedule[rowIndex] = { paid: false, extra: 0 };
  }

  if (type === "paid") {
    schedule[rowIndex].paid = value;
  }

  if (type === "extra") {
    schedule[rowIndex].extra = Math.max(parseNumber(value), 0);
  }

  const { error: updateError } = await supabaseClient
    .from("loans")
    .update({ schedule })
    .eq("id", loanId)
    .eq("user_id", currentUser.id);

  if (updateError) {
    setAppMessage(updateError.message);
    return;
  }

  const loans = await getLoans();
  refreshAllSections(loans);
  await renderLoanDetails(loanId);
}

function ensureSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    setAuthMessage("Supabase config missing. Update supabase-config.js first.");
    loginForm.querySelector("button").disabled = true;
    signupForm.querySelector("button").disabled = true;
    return false;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

async function boot() {
  showLoginBtn.addEventListener("click", () => {
    setAuthMessage("");
    updateAuthTabs(true);
  });

  showSignupBtn.addEventListener("click", () => {
    setAuthMessage("");
    updateAuthTabs(false);
  });

  loginForm.addEventListener("submit", login);
  signupForm.addEventListener("submit", signup);
  if (loanCalcMode) {
    syncCalcModeFields(loanCalcMode.value, false);
    loanCalcMode.addEventListener("change", (event) => {
      syncCalcModeFields(event.target.value, false);
    });
  }
  if (editLoanCalcMode) {
    editLoanCalcMode.addEventListener("change", (event) => {
      syncCalcModeFields(event.target.value, true);
    });
  }
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", loginWithGoogle);
  }
  if (runGoalPlanBtn) {
    runGoalPlanBtn.addEventListener("click", () => {
      runGoalPlanner();
    });
  }
  if (goalLoanSelect) {
    goalLoanSelect.addEventListener("change", () => {
      runGoalPlanner();
    });
  }
  if (exportLoanCsvBtn) {
    exportLoanCsvBtn.addEventListener("click", exportSelectedLoanCsv);
  }
  if (exportPortfolioCsvBtn) {
    exportPortfolioCsvBtn.addEventListener("click", exportPortfolioCsv);
  }
  if (exportLoanPdfBtn) {
    exportLoanPdfBtn.addEventListener("click", exportSelectedLoanPdf);
  }
  if (exportPortfolioPdfBtn) {
    exportPortfolioPdfBtn.addEventListener("click", exportPortfolioPdf);
  }
  if (editLoanBtn) {
    editLoanBtn.addEventListener("click", () => {
      if (!selectedLoanData) {
        setAppMessage("Open a loan before editing.");
        return;
      }
      openEditPanel(selectedLoanData);
    });
  }
  if (deleteLoanBtn) {
    deleteLoanBtn.addEventListener("click", deleteSelectedLoan);
  }
  if (cancelEditLoan) {
    cancelEditLoan.addEventListener("click", () => {
      closeEditPanel();
    });
  }
  if (editLoanForm) {
    editLoanForm.addEventListener("submit", saveEditedLoan);
  }
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (logoutBtnDetail) logoutBtnDetail.addEventListener("click", logout);
  if (logoutBtnAllLoans) logoutBtnAllLoans.addEventListener("click", logout);

  if (globalCurrency) {
    const savedCurrency = loadSavedDisplayCurrency();
    selectedDisplayCurrency = savedCurrency;
    globalCurrency.value = savedCurrency;
    if (loanCurrency && selectedDisplayCurrency !== "AUTO") {
      loanCurrency.value = selectedDisplayCurrency;
    }

    globalCurrency.addEventListener("change", async (event) => {
      selectedDisplayCurrency = event.target.value || "AUTO";
      if (loanCurrency && selectedDisplayCurrency !== "AUTO") {
        loanCurrency.value = selectedDisplayCurrency;
      }
      const loans = await getLoans();
      refreshAllSections(loans);
      if (selectedLoanId) {
        await renderLoanDetails(selectedLoanId);
      }
    });
  }

  if (saveCurrencyBtn) {
    saveCurrencyBtn.addEventListener("click", async () => {
      saveDisplayCurrency(selectedDisplayCurrency);
      setAppMessage("Display currency saved.", false);
      const loans = await getLoans();
      refreshAllSections(loans);
      if (selectedLoanId) {
        await renderLoanDetails(selectedLoanId);
      }
    });
  }

  if (openAllLoansPage) {
    openAllLoansPage.addEventListener("click", async () => {
      // Open instantly with cached data, then sync from server.
      renderAllLoansSheet(cachedLoans);
      showAllLoansSheetPage();
      const loans = await getLoans();
      refreshAllSections(loans);
      renderAllLoansSheet(loans);
    });
  }
  if (trendModeTabs) {
    trendModeTabs.addEventListener("click", (event) => {
      const button = event.target.closest(".chart-tab");
      if (!button) return;
      setTrendMode(button.dataset.mode);
    });
  }
  if (scrollToAddLoanBtn) {
    scrollToAddLoanBtn.addEventListener("click", () => {
      if (addLoanSection) {
        addLoanSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  loanForm.addEventListener("submit", addLoan);
  backToDashboard.addEventListener("click", () => {
    selectedLoanId = null;
    selectedLoanData = null;
    closeEditPanel();
    showDashboardPage();
  });
  backFromAllLoans.addEventListener("click", () => {
    showDashboardPage();
  });

  scheduleBody.addEventListener("change", async (event) => {
    const target = event.target;
    const action = target.dataset.action;
    const index = Number(target.dataset.index);
    if (!action || Number.isNaN(index) || !selectedLoanId) return;

    if (action === "paid") {
      await updateLoanSchedule(selectedLoanId, index, "paid", target.checked);
    }

    if (action === "extra") {
      await updateLoanSchedule(selectedLoanId, index, "extra", target.value);
    }
  });

  updateAuthTabs(true);
  showAuth();

  const initialTheme = getSavedTheme();
  applyTheme(initialTheme);
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
      applyTheme(nextTheme);
      saveTheme(nextTheme);
    });
  }

  try {
    if (!ensureSupabaseConfig()) {
      return;
    }

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (user) {
      currentUser = user;
      await renderDashboard();
    }

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session && session.user ? session.user : null;
      if (currentUser) {
        await renderDashboard();
      } else {
        showAuth();
        showDashboardPage();
      }
    });
  } catch (error) {
    setAuthMessage(error && error.message ? error.message : "Initialization failed.");
  }
}

boot();
