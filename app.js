const goalForm = document.getElementById("goalForm");
const goalInput = document.getElementById("goalInput");
const dateInput = document.getElementById("dateInput");
const lightThemeButton = document.getElementById("lightThemeButton");
const darkThemeButton = document.getElementById("darkThemeButton");
const userButton = document.getElementById("userButton");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userMenu = document.getElementById("userMenu");
const todayTabButton = document.getElementById("todayTabButton");
const statsTabButton = document.getElementById("statsTabButton");
const historyTabButton = document.getElementById("historyTabButton");
const todayTabPanel = document.getElementById("todayTabPanel");
const statsTabPanel = document.getElementById("statsTabPanel");
const historyTabPanel = document.getElementById("historyTabPanel");
const todayDate = document.getElementById("todayDate");
const streakText = document.getElementById("stats-streak");
const recordText = document.getElementById("stats-record");
const effectivenessPanel = document.getElementById("effectivenessPanel");
const activityCalendar = document.getElementById("stats-calendar");
const weeklyChart = document.getElementById("weeklyChart");
const monthlyChart = document.getElementById("monthlyChart");
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

const STORAGE_KEY = "dailyGoals";
const APP_DATA_KEY = "onePointAppData";
const THEME_KEY = "appTheme";
const today = getTodayDateKey();
let appData = loadAppData();
let selectedDate = today;
let historyView = "date";
let activeTab = "today";

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

function getWeekdayName(dateKey) {
  const names = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

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
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(defaultAppData));

  return defaultAppData;
}

function saveAppData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
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
  chart.style.background = `conic-gradient(#22c55e 0% ${percent}%, #ef4444 ${percent}% 100%)`;
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
      userMenu.className = "user-menu";
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
  userMenu.className = "user-menu";
  selectedDate = today;
  renderApp();
}

function closeUserMenu() {
  userMenu.className = "user-menu";
  userButton.setAttribute("aria-expanded", "false");
}

function openUserMenu() {
  userMenu.className = "user-menu open";
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
  const colors = ["#22c55e", "#38bdf8", "#facc15", "#ef4444", "#a78bfa"];

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

function renderStreak() {
  const goals = loadGoals();
  const streak = countStreak(goals);
  const record = countBestStreak(goals);

  streakText.textContent = `🔥 Seria: ${formatNumber(streak)} dni`;
  recordText.textContent = `🏆 Rekord: ${formatNumber(record)} dni`;
}

function renderStatsSection(titleLine, percentLine, stats, sectionId) {
  const section = document.createElement("div");
  const helper = document.createElement("p");

  section.id = sectionId;
  section.className = "effectiveness-section clickable-stat";
  helper.className = "stat-helper";
  helper.textContent = "Kliknij, aby zobaczyć szczegóły";
  section.addEventListener("click", function() {
    goToStatsSection(sectionId);
  });

  if (stats.total === 0) {
    appendEmptyStatsMessage(section);
    section.appendChild(helper);
    return section;
  }

  section.appendChild(createStatsLine(titleLine));
  section.appendChild(createStatsLine(percentLine));
  section.appendChild(helper);

  return section;
}

// Panel skuteczności łączy trzy widoki:
// cel główny, misje poboczne i wspólną skuteczność z obu źródeł.
function renderEffectivenessStats() {
  const goals = loadGoals();
  const mainStats = countMainGoalStats(goals);
  const sideStats = countSideMissionStats(goals);
  const totalStats = {
    done: mainStats.done + sideStats.done,
    total: mainStats.total + sideStats.total
  };

  effectivenessPanel.innerHTML = "";

  effectivenessPanel.appendChild(renderStatsSection(
    `Cel dnia: wykonano ${formatNumber(mainStats.done)} z ${formatNumber(mainStats.total)}`,
    `Skuteczność celu dnia: ${formatPercent(getPercent(mainStats.done, mainStats.total))}`,
    mainStats,
    "stats-main-goal"
  ));

  effectivenessPanel.appendChild(renderStatsSection(
    `Misje poboczne: wykonano ${formatNumber(sideStats.done)} z ${formatNumber(sideStats.total)}`,
    `Skuteczność misji pobocznych: ${formatPercent(getPercent(sideStats.done, sideStats.total))}`,
    sideStats,
    "stats-side-missions"
  ));

  effectivenessPanel.appendChild(renderStatsSection(
    `Łącznie: wykonano ${formatNumber(totalStats.done)} z ${formatNumber(totalStats.total)}`,
    `Ogólna skuteczność: ${formatPercent(getPercent(totalStats.done, totalStats.total))}`,
    totalStats,
    "stats-overall"
  ));

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

  todayDate.textContent = formatDate(selectedDate);
  dateInput.value = selectedDate;

  if (selectedGoal === undefined || selectedGoal.text === "") {
    goalText.textContent = "Nie ma jeszcze celu na ten dzień.";
    goalText.className = "goal-text empty";
    goalStatus.textContent = "";
    goalStatus.className = "status";
    goalInput.value = selectedGoal ? selectedGoal.text : "";
    doneButton.disabled = true;
    notDoneButton.disabled = true;
    doneButton.className = "status-neutral";
    notDoneButton.className = "status-neutral";
    return;
  }

  goalText.textContent = getGoalTextWithIcon(selectedGoal.text, selectedGoal.status);
  goalText.className = `goal-text ${getStatusClass(selectedGoal.status)}`;
  goalStatus.textContent = getStatusText(selectedGoal.status);
  goalStatus.className = `status ${getStatusClass(selectedGoal.status)}`;
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

  if (selectedGoal === undefined || selectedGoal.sideMissions.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Brak misji pobocznych na ten dzień.";
    sideMissionList.appendChild(emptyItem);
    return;
  }

  selectedGoal.sideMissions.forEach(function(mission, index) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    const buttons = document.createElement("div");

    text.textContent = getMissionTextWithIcon(mission);
    text.className = `side-text ${getMissionClass(mission)}`;
    buttons.className = "side-buttons";

    buttons.appendChild(createSmallButton("Zrobiona", `small-button ${getDoneButtonClass(mission.done)}`, function() {
      setSideMissionDone(selectedDate, index, true);
    }));

    buttons.appendChild(createSmallButton("Niezrobiona", `small-button ${getFailedButtonClass(mission.done)}`, function() {
      setSideMissionDone(selectedDate, index, false);
    }));

    buttons.appendChild(createSmallButton("Usuń", "small-button delete-button", function() {
      deleteSideMission(selectedDate, index);
    }));

    item.appendChild(text);
    item.appendChild(buttons);
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
    return "✅ wykonane";
  }

  if (goal.done === false) {
    return "❌ niewykonane";
  }

  return "⏳ brak decyzji";
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
    return "✅ wykonane";
  }

  if (mission.done === false) {
    return "❌ niewykonane";
  }

  return "⏳ brak decyzji";
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

  details.className = "history-details";
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
  const text = document.createElement("span");
  const badge = document.createElement("span");
  const openButton = document.createElement("button");

  item.className = "history-item history-item-readonly";
  wrapper.className = "history-summary";
  summary.className = "history-group-header";
  date.className = "history-date";
  date.textContent = formatDate(dateKey);
  text.className = "history-goal";
  text.textContent = formatNumbersInText(goal.text) || "(brak celu głównego)";
  badge.className = getHistoryBadgeClass(goal);
  badge.textContent = getHistoryBadgeText(goal);
  openButton.type = "button";
  openButton.className = "history-open-button";
  openButton.textContent = "Otwórz";
  openButton.addEventListener("click", function(event) {
    event.preventDefault();
    event.stopPropagation();
    selectHistoryDate(dateKey);
  });

  summary.appendChild(date);
  summary.appendChild(text);
  summary.appendChild(badge);
  summary.appendChild(openButton);
  wrapper.appendChild(summary);
  wrapper.appendChild(createHistoryDetails(dateKey, goal));

  item.appendChild(wrapper);

  return item;
}

function createHistoryStatusEntry(dateKey, goal) {
  const item = document.createElement("li");
  const date = document.createElement("span");
  const text = document.createElement("span");
  const count = document.createElement("span");

  item.className = "history-item history-item-readonly";
  date.className = "history-date";
  date.textContent = formatDate(dateKey);
  text.className = "history-goal";
  text.textContent = formatNumbersInText(goal.text) || "(brak celu głównego)";
  count.className = "history-badge history-badge-empty";
  count.textContent = `${formatNumber(goal.sideMissions.length)} misji`;

  item.appendChild(date);
  item.appendChild(text);
  item.appendChild(count);
  item.addEventListener("click", function() {
    selectHistoryDate(dateKey);
  });

  return item;
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
  list.className = "history-list";

  if (dates.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-item history-item-readonly";
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
  setHistoryToggleState();

  if (dates.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-item history-item-readonly";
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
  renderStreak();
  renderEffectivenessStats();
  renderActivityCalendar();
  renderChartsDashboard();
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

  const wasDone = goals[dateKey].done === true;

  goals[dateKey].status = status;
  goals[dateKey].done = status === "done";

  if (status === "not-done") {
    goals[dateKey].done = false;
  }

  saveGoals(goals);
  renderApp();

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

  const wasDone = mission.done === true;

  mission.done = done;
  saveGoals(goals);
  renderApp();

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

userButton.addEventListener("click", function() {
  toggleUserMenu();
});

document.addEventListener("click", function(event) {
  const clickedInsideUserSwitcher = event.target.closest(".user-switcher") !== null;

  if (!clickedInsideUserSwitcher) {
    closeUserMenu();
  }
});

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closeUserMenu();
    userButton.focus();
  }
});

streakText.addEventListener("click", function() {
  goToStatsSection("stats-calendar");
});

recordText.addEventListener("click", function() {
  goToStatsSection("stats-streak");
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
setActiveTab("today");
renderApp();
