const goalForm = document.getElementById("goalForm");
const appRoot = document.getElementById("appRoot");
const startScreen = document.getElementById("startScreen");
const startEmptyButton = document.getElementById("startEmptyButton");
const loadDemoButton = document.getElementById("loadDemoButton");
const onboardingOverlay = document.getElementById("onboardingOverlay");
const onboardingProgress = document.getElementById("onboardingProgress");
const onboardingTitle = document.getElementById("onboardingTitle");
const onboardingDescription = document.getElementById("onboardingDescription");
const onboardingSkipButton = document.getElementById("onboardingSkipButton");
const onboardingNextButton = document.getElementById("onboardingNextButton");
const goalInput = document.getElementById("goalInput");
const dateInput = document.getElementById("dateInput");
const lightThemeButton = document.getElementById("lightThemeButton");
const darkThemeButton = document.getElementById("darkThemeButton");
const userButton = document.getElementById("userButton");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userMenu = document.getElementById("userMenu");
const userMenuBackdrop = document.getElementById("userMenuBackdrop");
const todayTabButton = document.getElementById("todayTabButton");
const statsTabButton = document.getElementById("statsTabButton");
const historyTabButton = document.getElementById("historyTabButton");
const todayTabPanel = document.getElementById("todayTabPanel");
const statsTabPanel = document.getElementById("statsTabPanel");
const historyTabPanel = document.getElementById("historyTabPanel");
const todayDate = document.getElementById("todayDate");
const todayWeekday = document.getElementById("todayWeekday");
const effectivenessPanel = document.getElementById("effectivenessPanel");
const activityCalendar = document.getElementById("stats-calendar");
const weeklyChart = document.getElementById("weeklyChart");
const monthlyChart = document.getElementById("monthlyChart");
const achievementsGrid = document.getElementById("achievementsGrid");
const toastContainer = document.getElementById("toastContainer");
const goalText = document.getElementById("goalText");
const goalStatus = document.getElementById("goalStatus");
const doneButton = document.getElementById("doneButton");
const notDoneButton = document.getElementById("notDoneButton");
const sideMissionForm = document.getElementById("sideMissionForm");
const sideMissionInput = document.getElementById("sideMissionInput");
const sideMissionList = document.getElementById("sideMissionList");
const historyByDateButton = document.getElementById("historyByDateButton");
const historyByStatusButton = document.getElementById("historyByStatusButton");
const historyList = document.getElementById("historyList");
const exportDataButton = document.getElementById("exportDataButton");
const importDataButton = document.getElementById("importDataButton");
const importDataInput = document.getElementById("importDataInput");
const clearLocalDataButton = document.getElementById("clearLocalDataButton");
const supabaseModeIndicator = document.getElementById("supabaseModeIndicator");

startEmptyButton.textContent = "Rozpocznij";
loadDemoButton.textContent = "Załaduj dane demonstracyjne";

const SUPABASE_URL = "https://gtarmdpdmsxqidwajvhb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SOyMDhwK9c4onReVOplVOw_17O_97KL";
const STORAGE_KEY = "dailyGoals";
const APP_DATA_KEY = "onePointAppData";
const THEME_KEY = "appTheme";
const WELCOME_KEY = "welcomeSeen";
const SHOWN_ACHIEVEMENTS_KEY = "shownAchievements";
const ONBOARDING_KEY = "onboardingSeen";
const today = getTodayDateKey();
const hasInitialAppData = localStorage.getItem(APP_DATA_KEY) !== null;
const hasSeenWelcome = localStorage.getItem(WELCOME_KEY) === "true";
const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY) === "true";
const supabaseClient = initSupabaseClient();
let appData = loadAppData();
let selectedDate = today;
let historyView = "date";
let activeTab = "today";
let onboardingStepIndex = 0;

const onboardingSteps = [
  {
    title: "Wybierz jeden cel dnia",
    description: "Każdego ranka zapisz jedną najważniejszą rzecz, którą chcesz dowieźć."
  },
  {
    title: "Dodaj misje poboczne",
    description: "Dopisz mniejsze zadania, które są mile widziane, ale nie ważniejsze niż cel główny."
  },
  {
    title: "Zamknij dzień wieczorem",
    description: "Oznacz cel jako zrobiony albo niezrobiony. Na tej podstawie aplikacja policzy streak, statystyki i osiągnięcia."
  }
];

function initSupabaseClient() {
  if (typeof window === "undefined" || !window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.warn("Supabase init failed:", error);
    return null;
  }
}

function updateSupabaseModeIndicator() {
  if (!supabaseModeIndicator) {
    return;
  }

  supabaseModeIndicator.textContent = supabaseClient ? "Supabase połączony" : "Tryb lokalny";
  supabaseModeIndicator.className = supabaseClient ? "supabase-mode connected" : "supabase-mode local";
}

async function testSupabaseConnection() {
  if (!supabaseClient) {
    console.info("Supabase client unavailable. Local mode active.");
    return false;
  }

  const { error } = await supabaseClient
    .from("daily_goals")
    .select("id")
    .limit(1);

  if (error) {
    console.warn("Supabase connection test failed:", error);
    return false;
  }

  console.info("Supabase connection OK");
  return true;
}

// Tworzymy tekstowy klucz dla dzisiejszej daty, np. "2026-06-19".
// Przy starcie aplikacji selectedDate dostaje właśnie tę wartość.
function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return getTodayDateKey();
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split("-");
  return `${day}.${month}.${year}`;
}

function createDateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatPageDate(dateKey) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(createDateFromKey(dateKey));
}

function formatPageWeekday(dateKey) {
  const weekday = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long"
  }).format(createDateFromKey(dateKey));

  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function formatHistoryDate(dateKey) {
  if (dateKey === today) {
    return "Dzisiaj";
  }

  if (dateKey === addDays(today, -1)) {
    return "Wczoraj";
  }

  return formatPageDate(dateKey);
}

function getSideMissionCountText(count) {
  if (count === 1) {
    return "1 misja poboczna";
  }

  if (count >= 2 && count <= 4) {
    return `${formatNumber(count)} misje poboczne`;
  }

  return `${formatNumber(count)} misji pobocznych`;
}

function getWeekdayName(dateKey) {
  const names = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
  const date = createDateFromKey(dateKey);

  return names[date.getDay()];
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + days);

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  const newDay = String(date.getDate()).padStart(2, "0");

  return `${newYear}-${newMonth}-${newDay}`;
}

// Misje poboczne używają pola done:
// null oznacza brak decyzji, true oznacza zrobioną, false oznacza niezrobioną.
function normalizeSideMission(mission) {
  let done = null;

  if (mission.done === true) {
    done = true;
  }

  if (mission.done === false) {
    done = false;
  }

  if (mission.status === "done") {
    done = true;
  }

  if (mission.status === "not-done") {
    done = false;
  }

  return {
    text: mission.text || "",
    done: done
  };
}

// Stare dane mogły mieć pola "goal" i "done".
// Ta funkcja zamienia stary i nowy format na jeden wspólny kształt.
function normalizeGoal(goal) {
  const text = goal.text || goal.goal || "";
  let status = goal.status || "waiting";
  let done = null;
  const sideMissions = goal.sideMissions || [];

  if (goal.done === true) {
    status = "done";
  }

  if (goal.done === false) {
    status = "not-done";
  }

  if (status === "done") {
    done = true;
  }

  if (status === "not-done") {
    done = false;
  }

  return {
    text: text,
    done: done,
    status: status,
    sideMissions: sideMissions.map(normalizeSideMission)
  };
}

function createDefaultAppData() {
  return {
    users: {
      lukasz: {
        name: "Łukasz",
        dailyGoals: {}
      },
      ela: {
        name: "Ela",
        dailyGoals: {}
      }
    },
    activeUserId: "lukasz"
  };
}

function createDemoGoal(text, done, sideMissions) {
  let status = "waiting";

  if (done === true) {
    status = "done";
  }

  if (done === false) {
    status = "not-done";
  }

  return {
    text: text,
    done: done,
    status: status,
    sideMissions: sideMissions
  };
}

function createDemoSideMission(text, done) {
  return {
    text: text,
    done: done
  };
}

function createDemoAppData() {
  const demoData = createDefaultAppData();
  const lukaszGoals = {};
  const elaGoals = {};

  lukaszGoals[today] = createDemoGoal("10000 kroków", null, [
    createDemoSideMission("Wypić 2 litry wody", true),
    createDemoSideMission("Rozciąganie 10 minut", null),
    createDemoSideMission("Spacer po pracy", false)
  ]);
  lukaszGoals[addDays(today, -1)] = createDemoGoal("Trening siłowy", true, [
    createDemoSideMission("Przygotować torbę", true),
    createDemoSideMission("Białko po treningu", true)
  ]);
  lukaszGoals[addDays(today, -2)] = createDemoGoal("Przeczytać 30 stron", true, [
    createDemoSideMission("Notatka z książki", true),
    createDemoSideMission("Odłożyć telefon wieczorem", false)
  ]);
  lukaszGoals[addDays(today, -3)] = createDemoGoal("Plan tygodnia", true, [
    createDemoSideMission("Ustalić 3 priorytety", true)
  ]);
  lukaszGoals[addDays(today, -4)] = createDemoGoal("Bieg 5 km", false, [
    createDemoSideMission("Przygotować buty", true),
    createDemoSideMission("Wyjść przed 19:00", false)
  ]);
  lukaszGoals[addDays(today, -5)] = createDemoGoal("Nauka JavaScript 45 minut", true, [
    createDemoSideMission("Powtórzyć localStorage", true),
    createDemoSideMission("Zrobić krótkie notatki", true)
  ]);
  lukaszGoals[addDays(today, -6)] = createDemoGoal("Porządek na biurku", true, [
    createDemoSideMission("Wyrzucić stare kartki", true)
  ]);
  lukaszGoals[addDays(today, -7)] = createDemoGoal("Medytacja 10 minut", false, [
    createDemoSideMission("Przygotować timer", false)
  ]);
  lukaszGoals[addDays(today, -8)] = createDemoGoal("Zrobić przegląd finansów", true, [
    createDemoSideMission("Sprawdzić subskrypcje", true),
    createDemoSideMission("Zapisać wydatki", null)
  ]);

  elaGoals[today] = createDemoGoal("Joga 20 minut", true, [
    createDemoSideMission("Mata gotowa", true),
    createDemoSideMission("Herbata po ćwiczeniach", null)
  ]);
  elaGoals[addDays(today, -1)] = createDemoGoal("Przygotować prezentację", true, [
    createDemoSideMission("Slajd z podsumowaniem", true),
    createDemoSideMission("Wysłać PDF", true)
  ]);
  elaGoals[addDays(today, -2)] = createDemoGoal("Spacer 8000 kroków", false, [
    createDemoSideMission("Wyjść po obiedzie", false)
  ]);
  elaGoals[addDays(today, -3)] = createDemoGoal("Godzina bez telefonu", true, [
    createDemoSideMission("Odłożyć telefon do szuflady", true)
  ]);
  elaGoals[addDays(today, -4)] = createDemoGoal("Przeczytać artykuł branżowy", null, [
    createDemoSideMission("Zapisać 3 wnioski", null)
  ]);

  demoData.users.lukasz.dailyGoals = lukaszGoals;
  demoData.users.ela.dailyGoals = elaGoals;
  demoData.activeUserId = "lukasz";

  return demoData;
}

function normalizeDailyGoals(goals) {
  const normalizedGoals = goals || {};

  Object.keys(normalizedGoals).forEach(function(dateKey) {
    normalizedGoals[dateKey] = normalizeGoal(normalizedGoals[dateKey]);
  });

  return normalizedGoals;
}

// Bezpiecznie czytamy obiekt z localStorage.
// Jeśli dane są uszkodzone, aplikacja nie wywraca się, tylko używa wartości zapasowej.
function readStorageObject(key, fallbackValue) {
  const savedValue = localStorage.getItem(key);

  if (savedValue === null) {
    return fallbackValue;
  }

  try {
    const parsedValue = JSON.parse(savedValue);

    if (parsedValue === null || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return fallbackValue;
    }

    return parsedValue;
  } catch (error) {
    console.warn(`Nie udało się odczytać danych z localStorage: ${key}`);
    return fallbackValue;
  }
}

function loadOldDailyGoals() {
  const savedGoals = readStorageObject(STORAGE_KEY, {});

  return normalizeDailyGoals(savedGoals);
}

function loadAppData() {
  const savedAppData = readStorageObject(APP_DATA_KEY, null);

  if (savedAppData !== null) {
    const parsedAppData = savedAppData;

    if (!parsedAppData.users) {
      parsedAppData.users = {};
    }

    if (!parsedAppData.users.lukasz) {
      parsedAppData.users.lukasz = {
        name: "Łukasz",
        dailyGoals: {}
      };
    }

    if (!parsedAppData.users.ela) {
      parsedAppData.users.ela = {
        name: "Ela",
        dailyGoals: {}
      };
    }

    Object.keys(parsedAppData.users).forEach(function(userId) {
      parsedAppData.users[userId].dailyGoals = normalizeDailyGoals(parsedAppData.users[userId].dailyGoals);
    });

    if (!parsedAppData.activeUserId || !parsedAppData.users[parsedAppData.activeUserId]) {
      parsedAppData.activeUserId = "lukasz";
    }

    return parsedAppData;
  }

  const defaultAppData = createDefaultAppData();

  defaultAppData.users.lukasz.dailyGoals = loadOldDailyGoals();

  return defaultAppData;
}

function saveAppData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
}

function showStartScreen() {
  const hasSavedAppData = localStorage.getItem(APP_DATA_KEY) !== null;

  startScreen.className = "start-screen";
  onboardingOverlay.className = "onboarding-overlay hidden";
  appRoot.className = "app hidden";
  loadDemoButton.hidden = hasSavedAppData;
}

function hideStartScreen() {
  startScreen.className = "start-screen hidden";
  appRoot.className = "app";
}

function showAppRoot() {
  appRoot.className = "app";
}

function hideAppRoot() {
  appRoot.className = "app hidden";
}

function renderOnboardingStep() {
  const step = onboardingSteps[onboardingStepIndex];
  const stepNumber = onboardingStepIndex + 1;

  onboardingProgress.textContent = `${stepNumber}/3`;
  onboardingTitle.textContent = step.title;
  onboardingDescription.textContent = step.description;
  onboardingNextButton.textContent = stepNumber === onboardingSteps.length ? "Zaczynamy" : "Dalej";
}

function showOnboarding() {
  onboardingStepIndex = 0;
  renderOnboardingStep();
  onboardingOverlay.className = "onboarding-overlay";
  hideAppRoot();
}

function finishOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, "true");
  onboardingOverlay.className = "onboarding-overlay hidden";
  showAppRoot();
}

function finishWelcome(shouldShowOnboarding) {
  localStorage.setItem(WELCOME_KEY, "true");
  startScreen.classList.add("is-leaving");

  setTimeout(function() {
    hideStartScreen();
    startScreen.classList.remove("is-leaving");
    if (shouldShowOnboarding && localStorage.getItem(ONBOARDING_KEY) !== "true") {
      showOnboarding();
    } else {
      showAppRoot();
    }
  }, 260);
}

function startWithAppData(newAppData, shouldShowOnboarding) {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(newAppData));
  appData = loadAppData();
  selectedDate = today;
  historyView = "date";
  applyTheme(loadTheme());
  setActiveTab("today");
  renderApp();
  finishWelcome(shouldShowOnboarding);
}

function enterExistingApp() {
  selectedDate = today;
  historyView = "date";
  applyTheme(loadTheme());
  setActiveTab("today");
  renderApp();
  finishWelcome(localStorage.getItem(ONBOARDING_KEY) !== "true");
}

function getActiveUser() {
  return appData.users[appData.activeUserId];
}

function getActiveDailyGoals() {
  return getActiveUser().dailyGoals;
}

// Odczytujemy cele aktywnego użytkownika.
// Stara funkcja zostaje, żeby reszta aplikacji mogła działać bez przebudowy.
function loadGoals() {
  const goals = getActiveDailyGoals();

  return normalizeDailyGoals(goals);
}

// Zapisujemy cele aktywnego użytkownika w onePointAppData.
function saveGoals(goals) {
  getActiveUser().dailyGoals = normalizeDailyGoals(goals);
  saveAppData();
}

function slugifyUserName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]/g, "");
}

function createUniqueUserId(name) {
  const baseId = slugifyUserName(name) || "user";
  let userId = baseId;
  let counter = 2;

  while (appData.users[userId]) {
    userId = `${baseId}${counter}`;
    counter = counter + 1;
  }

  return userId;
}

function getStatusText(status) {
  if (status === "done") {
    return "Done";
  }

  if (status === "not-done") {
    return "Missed";
  }

  return "Pending";
}

function getStatusClass(status) {
  if (status === "done") {
    return "done";
  }

  if (status === "not-done") {
    return "not-done";
  }

  return "waiting";
}

function getGoalTextWithIcon(text, status) {
  const formattedText = formatNumbersInText(text);

  if (status === "done") {
    return `${formattedText} ✅`;
  }

  if (status === "not-done") {
    return `${formattedText} ❌`;
  }

  return formattedText;
}

function getMissionTextWithIcon(mission) {
  const formattedText = formatNumbersInText(mission.text);

  if (mission.done === true) {
    return `${formattedText} ✅`;
  }

  if (mission.done === false) {
    return `${formattedText} ❌`;
  }

  return formattedText;
}

function getMissionClass(mission) {
  if (mission.done === true) {
    return "done";
  }

  if (mission.done === false) {
    return "not-done";
  }

  return "waiting";
}

function getMissionCheckIcon(mission) {
  if (mission.done === true) {
    return "✓";
  }

  if (mission.done === false) {
    return "×";
  }

  return "";
}

function getMissionChecklistClass(mission) {
  if (mission.done === true) {
    return "done";
  }

  if (mission.done === false) {
    return "failed";
  }

  return "waiting";
}

// Przyciski statusu mają trzy wyglądy:
// zielony dla aktywnego "zrobione", czerwony dla aktywnego "niezrobione" i neutralny dla reszty.
function getDoneButtonClass(isDone) {
  if (isDone === true) {
    return "status-done";
  }

  return "status-neutral";
}

function getFailedButtonClass(isDone) {
  if (isDone === false) {
    return "status-failed";
  }

  return "status-neutral";
}

function getGoalDoneButtonClass(status) {
  if (status === "done") {
    return "status-done";
  }

  return "status-neutral";
}

function getGoalFailedButtonClass(status) {
  if (status === "not-done") {
    return "status-failed";
  }

  return "status-neutral";
}

function getGoalStatusBadgeClass(status) {
  if (status === "done") {
    return "goal-status-badge goal-status-done";
  }

  if (status === "not-done") {
    return "goal-status-badge goal-status-failed";
  }

  return "goal-status-badge goal-status-empty";
}

function getGoalStatusBadgeText(status) {
  if (status === "done") {
    return "Wykonane";
  }

  if (status === "not-done") {
    return "Niewykonane";
  }

  return "Brak decyzji";
}

function isGoalDone(goal) {
  return goal !== undefined && goal.done === true;
}

function isGoalFailed(goal) {
  return goal !== undefined && goal.done === false;
}

function getPercent(done, total) {
  if (total === 0) {
    return 0;
  }

  return Math.round((done / total) * 100);
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);
  const formatted = new Intl.NumberFormat("pl-PL").format(number);

  if (Math.abs(number) >= 1000 && formatted === String(number)) {
    return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  return formatted;
}

function formatPercent(value) {
  return `${formatNumber(Math.round(value))}%`;
}

function formatNumbersInText(text) {
  if (!text) {
    return "";
  }

  return String(text).replace(/\d{4,}/g, function(match) {
    return new Intl.NumberFormat("pl-PL").format(Number(match));
  });
}

function createStatsLine(text) {
  const line = document.createElement("p");

  line.textContent = text;

  return line;
}

function appendEmptyStatsMessage(section) {
  section.appendChild(createStatsLine("Poczekaj na pierwsze wyniki"));
}

function createPieChartCard(label, stats) {
  const card = document.createElement("div");
  const labelText = document.createElement("p");

  card.className = "pie-chart-card";
  labelText.className = "chart-label";
  labelText.textContent = label;
  card.appendChild(labelText);

  if (stats.total === 0) {
    card.appendChild(createStatsLine("Brak danych"));
    return card;
  }

  const percent = getPercent(stats.done, stats.total);
  const chart = document.createElement("div");
  const inner = document.createElement("div");

  chart.className = "pie-chart";
  chart.style.background = `conic-gradient(var(--success) 0% ${percent}%, var(--danger) ${percent}% 100%)`;
  inner.className = "pie-chart-inner";
  inner.textContent = formatPercent(percent);

  chart.appendChild(inner);
  card.appendChild(chart);

  return card;
}

function renderPieCharts(mainStats, sideStats, totalStats) {
  const chartsSection = document.createElement("div");

  chartsSection.className = "charts-section";
  chartsSection.appendChild(createPieChartCard("Cel dnia", mainStats));
  chartsSection.appendChild(createPieChartCard("Misje poboczne", sideStats));
  chartsSection.appendChild(createPieChartCard("Łącznie", totalStats));

  effectivenessPanel.appendChild(chartsSection);
}

// Statystyki celu dnia liczą tylko główne cele z decyzją.
// Status "done" liczy się jako wykonany, a "not-done" jako niewykonany.
function countMainGoalStats(goals) {
  let done = 0;
  let total = 0;

  Object.keys(goals).forEach(function(dateKey) {
    const goal = goals[dateKey];

    if (isGoalDone(goal)) {
      done = done + 1;
      total = total + 1;
    }

    if (isGoalFailed(goal)) {
      total = total + 1;
    }
  });

  return {
    done: done,
    total: total
  };
}

// Statystyki misji pobocznych liczą tylko misje z decyzją.
// Używamy mission.done === true i mission.done === false, bo false też jest ważną decyzją.
function countSideMissionStats(goals) {
  let done = 0;
  let total = 0;

  Object.keys(goals).forEach(function(dateKey) {
    goals[dateKey].sideMissions.forEach(function(mission) {
      if (mission.done === true) {
        done = done + 1;
        total = total + 1;
      }

      if (mission.done === false) {
        total = total + 1;
      }
    });
  });

  return {
    done: done,
    total: total
  };
}

// Seria zależy tylko od głównego celu.
// Jeśli dzisiaj nie ma decyzji, zaczynamy liczenie od wczoraj.
// Jeśli dzisiaj jest niezrobione, pętla od razu zwróci 0.
function countStreak(goals) {
  const todayGoal = goals[today];
  let dateKey = today;
  let streak = 0;

  if (todayGoal === undefined || todayGoal.status === "waiting") {
    dateKey = addDays(today, -1);
  }

  while (isGoalDone(goals[dateKey])) {
    streak = streak + 1;
    dateKey = addDays(dateKey, -1);
  }

  return streak;
}

// Rekord to najdłuższy ciąg kolejnych dni z wykonanym głównym celem.
// Brak dnia, brak decyzji albo "niezrobione" przerywa serię.
function countBestStreak(goals) {
  const dates = Object.keys(goals).sort();
  let currentStreak = 0;
  let bestStreak = 0;
  let previousDate = null;

  dates.forEach(function(dateKey) {
    const previousExpectedDate = previousDate ? addDays(previousDate, 1) : null;

    if (isGoalDone(goals[dateKey]) && (previousDate === null || previousExpectedDate === dateKey)) {
      currentStreak = currentStreak + 1;
    } else if (isGoalDone(goals[dateKey])) {
      currentStreak = 1;
    } else {
      currentStreak = 0;
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    previousDate = dateKey;
  });

  return bestStreak;
}

function hasPerfectDay(goals) {
  return Object.keys(goals).some(function(dateKey) {
    const goal = goals[dateKey];
    const sideMissions = goal.sideMissions || [];

    return goal.done === true
      && sideMissions.length > 0
      && sideMissions.every(function(mission) {
        return mission.done === true;
      });
  });
}

function hasComebackAfterFailure(goals) {
  return Object.keys(goals).some(function(dateKey) {
    const nextDateKey = addDays(dateKey, 1);

    return goals[dateKey].done === false
      && goals[nextDateKey] !== undefined
      && goals[nextDateKey].done === true;
  });
}

const ACHIEVEMENT_IDS = [
  "first-goal",
  "ten-goals",
  "hundred-goals",
  "seven-day-streak",
  "thirty-day-streak",
  "side-missions-25",
  "perfect-day",
  "comeback"
];

function createAchievement(symbol, title, description, progressValue, progressTarget) {
  const safeProgress = Math.min(progressValue, progressTarget);
  const unlocked = progressValue >= progressTarget;

  return {
    symbol: symbol,
    title: title,
    description: description,
    progressValue: safeProgress,
    progressTarget: progressTarget,
    progressPercent: progressTarget === 0 ? 0 : Math.min(100, (safeProgress / progressTarget) * 100),
    unlocked: unlocked
  };
}

function getAchievements(goals) {
  const mainStats = countMainGoalStats(goals);
  const sideStats = countSideMissionStats(goals);
  const streak = countStreak(goals);
  const record = countBestStreak(goals);
  const bestStreak = Math.max(streak, record);
  const perfectDayProgress = hasPerfectDay(goals) ? 1 : 0;
  const comebackProgress = hasComebackAfterFailure(goals) ? 1 : 0;

  return [
    createAchievement("•", "Pierwszy krok", "Wykonaj swój pierwszy cel dnia.", mainStats.done, 1),
    createAchievement("10", "Dziesiątka", "Dowieź 10 celów dnia.", mainStats.done, 10),
    createAchievement("100", "Setka", "Dowieź 100 celów dnia.", mainStats.done, 100),
    createAchievement("7", "Tydzień konsekwencji", "Utrzymaj serię przez 7 dni.", bestStreak, 7),
    createAchievement("30", "Miesiąc wojownika", "Utrzymaj serię przez 30 dni.", bestStreak, 30),
    createAchievement("□", "Misje poboczne", "Wykonaj 25 misji pobocznych.", sideStats.done, 25),
    createAchievement("◎", "Perfekcyjny dzień", "Wykonaj cel dnia i wszystkie misje poboczne jednego dnia.", perfectDayProgress, 1),
    createAchievement("↗", "Powrót po porażce", "Wróć na właściwy tor po niewykonanym dniu.", comebackProgress, 1)
  ].map(function(achievement, index) {
    achievement.id = ACHIEVEMENT_IDS[index];
    return achievement;
  });
}

function renderAchievementCard(achievement) {
  const card = document.createElement("article");
  const icon = document.createElement("div");
  const content = document.createElement("div");
  const title = document.createElement("h3");
  const description = document.createElement("p");
  const footer = document.createElement("div");
  const status = document.createElement("span");
  const progress = document.createElement("span");
  const progressBar = document.createElement("div");
  const progressFill = document.createElement("div");

  card.className = achievement.unlocked ? "achievement-card unlocked" : "achievement-card locked";
  icon.className = "achievement-icon";
  content.className = "achievement-content";
  title.className = "achievement-title";
  description.className = "achievement-description";
  footer.className = "achievement-footer";
  status.className = "achievement-status";
  progress.className = "achievement-progress";
  progressBar.className = "achievement-progress-bar";
  progressFill.className = "achievement-progress-fill";

  icon.textContent = achievement.symbol;
  title.textContent = achievement.title;
  description.textContent = achievement.description;
  status.textContent = achievement.unlocked ? "Odblokowane" : "Zablokowane";
  progress.textContent = `${formatNumber(achievement.progressValue)} / ${formatNumber(achievement.progressTarget)}`;
  progressFill.style.width = `${achievement.progressPercent}%`;

  content.appendChild(title);
  content.appendChild(description);
  footer.appendChild(status);
  footer.appendChild(progress);
  progressBar.appendChild(progressFill);
  content.appendChild(footer);
  content.appendChild(progressBar);
  card.appendChild(icon);
  card.appendChild(content);

  return card;
}

function renderAchievements() {
  const goals = loadGoals();

  achievementsGrid.innerHTML = "";

  getAchievements(goals).forEach(function(achievement) {
    achievementsGrid.appendChild(renderAchievementCard(achievement));
  });
}

function getUnlockedAchievementIds(goals) {
  return getAchievements(goals)
    .filter(function(achievement) {
      return achievement.unlocked === true;
    })
    .map(function(achievement) {
      return achievement.id;
    });
}

function loadShownAchievements() {
  return readStorageObject(SHOWN_ACHIEVEMENTS_KEY, {});
}

function saveShownAchievements(shownAchievements) {
  localStorage.setItem(SHOWN_ACHIEVEMENTS_KEY, JSON.stringify(shownAchievements));
}

function getShownAchievementsForActiveUser(shownAchievements) {
  const activeUserId = appData.activeUserId;

  if (!Array.isArray(shownAchievements[activeUserId])) {
    shownAchievements[activeUserId] = [];
  }

  return shownAchievements[activeUserId];
}

function showAchievementToast(achievement) {
  const toast = document.createElement("div");
  const icon = document.createElement("div");
  const text = document.createElement("div");
  const title = document.createElement("div");
  const name = document.createElement("div");

  toast.className = "achievement-toast";
  icon.className = "achievement-toast-icon";
  text.className = "achievement-toast-text";
  title.className = "achievement-toast-title";
  name.className = "achievement-toast-name";

  icon.textContent = "🏆";
  title.textContent = "Odblokowano osiągnięcie";
  name.textContent = achievement.title;

  text.appendChild(title);
  text.appendChild(name);
  toast.appendChild(icon);
  toast.appendChild(text);
  toastContainer.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add("show");
  });

  setTimeout(function() {
    toast.classList.remove("show");
  }, 3200);

  setTimeout(function() {
    toast.remove();
  }, 3600);
}

function showNewAchievementToasts(previousUnlockedIds, achievementsAfter) {
  const shownAchievements = loadShownAchievements();
  const shownForUser = getShownAchievementsForActiveUser(shownAchievements);
  let hasChanges = false;

  achievementsAfter.forEach(function(achievement) {
    const wasUnlockedBefore = previousUnlockedIds.includes(achievement.id);
    const wasAlreadyShown = shownForUser.includes(achievement.id);

    if (achievement.unlocked === true && !wasUnlockedBefore && !wasAlreadyShown) {
      showAchievementToast(achievement);
      shownForUser.push(achievement.id);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveShownAchievements(shownAchievements);
  }
}

function getActivityClass(goal) {
  if (isGoalDone(goal)) {
    return "contribution-done";
  }

  if (isGoalFailed(goal)) {
    return "contribution-failed";
  }

  return "contribution-empty";
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "dark";
}

function applyTheme(theme) {
  document.body.className = `theme-${theme}`;
  localStorage.setItem(THEME_KEY, theme);
  lightThemeButton.className = theme === "light" ? "status-done" : "status-neutral";
  darkThemeButton.className = theme === "dark" ? "status-done" : "status-neutral";
}

function getUserInitial(name) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

function renderUserSwitcher() {
  const activeUser = getActiveUser();

  userAvatar.textContent = getUserInitial(activeUser.name);
  userName.textContent = activeUser.name;
  userMenu.innerHTML = "";

  const menuHeader = document.createElement("div");
  const menuTitle = document.createElement("div");
  const menuSubtitle = document.createElement("div");

  menuHeader.className = "user-menu-header";
  menuTitle.className = "user-menu-title";
  menuSubtitle.className = "user-menu-subtitle";
  menuTitle.textContent = "Przełącz użytkownika";
  menuSubtitle.textContent = "Wybierz profil, którego cele i statystyki chcesz zobaczyć.";

  menuHeader.appendChild(menuTitle);
  menuHeader.appendChild(menuSubtitle);
  userMenu.appendChild(menuHeader);

  Object.keys(appData.users).forEach(function(userId) {
    const user = appData.users[userId];
    const item = document.createElement("button");
    const avatar = document.createElement("span");
    const name = document.createElement("span");

    item.type = "button";
    item.className = userId === appData.activeUserId ? "user-menu-item active" : "user-menu-item";
    avatar.className = "user-avatar";
    avatar.textContent = getUserInitial(user.name);
    name.textContent = user.name;

    item.appendChild(avatar);
    item.appendChild(name);
    item.addEventListener("click", function() {
      appData.activeUserId = userId;
      saveAppData();
      closeUserMenu();
      renderApp();
    });

    userMenu.appendChild(item);
  });

  const addButton = document.createElement("button");

  addButton.type = "button";
  addButton.className = "add-user-button";
  addButton.textContent = "+ Dodaj użytkownika";
  addButton.addEventListener("click", function() {
    addNewUser();
  });

  userMenu.appendChild(addButton);
}

function addNewUser() {
  const name = prompt("Podaj imię użytkownika:");

  if (name === null || name.trim() === "") {
    return;
  }

  const trimmedName = name.trim();
  const userId = createUniqueUserId(trimmedName);

  appData.users[userId] = {
    name: trimmedName,
    dailyGoals: {}
  };
  appData.activeUserId = userId;
  saveAppData();
  closeUserMenu();
  selectedDate = today;
  renderApp();
}

function closeUserMenu() {
  userMenu.className = "user-menu";
  userMenuBackdrop.className = "user-menu-backdrop";
  userButton.setAttribute("aria-expanded", "false");
}

function openUserMenu() {
  userMenu.className = "user-menu open";
  userMenuBackdrop.className = "user-menu-backdrop open";
  userButton.setAttribute("aria-expanded", "true");
}

function toggleUserMenu() {
  if (userMenu.className === "user-menu open") {
    closeUserMenu();
    return;
  }

  openUserMenu();
}

function setActiveTab(tabName) {
  activeTab = tabName;

  todayTabButton.className = activeTab === "today" ? "tab-button active" : "tab-button";
  statsTabButton.className = activeTab === "stats" ? "tab-button active" : "tab-button";
  historyTabButton.className = activeTab === "history" ? "tab-button active" : "tab-button";

  todayTabPanel.className = activeTab === "today" ? "tab-panel active today-panel" : "tab-panel today-panel";
  statsTabPanel.className = activeTab === "stats" ? "tab-panel active stats-tab-panel" : "tab-panel stats-tab-panel";
  historyTabPanel.className = activeTab === "history" ? "tab-panel active history-panel" : "tab-panel history-panel";
}

function goToStatsSection(sectionId) {
  setActiveTab("stats");

  setTimeout(function() {
    const section = document.getElementById(sectionId);

    if (section && section.scrollIntoView) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, 80);
}

function renderEmptyChart(chart) {
  chart.innerHTML = "";
  chart.appendChild(createStatsLine("Brak danych do wykresu"));
}

function createBar(label, value, maxValue) {
  const item = document.createElement("div");
  const valueText = document.createElement("div");
  const fill = document.createElement("div");
  const labelText = document.createElement("div");
  const height = maxValue === 0 ? 0 : Math.round((value / maxValue) * 100);

  item.className = "bar-item";
  valueText.className = "bar-value";
  valueText.textContent = formatNumber(value);
  fill.className = "bar-fill";
  fill.style.height = `${height}%`;
  labelText.className = "bar-label";
  labelText.textContent = label;

  item.appendChild(valueText);
  item.appendChild(fill);
  item.appendChild(labelText);

  return item;
}

// Wykres tygodniowy sprawdza ostatnie 7 dni i daje 1 tylko dla done === true.
function renderWeeklyChart(goals) {
  const values = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset = dayOffset - 1) {
    const dateKey = addDays(today, -dayOffset);
    values.push({
      label: getWeekdayName(dateKey),
      value: isGoalDone(goals[dateKey]) ? 1 : 0
    });
  }

  if (values.every(function(item) { return item.value === 0; })) {
    renderEmptyChart(weeklyChart);
    return;
  }

  weeklyChart.innerHTML = "";

  values.forEach(function(item) {
    weeklyChart.appendChild(createBar(item.label, item.value, 1));
  });
}

// Wykres miesięczny bierze ostatnie 30 dni i dzieli je na 5 grup po 6 dni.
// Liczymy tylko wykonane główne cele, misje poboczne są pomijane.
function renderMonthlyChart(goals) {
  const values = [];

  for (let weekIndex = 0; weekIndex < 5; weekIndex = weekIndex + 1) {
    let doneCount = 0;

    for (let dayIndex = 0; dayIndex < 6; dayIndex = dayIndex + 1) {
      const dayOffset = 29 - (weekIndex * 6 + dayIndex);
      const dateKey = addDays(today, -dayOffset);

      if (isGoalDone(goals[dateKey])) {
        doneCount = doneCount + 1;
      }
    }

    values.push({
      label: `Tydz. ${formatNumber(weekIndex + 1)}`,
      value: doneCount
    });
  }

  if (values.every(function(item) { return item.value === 0; })) {
    renderEmptyChart(monthlyChart);
    return;
  }

  monthlyChart.innerHTML = "";

  values.forEach(function(item) {
    monthlyChart.appendChild(createBar(item.label, item.value, 6));
  });
}

function renderChartsDashboard() {
  const goals = loadGoals();

  renderWeeklyChart(goals);
  renderMonthlyChart(goals);
}

function launchConfetti() {
  const colors = ["var(--accent)", "var(--success)", "var(--danger)"];

  for (let index = 0; index < 18; index = index + 1) {
    const piece = document.createElement("div");

    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    document.body.appendChild(piece);

    setTimeout(function() {
      piece.remove();
    }, 1600);
  }
}

function launchSuccessPop() {
  const pop = document.createElement("div");

  pop.className = "success-pop";
  pop.textContent = "Brawo!";
  pop.style.left = "50%";
  pop.style.top = "30%";
  document.body.appendChild(pop);

  setTimeout(function() {
    pop.remove();
  }, 900);
}

function createSmallButton(text, className, onClick) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = text;
  button.className = className;
  button.addEventListener("click", onClick);

  return button;
}

function createKpiCard(value, label, sectionId, onClick) {
  const card = document.createElement("div");
  const valueElement = document.createElement("div");
  const labelElement = document.createElement("div");

  card.className = "kpi-card";
  valueElement.className = "kpi-value";
  labelElement.className = "kpi-label";
  valueElement.textContent = value;
  labelElement.textContent = label;

  if (sectionId) {
    card.id = sectionId;
  }

  if (onClick) {
    card.className = "kpi-card clickable-stat";
    card.addEventListener("click", onClick);
  }

  card.appendChild(valueElement);
  card.appendChild(labelElement);

  return card;
}

// Panel skuteczności łączy streak, rekord i statystyki wykonania w karty KPI.
// Nie zmieniamy sposobu liczenia danych, tylko sposób ich pokazania.
function renderEffectivenessStats() {
  const goals = loadGoals();
  const streak = countStreak(goals);
  const record = countBestStreak(goals);
  const mainStats = countMainGoalStats(goals);
  const sideStats = countSideMissionStats(goals);
  const totalStats = {
    done: mainStats.done + sideStats.done,
    total: mainStats.total + sideStats.total
  };
  const kpiGrid = document.createElement("div");

  effectivenessPanel.innerHTML = "";
  kpiGrid.className = "kpi-grid";

  kpiGrid.appendChild(createKpiCard(formatNumber(streak), "Seria", "stats-streak", function() {
    goToStatsSection("stats-calendar");
  }));

  kpiGrid.appendChild(createKpiCard(formatNumber(record), "Rekord", "stats-record", function() {
    goToStatsSection("stats-streak");
  }));

  kpiGrid.appendChild(createKpiCard(
    mainStats.total === 0 ? "Brak danych" : formatPercent(getPercent(mainStats.done, mainStats.total)),
    "Skuteczność celu dnia",
    "stats-main-goal",
    function() {
      goToStatsSection("stats-main-goal");
    }
  ));

  kpiGrid.appendChild(createKpiCard(
    sideStats.total === 0 ? "Brak danych" : formatPercent(getPercent(sideStats.done, sideStats.total)),
    "Skuteczność misji",
    "stats-side-missions",
    function() {
      goToStatsSection("stats-side-missions");
    }
  ));

  kpiGrid.appendChild(createKpiCard(
    totalStats.total === 0 ? "Brak danych" : formatPercent(getPercent(totalStats.done, totalStats.total)),
    "Skuteczność ogólna",
    "stats-overall",
    function() {
      goToStatsSection("stats-overall");
    }
  ));

  kpiGrid.appendChild(createKpiCard(
    `${formatNumber(mainStats.done)} / ${formatNumber(mainStats.total)}`,
    "Cele dnia"
  ));

  kpiGrid.appendChild(createKpiCard(
    `${formatNumber(sideStats.done)} / ${formatNumber(sideStats.total)}`,
    "Misje poboczne"
  ));

  effectivenessPanel.appendChild(kpiGrid);

  renderPieCharts(mainStats, sideStats, totalStats);
}

// Kalendarz contributions pokazuje ostatnie 90 dni względem dzisiejszej daty.
// Kolor kwadratu zależy tylko od statusu głównego celu, misje poboczne go nie zmieniają.
function renderActivityCalendar() {
  const goals = loadGoals();

  activityCalendar.innerHTML = "";

  for (let dayOffset = 89; dayOffset >= 0; dayOffset = dayOffset - 1) {
    const dateKey = addDays(today, -dayOffset);
    const day = document.createElement("div");

    day.className = `contribution-day ${getActivityClass(goals[dateKey])}`;
    day.title = formatDate(dateKey);
    day.addEventListener("click", function() {
      selectedDate = dateKey;
      setActiveTab("today");
      renderApp();
    });

    if (dateKey === today) {
      day.className = `${day.className} contribution-today`;
    }

    activityCalendar.appendChild(day);
  }
}

// Renderowanie oznacza odświeżenie tego, co użytkownik widzi na stronie.
// Ta funkcja pokazuje cel z wybranej daty albo informację, że celu jeszcze nie ma.
function renderToday() {
  const goals = loadGoals();
  const selectedGoal = goals[selectedDate];

  todayDate.textContent = `${formatPageWeekday(selectedDate)}, ${formatPageDate(selectedDate)}`;
  todayWeekday.textContent = formatPageWeekday(selectedDate);
  dateInput.value = selectedDate;

  if (selectedGoal === undefined || selectedGoal.text === "") {
    goalText.textContent = "Co jest dziś najważniejsze?";
    goalText.className = "goal-hero-title empty";
    goalStatus.textContent = getGoalStatusBadgeText("waiting");
    goalStatus.className = getGoalStatusBadgeClass("waiting");
    goalInput.value = selectedGoal ? selectedGoal.text : "";
    doneButton.disabled = true;
    notDoneButton.disabled = true;
    doneButton.className = "status-neutral";
    notDoneButton.className = "status-neutral";
    return;
  }

  goalText.textContent = getGoalTextWithIcon(selectedGoal.text, selectedGoal.status);
  goalText.className = `goal-hero-title ${getStatusClass(selectedGoal.status)}`;
  goalStatus.textContent = getGoalStatusBadgeText(selectedGoal.status);
  goalStatus.className = getGoalStatusBadgeClass(selectedGoal.status);
  goalInput.value = selectedGoal.text;
  doneButton.disabled = false;
  notDoneButton.disabled = false;
  doneButton.className = getGoalDoneButtonClass(selectedGoal.status);
  notDoneButton.className = getGoalFailedButtonClass(selectedGoal.status);
}
// Misje poboczne są zapisywane przy konkretnym dniu.
// Nie wpływają na serię, bo seria sprawdza tylko status głównego celu.
function renderSideMissions() {
  const goals = loadGoals();
  const selectedGoal = goals[selectedDate];

  sideMissionList.innerHTML = "";
  sideMissionList.className = "side-list side-missions-checklist";

  if (selectedGoal === undefined || selectedGoal.sideMissions.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Brak misji pobocznych na ten dzień.";
    sideMissionList.appendChild(emptyItem);
    return;
  }

  selectedGoal.sideMissions.forEach(function(mission, index) {
    const item = document.createElement("li");
    const checkButton = document.createElement("button");
    const text = document.createElement("span");
    const deleteButton = document.createElement("button");

    item.className = "mission-checklist-item";
    checkButton.type = "button";
    checkButton.className = `mission-check ${getMissionChecklistClass(mission)}`;
    checkButton.title = "Kliknij, aby zmienić status";
    checkButton.textContent = getMissionCheckIcon(mission);
    text.textContent = formatNumbersInText(mission.text);
    text.className = `mission-title ${getMissionChecklistClass(mission)}`;
    deleteButton.type = "button";
    deleteButton.className = "mission-delete-button";
    deleteButton.textContent = "Usuń";
    deleteButton.title = "Usuń misję";

    checkButton.addEventListener("click", function() {
      cycleSideMissionDone(selectedDate, index);
    });

    deleteButton.addEventListener("click", function() {
      deleteSideMission(selectedDate, index);
    });

    item.appendChild(checkButton);
    item.appendChild(text);
    item.appendChild(deleteButton);
    sideMissionList.appendChild(item);
  });
}

function getHistoryBadgeClass(goal) {
  if (goal.done === true) {
    return "history-badge history-badge-done";
  }

  if (goal.done === false) {
    return "history-badge history-badge-failed";
  }

  return "history-badge history-badge-empty";
}

function getHistoryBadgeText(goal) {
  if (goal.done === true) {
    return "Wykonane";
  }

  if (goal.done === false) {
    return "Niewykonane";
  }

  return "Brak decyzji";
}

function getMissionBadgeClass(mission) {
  if (mission.done === true) {
    return "history-badge history-badge-done";
  }

  if (mission.done === false) {
    return "history-badge history-badge-failed";
  }

  return "history-badge history-badge-empty";
}

function getMissionBadgeText(mission) {
  if (mission.done === true) {
    return "Wykonane";
  }

  if (mission.done === false) {
    return "Niewykonane";
  }

  return "Brak decyzji";
}

function selectHistoryDate(dateKey) {
  selectedDate = dateKey;
  setActiveTab("today");
  renderApp();
}

function createHistoryDetails(dateKey, goal) {
  const details = document.createElement("div");
  const goalLine = document.createElement("p");
  const goalBadge = document.createElement("span");
  const missionTitle = document.createElement("p");
  const missionList = document.createElement("ul");

  details.className = "history-feed-details";
  goalLine.textContent = `Cel główny: ${formatNumbersInText(goal.text) || "(brak celu głównego)"}`;
  goalBadge.className = getHistoryBadgeClass(goal);
  goalBadge.textContent = getHistoryBadgeText(goal);
  missionTitle.className = "history-side-title";
  missionTitle.textContent = "Misje poboczne";
  missionList.className = "history-side-list";

  if (goal.sideMissions.length === 0) {
    const emptyMission = document.createElement("li");
    emptyMission.textContent = "Brak misji pobocznych.";
    missionList.appendChild(emptyMission);
  }

  goal.sideMissions.forEach(function(mission) {
    const missionItem = document.createElement("li");
    const missionText = document.createElement("span");
    const missionBadge = document.createElement("span");

    missionText.textContent = formatNumbersInText(mission.text) || "(pusta misja)";
    missionBadge.className = getMissionBadgeClass(mission);
    missionBadge.textContent = getMissionBadgeText(mission);

    missionItem.appendChild(missionText);
    missionItem.appendChild(missionBadge);
    missionList.appendChild(missionItem);
  });

  details.appendChild(goalLine);
  details.appendChild(goalBadge);
  details.appendChild(missionTitle);
  details.appendChild(missionList);

  return details;
}

function createHistoryDateItem(dateKey, goal) {
  const item = document.createElement("li");
  const wrapper = document.createElement("details");
  const summary = document.createElement("summary");
  const date = document.createElement("span");
  const main = document.createElement("span");
  const text = document.createElement("span");
  const badge = document.createElement("span");
  const meta = document.createElement("span");
  const actions = document.createElement("span");
  const openButton = document.createElement("button");

  item.className = "history-feed-item";
  wrapper.className = "history-feed-summary";
  summary.className = "history-feed-main";
  date.className = "history-feed-date";
  date.textContent = formatHistoryDate(dateKey);
  main.className = "history-feed-title";
  text.className = "history-feed-goal";
  text.textContent = formatNumbersInText(goal.text) || "(brak celu głównego)";
  badge.className = getHistoryBadgeClass(goal);
  badge.textContent = getHistoryBadgeText(goal);
  meta.className = "history-feed-meta";
  meta.textContent = getSideMissionCountText(goal.sideMissions.length);
  actions.className = "history-feed-actions";
  openButton.type = "button";
  openButton.className = "history-open-day";
  openButton.textContent = "Otwórz dzień";
  openButton.addEventListener("click", function(event) {
    event.preventDefault();
    event.stopPropagation();
    selectHistoryDate(dateKey);
  });

  main.appendChild(badge);
  main.appendChild(text);
  actions.appendChild(openButton);
  summary.appendChild(date);
  summary.appendChild(main);
  summary.appendChild(meta);
  summary.appendChild(actions);
  wrapper.appendChild(summary);
  wrapper.appendChild(createHistoryDetails(dateKey, goal));

  item.appendChild(wrapper);

  return item;
}

function createHistoryStatusEntry(dateKey, goal) {
  return createHistoryDateItem(dateKey, goal);
}

function createHistoryGroup(title, dates, goals) {
  const group = document.createElement("li");
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const list = document.createElement("ul");

  group.className = "history-group";
  details.open = true;
  summary.className = "history-group-header";
  summary.textContent = `${title} (${formatNumber(dates.length)})`;
  list.className = "history-group-body history-feed";

  if (dates.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-feed-empty";
    emptyItem.textContent = "Brak wpisów.";
    list.appendChild(emptyItem);
  }

  dates.forEach(function(dateKey) {
    list.appendChild(createHistoryStatusEntry(dateKey, goals[dateKey]));
  });

  details.appendChild(summary);
  details.appendChild(list);
  group.appendChild(details);

  return group;
}

function setHistoryToggleState() {
  historyByDateButton.className = historyView === "date" ? "history-toggle status-done" : "history-toggle status-neutral";
  historyByStatusButton.className = historyView === "status" ? "history-toggle status-done" : "history-toggle status-neutral";
}

function renderHistoryByDate(dates, goals) {
  dates.forEach(function(dateKey) {
    historyList.appendChild(createHistoryDateItem(dateKey, goals[dateKey]));
  });
}

function renderHistoryByStatus(dates, goals) {
  const doneDates = dates.filter(function(dateKey) {
    return goals[dateKey].done === true;
  });
  const failedDates = dates.filter(function(dateKey) {
    return goals[dateKey].done === false;
  });
  const emptyDates = dates.filter(function(dateKey) {
    return goals[dateKey].done !== true && goals[dateKey].done !== false;
  });

  historyList.appendChild(createHistoryGroup("✅ Zrealizowane", doneDates, goals));
  historyList.appendChild(createHistoryGroup("❌ Niezrealizowane", failedDates, goals));
  historyList.appendChild(createHistoryGroup("⏳ Bez decyzji", emptyDates, goals));
}

// Historia jest tylko do odczytu.
// Kliknięcie wpisu przełącza główny formularz na wybraną datę.
function renderHistory() {
  const goals = loadGoals();
  const dates = Object.keys(goals).sort().reverse();

  historyList.innerHTML = "";
  historyList.className = "history-list history-feed";
  setHistoryToggleState();

  if (dates.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-feed-empty";
    emptyItem.textContent = "Historia jest jeszcze pusta.";
    historyList.appendChild(emptyItem);
    return;
  }

  if (historyView === "status") {
    renderHistoryByStatus(dates, goals);
    return;
  }

  renderHistoryByDate(dates, goals);
}

function renderApp() {
  renderUserSwitcher();
  renderEffectivenessStats();
  renderActivityCalendar();
  renderChartsDashboard();
  renderAchievements();
  renderToday();
  renderSideMissions();
  renderHistory();
}

// Zapisuje lub aktualizuje cel dla wybranej daty.
// Jeśli cel już miał status, zostawiamy go bez zmian.
function setSelectedGoal(text) {
  const goals = loadGoals();
  const currentGoal = goals[selectedDate];

  goals[selectedDate] = {
    text: text,
    done: currentGoal ? currentGoal.done : null,
    status: currentGoal ? currentGoal.status : "waiting",
    sideMissions: currentGoal ? currentGoal.sideMissions : []
  };

  saveGoals(goals);
  renderApp();
}

function setGoalStatus(dateKey, status) {
  const goals = loadGoals();

  if (goals[dateKey] === undefined || goals[dateKey].text === "") {
    return;
  }

  const unlockedBefore = getUnlockedAchievementIds(goals);
  const wasDone = goals[dateKey].done === true;
  const clickedActiveDone = status === "done" && goals[dateKey].done === true;
  const clickedActiveFailed = status === "not-done" && goals[dateKey].done === false;

  // Ponowne kliknięcie aktywnego statusu cofa decyzję do "brak decyzji".
  if (clickedActiveDone || clickedActiveFailed) {
    goals[dateKey].status = "waiting";
    goals[dateKey].done = null;
  } else {
    goals[dateKey].status = status;
    goals[dateKey].done = status === "done";

    if (status === "not-done") {
      goals[dateKey].done = false;
    }
  }

  saveGoals(goals);
  renderApp();
  showNewAchievementToasts(unlockedBefore, getAchievements(goals));

  if (goals[dateKey].done === true && wasDone !== true) {
    launchConfetti();
  }
}

// Oznacza cel z wybranej daty jako "done" albo "not-done".
// Po zmianie statusu zapisujemy dane i odświeżamy widok.
function setSelectedStatus(status) {
  setGoalStatus(selectedDate, status);
}

function addSideMission(text) {
  const goals = loadGoals();

  if (goals[selectedDate] === undefined) {
    goals[selectedDate] = {
      text: "",
      done: null,
      status: "waiting",
      sideMissions: []
    };
  }

  goals[selectedDate].sideMissions.push({
    text: text,
    done: null
  });

  saveGoals(goals);
  renderApp();
}

// Ustawiamy true albo false jawnie.
// To ważne, bo false jest prawdziwą decyzją, a nie brakiem wartości.
function setSideMissionDone(dateKey, missionIndex, done) {
  const goals = loadGoals();

  if (goals[dateKey] === undefined) {
    return;
  }

  const mission = goals[dateKey].sideMissions[missionIndex];

  if (mission === undefined) {
    return;
  }

  const unlockedBefore = getUnlockedAchievementIds(goals);
  const wasDone = mission.done === true;

  mission.done = done;
  saveGoals(goals);
  renderApp();
  showNewAchievementToasts(unlockedBefore, getAchievements(goals));

  if (mission.done === true && wasDone !== true) {
    launchSuccessPop();
  }
}

function cycleSideMissionDone(dateKey, missionIndex) {
  const goals = loadGoals();

  if (goals[dateKey] === undefined) {
    return;
  }

  const mission = goals[dateKey].sideMissions[missionIndex];

  if (mission === undefined) {
    return;
  }

  const unlockedBefore = getUnlockedAchievementIds(goals);
  const wasDone = mission.done === true;

  if (mission.done !== true && mission.done !== false) {
    mission.done = true;
  } else if (mission.done === true) {
    mission.done = false;
  } else {
    mission.done = null;
  }

  saveGoals(goals);
  renderApp();
  showNewAchievementToasts(unlockedBefore, getAchievements(goals));

  if (mission.done === true && wasDone !== true) {
    launchSuccessPop();
  }
}

function deleteSideMission(dateKey, missionIndex) {
  const goals = loadGoals();

  if (goals[dateKey] === undefined) {
    return;
  }

  goals[dateKey].sideMissions.splice(missionIndex, 1);
  saveGoals(goals);
  renderApp();
}

function createBackupData() {
  const backupData = {
    onePointAppData: readStorageObject(APP_DATA_KEY, createDefaultAppData())
  };
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme !== null) {
    backupData.appTheme = savedTheme;
  }

  return backupData;
}

function exportAppData() {
  const backupData = createBackupData();
  const backupText = JSON.stringify(backupData, null, 2);
  const file = new Blob([backupText], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = "one-point-day-backup.json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadUrl);
}

function isValidBackupData(backupData) {
  return backupData !== null
    && typeof backupData === "object"
    && !Array.isArray(backupData)
    && backupData.onePointAppData !== null
    && typeof backupData.onePointAppData === "object"
    && !Array.isArray(backupData.onePointAppData);
}

function restoreBackupData(backupData) {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(backupData.onePointAppData));

  if (backupData.appTheme === "light" || backupData.appTheme === "dark") {
    localStorage.setItem(THEME_KEY, backupData.appTheme);
  } else {
    localStorage.removeItem(THEME_KEY);
  }

  appData = loadAppData();
  selectedDate = today;
  historyView = "date";
  applyTheme(loadTheme());
  setActiveTab("today");
  renderApp();
}

function importAppDataFromText(fileText) {
  try {
    const backupData = JSON.parse(fileText);

    if (!isValidBackupData(backupData)) {
      alert("Ten plik nie wygląda jak poprawny backup aplikacji.");
      return;
    }

    restoreBackupData(backupData);
  } catch (error) {
    alert("Nie udało się odczytać pliku JSON.");
  }
}

// Zmiana daty nie zmienia streaka.
// Zmienia tylko dzień, który aktualnie edytujemy i oglądamy w formularzach.
dateInput.addEventListener("change", function() {
  if (dateInput.value === "") {
    dateInput.value = selectedDate;
    return;
  }

  selectedDate = dateInput.value;
  renderApp();
});

lightThemeButton.addEventListener("click", function() {
  applyTheme("light");
});

darkThemeButton.addEventListener("click", function() {
  applyTheme("dark");
});

startEmptyButton.addEventListener("click", function() {
  if (localStorage.getItem(APP_DATA_KEY) === null) {
    startWithAppData(appData, true);
    return;
  }

  enterExistingApp();
});

loadDemoButton.addEventListener("click", function() {
  if (localStorage.getItem(APP_DATA_KEY) !== null) {
    enterExistingApp();
    return;
  }

  localStorage.setItem(ONBOARDING_KEY, "true");
  startWithAppData(createDemoAppData(), false);
});

onboardingSkipButton.addEventListener("click", function() {
  finishOnboarding();
});

onboardingNextButton.addEventListener("click", function() {
  if (onboardingStepIndex === onboardingSteps.length - 1) {
    finishOnboarding();
    return;
  }

  onboardingStepIndex = onboardingStepIndex + 1;
  renderOnboardingStep();
});

exportDataButton.addEventListener("click", function() {
  exportAppData();
});

importDataButton.addEventListener("click", function() {
  const shouldImport = confirm("Import zastąpi obecne dane w tej przeglądarce. Kontynuować?");

  if (!shouldImport) {
    return;
  }

  importDataInput.value = "";
  importDataInput.click();
});

importDataInput.addEventListener("change", function() {
  const selectedFile = importDataInput.files[0];

  if (selectedFile === undefined) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", function() {
    importAppDataFromText(reader.result);
  });

  reader.addEventListener("error", function() {
    alert("Nie udało się wczytać pliku.");
  });

  reader.readAsText(selectedFile);
});

clearLocalDataButton.addEventListener("click", function() {
  const shouldClear = confirm("To usunie dane tej aplikacji z tej przeglądarki. Kontynuować?");

  if (!shouldClear) {
    return;
  }

  localStorage.removeItem(APP_DATA_KEY);
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(WELCOME_KEY);
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(SHOWN_ACHIEVEMENTS_KEY);
  appData = createDefaultAppData();
  selectedDate = today;
  historyView = "date";
  applyTheme("dark");
  localStorage.removeItem(THEME_KEY);
  showStartScreen();
});

userButton.addEventListener("click", function() {
  toggleUserMenu();
});

userMenuBackdrop.addEventListener("click", function() {
  closeUserMenu();
});

document.addEventListener("click", function(event) {
  const clickedInsideUserSwitcher = event.target.closest(".user-switcher") !== null;

  if (!clickedInsideUserSwitcher) {
    closeUserMenu();
  }
});

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    if (!onboardingOverlay.classList.contains("hidden")) {
      finishOnboarding();
      return;
    }

    closeUserMenu();
    userButton.focus();
  }
});

todayTabButton.addEventListener("click", function() {
  setActiveTab("today");
});

statsTabButton.addEventListener("click", function() {
  setActiveTab("stats");
});

historyTabButton.addEventListener("click", function() {
  setActiveTab("history");
});

historyByDateButton.addEventListener("click", function() {
  historyView = "date";
  renderHistory();
});

historyByStatusButton.addEventListener("click", function() {
  historyView = "status";
  renderHistory();
});

// Po kliknięciu "Zapisz" nie przeładowujemy strony.
// Zamiast tego pobieramy tekst z pola i zapisujemy go jako cel dla wybranej daty.
goalForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const text = goalInput.value.trim();

  if (text === "") {
    return;
  }

  setSelectedGoal(text);
});

sideMissionForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const text = sideMissionInput.value.trim();

  if (text === "") {
    return;
  }

  addSideMission(text);
  sideMissionInput.value = "";
});

// Te przyciski zmieniają tylko status celu z wybranej daty.
doneButton.addEventListener("click", function() {
  setSelectedStatus("done");
});

notDoneButton.addEventListener("click", function() {
  setSelectedStatus("not-done");
});

applyTheme(loadTheme());
updateSupabaseModeIndicator();
testSupabaseConnection().catch(function(error) {
  console.warn("Supabase connection test failed:", error);
});

if (hasInitialAppData && hasSeenWelcome) {
  hideStartScreen();
  setActiveTab("today");
  renderApp();
  if (hasSeenOnboarding) {
    showAppRoot();
  } else {
    showOnboarding();
  }
} else {
  showStartScreen();
}
