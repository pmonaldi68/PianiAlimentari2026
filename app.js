const dashboardSection = document.getElementById('dashboardSection');
const plannerSection = document.getElementById('plannerSection');
const shoppingSection = document.getElementById('shoppingSection');

const weekButtons = document.getElementById('weekButtons');
const dayButtons = document.getElementById('dayButtons');
const mealsList = document.getElementById('mealsList');
const patientMeta = document.getElementById('patientMeta');
const dayChip = document.getElementById('dayChip');
const whatsappShare = document.getElementById('whatsappShare');

const profileToggle = document.getElementById('profileToggle');
const profileMenu = document.getElementById('profileMenu');
const profileNameWelcome = document.getElementById('welcomeLine');
const avatarPrimary = document.getElementById('avatarPrimary');
const avatarSecondary = document.getElementById('avatarSecondary');

const dashboardMealTitle = document.getElementById('dashboardMealTitle');
const dashboardMealTime = document.getElementById('dashboardMealTime');
const progressText = document.getElementById('progressText');
const progressValue = document.getElementById('progressValue');
const statDay = document.getElementById('statDay');
const statProfile = document.getElementById('statProfile');

const shoppingList = document.getElementById('shoppingList');
const addShoppingBtn = document.getElementById('addShoppingBtn');
const floatingAdd = document.getElementById('floatingAdd');
const shoppingForm = document.getElementById('shoppingForm');
const shopName = document.getElementById('shopName');
const shopQty = document.getElementById('shopQty');
const shopCategory = document.getElementById('shopCategory');

const themeToggle = document.getElementById('themeToggle');

let plans = [];
let selectedPatientIndex = 0;
let selectedWeek = 1;
let selectedDay = 1;
let shoppingFilter = 'all';

const THEME_KEY = 'piani-theme';
const PROFILE_STATE_KEY = 'piani-profile-state';
const SHOPPING_KEY = 'piani-shopping-state';
const SELECTED_PROFILE_KEY = 'piani-selected-profile';

const WEEKDAY_NAMES = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const PROFILE_COLORS = { 'Paolo Monaldi': '#3b82f6', 'Daniela Franciosi': '#d946ef' };
const MEAL_META = [
  ['colazione', 'Colazione', '🥣'],
  ['spuntino_mattina', 'Spuntino Mattina', '🍏'],
  ['pranzo', 'Pranzo', '🍝'],
  ['spuntino_pomeriggio', 'Spuntino Pomeriggio', '🥜'],
  ['cena', 'Cena', '🍽️']
];

let profileState = {};
let shoppingState = {};

function dayLabel(day) {
  const weekday = WEEKDAY_NAMES[(day - 1) % 7];
  return `Giorno ${day} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`;
}
function foodIcon(name = '') {
  const v = name.toLowerCase();
  if (v.includes('acqua')) return '💧';
  if (v.includes('latte') || v.includes('yogurt') || v.includes('formaggio') || v.includes('parmigiano')) return '🥛';
  if (v.includes('pane') || v.includes('pasta') || v.includes('riso') || v.includes('farro') || v.includes('quinoa') || v.includes('pizza') || v.includes('gnoc')) return '🍞';
  if (v.includes('pollo') || v.includes('tacchino') || v.includes('manzo') || v.includes('maiale') || v.includes('bresaola') || v.includes('prosciutto')) return '🍖';
  if (v.includes('salmone') || v.includes('cernia') || v.includes('polpi') || v.includes('frutti di mare')) return '🐟';
  if (v.includes('mela') || v.includes('arance') || v.includes('pera') || v.includes('kiwi') || v.includes('ananas') || v.includes('mandarini')) return '🍎';
  if (v.includes('insalata') || v.includes('carote') || v.includes('broccoli') || v.includes('zucca') || v.includes('finocchi') || v.includes('pomodori')) return '🥗';
  if (v.includes('olio')) return '🫒';
  return '🍴';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
}
function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return setTheme(stored);
  setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

function loadStates() {
  try { profileState = JSON.parse(localStorage.getItem(PROFILE_STATE_KEY) || '{}'); } catch { profileState = {}; }
  try { shoppingState = JSON.parse(localStorage.getItem(SHOPPING_KEY) || '{}'); } catch { shoppingState = {}; }
}

function saveProfileState() {
  const id = plans[selectedPatientIndex].paziente.nome;
  profileState[id] = { week: selectedWeek, day: selectedDay };
  localStorage.setItem(PROFILE_STATE_KEY, JSON.stringify(profileState));
  localStorage.setItem(SELECTED_PROFILE_KEY, String(selectedPatientIndex));
}

function currentWeekdayAsPlanDay() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function parseQty(q) {
  const m = String(q || '').trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)$/);
  if (!m) return null;
  return { num: Number(m[1].replace(',', '.')), unit: m[2].toLowerCase() };
}
function mergeQty(a, b) {
  const qa = parseQty(a), qb = parseQty(b);
  if (qa && qb && qa.unit === qb.unit) return `${(qa.num + qb.num).toFixed(2).replace('.00', '').replace('.', ',')}${qa.unit}`;
  return [...new Set([a, b].map(String))].join(' + ');
}
function aggregateItems(items) {
  const map = new Map();
  items.forEach((i) => {
    const key = i.nome.trim().toLowerCase();
    if (!map.has(key)) return map.set(key, { ...i, id: crypto.randomUUID(), done: !!i.done });
    const cur = map.get(key);
    cur.quantita = mergeQty(cur.quantita, i.quantita);
    cur.categoria = cur.categoria || i.categoria;
    cur.done = cur.done && !!i.done;
  });
  return [...map.values()];
}

function currentShopKey() {
  const id = plans[selectedPatientIndex]?.paziente?.nome || 'default';
  return `${id}::week${selectedWeek}`;
}

function defaultShoppingItems() {
  const program = plans[selectedPatientIndex].programma.filter((d) => selectedWeek === 1 ? d.giorno <= 7 : d.giorno >= 8);
  const raw = [];
  program.forEach((d) => {
    Object.values(d.pasti).flat().forEach((p) => raw.push({ nome: p.alimento, quantita: p.quantita, categoria: 'Pasto' }));
    Object.entries(d.condimenti || {}).forEach(([k, v]) => raw.push({ nome: k, quantita: v, categoria: 'Condimenti' }));
  });
  return aggregateItems(raw);
}

function ensureShoppingState() {
  const key = currentShopKey();
  if (!shoppingState[key]) {
    shoppingState[key] = defaultShoppingItems();
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
  }
  return shoppingState[key];
}

function renderShoppingList() {
  const items = ensureShoppingState().filter((i) => shoppingFilter === 'all' ? true : shoppingFilter === 'todo' ? !i.done : i.done);
  shoppingList.innerHTML = '';
  if (!items.length) {
    shoppingList.innerHTML = '<div class="small">Nessun elemento con questo filtro.</div>';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = `shop-item ${item.done ? 'done' : ''}`;
    row.innerHTML = `<button class="icon-btn" data-act="toggle">${item.done ? '✓' : '○'}</button><div class="shop-main ${item.done ? 'done' : ''}"><div><strong>${foodIcon(item.nome)} ${item.nome}</strong> · ${item.quantita}</div><div class="small">${item.categoria || 'Generale'}</div></div><div><button class="icon-btn" data-act="edit">✏️</button><button class="icon-btn" data-act="del">🗑️</button></div>`;

    row.querySelector('[data-act="toggle"]').addEventListener('click', () => {
      item.done = !item.done;
      localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
      renderShoppingList();
    });
    row.querySelector('[data-act="edit"]').addEventListener('click', () => {
      const nome = prompt('Nome articolo', item.nome);
      if (!nome) return;
      item.nome = nome;
      item.quantita = prompt('Quantità', item.quantita) || item.quantita;
      const key = currentShopKey();
      shoppingState[key] = aggregateItems(shoppingState[key]);
      localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
      renderShoppingList();
    });
    row.querySelector('[data-act="del"]').addEventListener('click', () => {
      const key = currentShopKey();
      shoppingState[key] = shoppingState[key].filter((x) => x.id !== item.id);
      localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
      renderShoppingList();
    });
    shoppingList.appendChild(row);
  });
}

function addShoppingItem(item) {
  const key = currentShopKey();
  ensureShoppingState();
  shoppingState[key].push({ ...item, id: crypto.randomUUID(), done: false });
  shoppingState[key] = aggregateItems(shoppingState[key]);
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
}

addShoppingBtn.addEventListener('click', () => {
  shoppingForm.classList.toggle('hidden');
});
floatingAdd.addEventListener('click', () => shoppingForm.classList.toggle('hidden'));
shoppingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addShoppingItem({ nome: shopName.value.trim(), quantita: shopQty.value.trim(), categoria: shopCategory.value.trim() || 'Generale' });
  shoppingForm.reset();
  shoppingForm.classList.add('hidden');
  renderShoppingList();
});

document.querySelectorAll('[data-filter]').forEach((btn) => {
  btn.addEventListener('click', () => {
    shoppingFilter = btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderShoppingList();
  });
});

function renderProfileMenu() {
  profileMenu.innerHTML = plans.map((p, i) => `<button class="profile-item ${i === selectedPatientIndex ? 'active' : ''}" data-profile="${i}">${p.paziente.nome}</button>`).join('');
  profileMenu.querySelectorAll('[data-profile]').forEach((btn) => btn.addEventListener('click', () => {
    profileMenu.hidden = true;
    selectPatient(Number(btn.dataset.profile), true, true);
  }));
}
profileToggle.addEventListener('click', () => { profileMenu.hidden = !profileMenu.hidden; });
document.addEventListener('click', (e) => {
  if (!profileMenu.hidden && !profileMenu.contains(e.target) && !profileToggle.contains(e.target)) profileMenu.hidden = true;
});

function renderWeekButtons() {
  weekButtons.innerHTML = [1, 2].map((w) => `<button class="week-btn ${w === selectedWeek ? 'active' : ''}" data-week="${w}">Settimana ${w}</button>`).join('');
  weekButtons.querySelectorAll('[data-week]').forEach((btn) => btn.addEventListener('click', () => selectWeek(Number(btn.dataset.week), true)));
}
function renderDayButtons(program) {
  const days = program.filter((d) => selectedWeek === 1 ? d.giorno <= 7 : d.giorno >= 8);
  dayButtons.innerHTML = days.map((d) => `<button class="day-btn ${d.giorno === selectedDay ? 'active' : ''}" data-day="${d.giorno}"><div class="abbr">${WEEKDAY_NAMES[(d.giorno - 1) % 7]}</div><div class="num">${d.giorno}</div></button>`).join('');
  dayButtons.querySelectorAll('[data-day]').forEach((btn) => btn.addEventListener('click', () => selectDay(Number(btn.dataset.day), true)));
}

function renderDashboard(dayPlan) {
  const profile = plans[selectedPatientIndex].paziente.nome;
  const currentMeal = dayPlan?.pasti?.pranzo?.[0]?.alimento || 'Nessun pasto';
  dashboardMealTitle.textContent = `Pranzo: ${currentMeal}`;
  dashboardMealTime.textContent = dayLabel(selectedDay);

  const done = MEAL_META.filter(([k]) => (dayPlan?.pasti?.[k] || []).length > 0).length;
  progressText.textContent = `${done} / 5 pasti`;
  progressValue.style.width = `${(done / 5) * 100}%`;
  statDay.textContent = dayLabel(selectedDay);
  statProfile.textContent = profile;
}

function shareOnWhatsApp() {
  const profile = plans[selectedPatientIndex];
  const dayPlan = profile.programma.find((d) => d.giorno === selectedDay);
  const lines = [`📅 ${dayLabel(selectedDay)}`, `👤 ${profile.paziente.nome}`];
  MEAL_META.forEach(([k, label, icon]) => {
    lines.push(`\n${icon} ${label}`);
    (dayPlan.pasti[k] || []).forEach((i) => lines.push(`• ${foodIcon(i.alimento)} ${i.alimento} (${i.quantita})`));
  });
  lines.push(`\n🫒 Condimenti`);
  Object.entries(dayPlan.condimenti || {}).forEach(([k, v]) => lines.push(`• ${foodIcon(k)} ${k} (${v})`));
  window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
}
whatsappShare.addEventListener('click', shareOnWhatsApp);

function renderPlanner(dayPlan) {
  mealsList.innerHTML = '';
  MEAL_META.forEach(([key, label, icon]) => {
    const first = dayPlan.pasti[key]?.[0];
    const card = document.createElement('div');
    card.className = 'card meal-card';
    card.innerHTML = `<div class="meal-icon">${icon}</div><div style="flex:1"><div class="meal-top"><div class="meal-label">${label}</div></div><div class="meal-name">${first ? first.alimento : 'Nessun pasto'}</div><div class="meal-meta">${(dayPlan.pasti[key] || []).map((x) => `${foodIcon(x.alimento)} ${x.alimento} (${x.quantita})`).join(' · ') || '-'}</div></div>`;
    mealsList.appendChild(card);
  });

  const condiments = document.createElement('div');
  condiments.className = 'card';
  const list = Object.entries(dayPlan.condimenti || {}).map(([k, v]) => `${foodIcon(k)} ${k} (${v})`).join(' · ');
  condiments.innerHTML = `<strong>🫒 Condimenti</strong><div class="meal-meta" style="margin-top:6px;">${list || '-'}</div>`;
  mealsList.appendChild(condiments);
}

function applyProfileVisuals() {
  const name = plans[selectedPatientIndex].paziente.nome;
  const color = PROFILE_COLORS[name] || '#4cae4f';
  document.documentElement.style.setProperty('--primary', color);
  profileNameWelcome.textContent = `Welcome back, ${name.split(' ')[0]}`;
  avatarPrimary.textContent = name[0];
  const other = plans.find((p, i) => i !== selectedPatientIndex)?.paziente?.nome || 'X';
  avatarSecondary.textContent = other[0];
}

function renderAll() {
  const profile = plans[selectedPatientIndex];
  const dayPlan = profile.programma.find((d) => d.giorno === selectedDay);
  patientMeta.textContent = `${profile.paziente.nome} · ${profile.paziente.medico} · Visita: ${profile.paziente.data_visita}`;
  dayChip.textContent = dayLabel(selectedDay);
  renderWeekButtons();
  renderDayButtons(profile.programma);
  renderDashboard(dayPlan);
  renderPlanner(dayPlan);
  renderShoppingList();
  renderProfileMenu();
  applyProfileVisuals();
}

function selectPatient(index, save = false, forceToday = false) {
  selectedPatientIndex = index;
  const profileId = plans[index].paziente.nome;
  const state = profileState[profileId];
  const today = currentWeekdayAsPlanDay();
  if (forceToday) {
    selectedWeek = 1;
    selectedDay = today;
  } else if (state) {
    selectedWeek = state.week;
    selectedDay = state.day;
  } else {
    selectedWeek = 1;
    selectedDay = today;
  }
  renderAll();
  if (save) saveProfileState();
}

function selectWeek(week, save = false) {
  const dayOfWeek = ((selectedDay - 1) % 7) + 1;
  selectedWeek = week;
  selectedDay = week === 1 ? dayOfWeek : dayOfWeek + 7;
  renderAll();
  if (save) saveProfileState();
}
function selectDay(day, save = false) {
  selectedDay = day;
  selectedWeek = day <= 7 ? 1 : 2;
  renderAll();
  if (save) saveProfileState();
}

function switchTab(tab) {
  dashboardSection.classList.toggle('hidden', tab !== 'dashboard');
  plannerSection.classList.toggle('hidden', tab !== 'planner');
  shoppingSection.classList.toggle('hidden', tab !== 'shopping');
  floatingAdd.classList.toggle('hidden', tab !== 'shopping');
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'settings') {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
    switchTab('dashboard');
  }
}

document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

function init() {
  loadStates();
  const storedProfile = Number(localStorage.getItem(SELECTED_PROFILE_KEY) || 0);
  const safeProfile = Number.isFinite(storedProfile) && storedProfile >= 0 && storedProfile < plans.length ? storedProfile : 0;
  selectPatient(safeProfile, false, true);
  switchTab('dashboard');
}

initTheme();
fetch('data/piani_alimentari.json')
  .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
  .then((payload) => {
    plans = payload.piani_alimentari || [];
    if (!plans.length) throw new Error('Nessun piano alimentare disponibile');
    init();
  })
  .catch((err) => {
    patientMeta.textContent = `Errore caricamento: ${err.message}`;
  });
