const weekButtons = document.getElementById('weekButtons');
const dayButtons = document.getElementById('dayButtons');
const mealsContainer = document.getElementById('meals');
const patientMeta = document.getElementById('patientMeta');
const errorBox = document.getElementById('error');
const dayChip = document.getElementById('dayChip');
const themeToggle = document.getElementById('themeToggle');
const profileToggle = document.getElementById('profileToggle');
const profileName = document.getElementById('profileName');
const profileMenu = document.getElementById('profileMenu');
const shoppingList = document.getElementById('shoppingList');
const addShoppingBtn = document.getElementById('addShoppingBtn');
const shoppingForm = document.getElementById('shoppingForm');
const shopName = document.getElementById('shopName');
const shopQty = document.getElementById('shopQty');
const shopCategory = document.getElementById('shopCategory');

let plans = [];
let selectedPatientIndex = 0;
let selectedWeek = 1;
let selectedDay = 1;

const THEME_KEY = 'piani-theme';
const PROFILE_STATE_KEY = 'piani-profile-state';
const SHOPPING_KEY = 'piani-shopping-state';
const WEEKDAY_NAMES = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const PROFILE_COLORS = { 'Paolo Monaldi': '#3b82f6', 'Daniela Franciosi': '#d946ef' };

let profileState = {};
let shoppingState = {};

function dayLabel(dayNumber) {
  const weekday = WEEKDAY_NAMES[(dayNumber - 1) % 7];
  return `Giorno ${dayNumber} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`;
}

function setProfileColor() {
  const name = plans[selectedPatientIndex]?.paziente?.nome;
  const color = PROFILE_COLORS[name] || '#3b82f6';
  document.documentElement.style.setProperty('--primary', color);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️ Modalità giorno' : '🌙 Modalità notte';
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    setTheme(storedTheme);
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function mealSection(title, items, extraClass = '') {
  const section = document.createElement('section');
  section.className = `meal ${extraClass}`.trim();
  section.innerHTML = `<h3>${title}</h3><ul>${items.length ? items.map((i) => `<li>${i.alimento}: <strong>${i.quantita}</strong></li>`).join('') : '<li>Nessun dato disponibile</li>'}</ul>`;
  return section;
}

function loadStates() {
  try { profileState = JSON.parse(localStorage.getItem(PROFILE_STATE_KEY) || '{}'); } catch { profileState = {}; }
  try { shoppingState = JSON.parse(localStorage.getItem(SHOPPING_KEY) || '{}'); } catch { shoppingState = {}; }
}

function saveProfileState() {
  const profileId = plans[selectedPatientIndex].paziente.nome;
  profileState[profileId] = { week: selectedWeek, day: selectedDay };
  localStorage.setItem(PROFILE_STATE_KEY, JSON.stringify(profileState));
}

function currentShopKey() {
  const profileId = plans[selectedPatientIndex]?.paziente?.nome || 'default';
  return `${profileId}::week${selectedWeek}`;
}

function defaultShoppingItems() {
  const program = plans[selectedPatientIndex].programma.filter((d) => (selectedWeek === 1 ? d.giorno <= 7 : d.giorno >= 8));
  const items = [];
  program.forEach((d) => {
    Object.values(d.pasti).flat().forEach((p) => items.push({ id: crypto.randomUUID(), nome: p.alimento, quantita: p.quantita, categoria: 'Pasto', done: false }));
    Object.entries(d.condimenti || {}).forEach(([k, v]) => items.push({ id: crypto.randomUUID(), nome: k, quantita: v, categoria: 'Condimenti', done: false }));
  });
  return items.slice(0, 18);
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
  const items = ensureShoppingState();
  shoppingList.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = `shop-item ${item.done ? 'done' : ''}`;

    const check = document.createElement('button');
    check.className = 'small-btn';
    check.textContent = item.done ? '✓' : '○';
    check.addEventListener('click', () => {
      item.done = !item.done;
      localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
      renderShoppingList();
    });

    const main = document.createElement('div');
    main.className = `shop-main ${item.done ? 'done-text' : ''}`;
    main.innerHTML = `<div><strong>${item.nome}</strong> · ${item.quantita}</div><small style="color:var(--muted)">${item.categoria || 'Generale'}</small>`;

    const actions = document.createElement('div');
    actions.className = 'shop-actions';

    const edit = document.createElement('button');
    edit.className = 'small-btn';
    edit.textContent = '✏️';
    edit.addEventListener('click', () => {
      const nome = prompt('Nome articolo', item.nome);
      if (!nome) return;
      const quantita = prompt('Quantità', item.quantita) || item.quantita;
      item.nome = nome;
      item.quantita = quantita;
      localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
      renderShoppingList();
    });

    const del = document.createElement('button');
    del.className = 'small-btn';
    del.textContent = '🗑️';
    del.addEventListener('click', () => {
      const key = currentShopKey();
      shoppingState[key] = shoppingState[key].filter((x) => x.id !== item.id);
      localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
      renderShoppingList();
    });

    actions.append(edit, del);
    row.append(check, main, actions);
    shoppingList.appendChild(row);
  });
}

addShoppingBtn.addEventListener('click', () => {
  shoppingForm.hidden = !shoppingForm.hidden;
});

shoppingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const key = currentShopKey();
  ensureShoppingState();
  shoppingState[key].unshift({
    id: crypto.randomUUID(),
    nome: shopName.value.trim(),
    quantita: shopQty.value.trim(),
    categoria: shopCategory.value.trim() || 'Generale',
    done: false
  });
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
  shoppingForm.reset();
  shoppingForm.hidden = true;
  renderShoppingList();
});

function renderProfileMenu() {
  profileMenu.innerHTML = plans
    .map((plan, idx) => `<button type="button" class="profile-item ${idx === selectedPatientIndex ? 'active' : ''}" data-profile="${idx}">${plan.paziente.nome}</button>`)
    .join('');

  profileMenu.querySelectorAll('[data-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      profileMenu.hidden = true;
      selectPatient(Number(btn.dataset.profile), true);
    });
  });
}

profileToggle.addEventListener('click', () => {
  profileMenu.hidden = !profileMenu.hidden;
});
document.addEventListener('click', (e) => {
  if (!profileMenu.hidden && !profileMenu.contains(e.target) && !profileToggle.contains(e.target)) {
    profileMenu.hidden = true;
  }
});

function renderWeekButtons() {
  weekButtons.innerHTML = [1, 2].map((week) => `<button type="button" class="btn ${week === selectedWeek ? 'active' : ''}" data-week="${week}">Settimana ${week}</button>`).join('');
  weekButtons.querySelectorAll('[data-week]').forEach((btn) => btn.addEventListener('click', () => selectWeek(Number(btn.dataset.week), true)));
}

function renderDayButtons(program) {
  const filtered = program.filter((d) => (selectedWeek === 1 ? d.giorno <= 7 : d.giorno >= 8));
  dayButtons.innerHTML = filtered
    .map((day) => {
      const abbr = WEEKDAY_NAMES[(day.giorno - 1) % 7];
      return `<button type="button" class="day-btn ${day.giorno === selectedDay ? 'active' : ''}" data-day="${day.giorno}"><span class="abbr">${abbr}</span><span class="num">${day.giorno}</span></button>`;
    })
    .join('');

  dayButtons.querySelectorAll('[data-day]').forEach((btn) => btn.addEventListener('click', () => selectDay(Number(btn.dataset.day), true)));
}

function syncPickers() {
  const program = plans[selectedPatientIndex]?.programma || [];
  profileName.textContent = plans[selectedPatientIndex]?.paziente?.nome || 'Profilo';
  renderProfileMenu();
  renderWeekButtons();
  renderDayButtons(program);
  setProfileColor();
}

function renderDay() {
  clearError();
  const selected = plans[selectedPatientIndex];
  if (!selected) {
    showError('Paziente non trovato.');
    return;
  }

  const dayPlan = selected.programma.find((d) => d.giorno === selectedDay);
  if (!dayPlan) {
    showError('Giorno non trovato nel programma.');
    return;
  }

  patientMeta.textContent = `${selected.paziente.nome} · ${selected.paziente.indirizzo} · ${selected.paziente.medico} · Visita: ${selected.paziente.data_visita}`;
  dayChip.textContent = dayLabel(dayPlan.giorno);

  mealsContainer.innerHTML = '';
  [['colazione', 'Colazione'], ['spuntino_mattina', 'Spuntino mattina'], ['pranzo', 'Pranzo'], ['spuntino_pomeriggio', 'Spuntino pomeriggio'], ['cena', 'Cena']].forEach(([key, label]) => {
    mealsContainer.appendChild(mealSection(label, dayPlan.pasti[key] || []));
  });

  const condimentiItems = Object.entries(dayPlan.condimenti || {}).map(([alimento, quantita]) => ({ alimento, quantita }));
  mealsContainer.appendChild(mealSection('Condimenti', condimentiItems, 'condimenti'));
  renderShoppingList();
}

function currentWeekdayAsPlanDay(week = 1) {
  const jsDay = new Date().getDay();
  const mondayBased = jsDay === 0 ? 7 : jsDay;
  return week === 1 ? mondayBased : mondayBased + 7;
}

function selectPatient(index, save = false) {
  selectedPatientIndex = index;
  const profileId = plans[selectedPatientIndex].paziente.nome;
  const state = profileState[profileId];
  if (state) {
    selectedWeek = state.week;
    selectedDay = state.day;
  } else {
    selectedWeek = currentWeekdayAsPlanDay() <= 7 ? 1 : 2;
    selectedDay = currentWeekdayAsPlanDay(selectedWeek);
  }

  syncPickers();
  renderDay();
  if (save) saveProfileState();
}

function selectWeek(week, save = false) {
  const dayOfWeek = ((selectedDay - 1) % 7) + 1;
  selectedWeek = week;
  selectedDay = week === 1 ? dayOfWeek : dayOfWeek + 7;
  syncPickers();
  renderDay();
  if (save) saveProfileState();
}

function selectDay(day, save = false) {
  selectedDay = day;
  selectedWeek = day <= 7 ? 1 : 2;
  syncPickers();
  renderDay();
  if (save) saveProfileState();
}

function initUI() {
  loadStates();
  const initialDay = currentWeekdayAsPlanDay(1);
  selectedWeek = 1;
  selectedDay = initialDay;
  selectPatient(0, false);
}

initTheme();

fetch('data/piani_alimentari.json')
  .then((res) => {
    if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);
    return res.json();
  })
  .then((payload) => {
    plans = payload.piani_alimentari;
    if (!Array.isArray(plans) || plans.length === 0) throw new Error('Nessun piano alimentare disponibile.');
    initUI();
  })
  .catch((err) => {
    patientMeta.textContent = 'Impossibile caricare i dati dei piani.';
    showError(err.message);
  });
