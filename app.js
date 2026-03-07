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
const shoppingToggle = document.getElementById('shoppingToggle');
const shoppingSection = document.getElementById('shoppingSection');
const whatsappShare = document.getElementById('whatsappShare');
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
const MEAL_ICONS = {
  colazione: '🥣',
  spuntino_mattina: '🍏',
  pranzo: '🍝',
  spuntino_pomeriggio: '🥜',
  cena: '🍽️',
  condimenti: '🫒'
};

let profileState = {};
let shoppingState = {};

function dayLabel(dayNumber) {
  const weekday = WEEKDAY_NAMES[(dayNumber - 1) % 7];
  return `Giorno ${dayNumber} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`;
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

function getCurrentDayPlan() {
  const selected = plans[selectedPatientIndex];
  if (!selected) return null;
  return selected.programma.find((d) => d.giorno === selectedDay) || null;
}

function shareOnWhatsApp() {
  const selected = plans[selectedPatientIndex];
  const dayPlan = getCurrentDayPlan();
  if (!selected || !dayPlan) return;

  const lines = [];
  lines.push(`📅 ${dayLabel(dayPlan.giorno)}`);
  lines.push(`👤 ${selected.paziente.nome}`);

  const sections = [
    ['colazione', 'Colazione'],
    ['spuntino_mattina', 'Spuntino mattina'],
    ['pranzo', 'Pranzo'],
    ['spuntino_pomeriggio', 'Spuntino pomeriggio'],
    ['cena', 'Cena']
  ];

  sections.forEach(([key, label]) => {
    lines.push(`\n${MEAL_ICONS[key]} ${label}`);
    (dayPlan.pasti[key] || []).forEach((i) => lines.push(`• ${foodIcon(i.alimento)} ${i.alimento} (${i.quantita})`));
  });

  const condimenti = Object.entries(dayPlan.condimenti || {});
  if (condimenti.length) {
    lines.push(`\n${MEAL_ICONS.condimenti} Condimenti`);
    condimenti.forEach(([k, v]) => lines.push(`• ${foodIcon(k)} ${k} (${v})`));
  }

  const msg = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function setProfileColor() {
  const name = plans[selectedPatientIndex]?.paziente?.nome;
  document.documentElement.style.setProperty('--primary', PROFILE_COLORS[name] || '#3b82f6');
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️ Modalità giorno' : '🌙 Modalità notte';
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

shoppingToggle.addEventListener('click', () => {
  shoppingSection.hidden = !shoppingSection.hidden;
  shoppingToggle.textContent = shoppingSection.hidden ? '🛒 Lista Spesa' : '🛒 Chiudi Spesa';
  if (!shoppingSection.hidden) renderShoppingList();
});
whatsappShare.addEventListener('click', shareOnWhatsApp);

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function parseQty(qty) {
  const m = String(qty || '').trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)$/);
  if (!m) return null;
  return { num: Number(m[1].replace(',', '.')), unit: m[2].toLowerCase() };
}

function mergeQty(a, b) {
  const qa = parseQty(a);
  const qb = parseQty(b);
  if (qa && qb && qa.unit === qb.unit) return `${(qa.num + qb.num).toFixed(2).replace('.00', '').replace('.', ',')}${qa.unit}`;
  const parts = [...new Set([a, b].map((x) => String(x).trim()).filter(Boolean))];
  return parts.join(' + ');
}

function aggregateItems(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = `${item.nome}`.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, { ...item, id: crypto.randomUUID(), done: item.done || false });
      return;
    }
    const current = map.get(key);
    current.quantita = mergeQty(current.quantita, item.quantita);
    current.categoria = current.categoria || item.categoria;
    current.done = current.done && item.done;
  });
  return [...map.values()];
}

function mealSection(key, title, items, extraClass = '') {
  const section = document.createElement('section');
  section.className = `meal ${extraClass}`.trim();
  section.innerHTML = `<h3><span class="meal-emoji">${MEAL_ICONS[key] || '🍽️'}</span> ${title}</h3><ul>${items.length ? items.map((i) => `<li>${foodIcon(i.alimento)} ${i.alimento}: <strong>${i.quantita}</strong></li>`).join('') : '<li>Nessun dato disponibile</li>'}</ul>`;
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
  const items = ensureShoppingState();
  shoppingList.innerHTML = '';
  if (!items.length) shoppingList.innerHTML = '<small style="color:var(--muted)">Nessun articolo in lista.</small>';

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
    main.innerHTML = `<div><strong>${foodIcon(item.nome)} ${item.nome}</strong> · ${item.quantita}</div><small style="color:var(--muted)">${item.categoria || 'Generale'}</small>`;

    const actions = document.createElement('div');
    actions.className = 'shop-actions';
    const edit = document.createElement('button');
    edit.className = 'small-btn';
    edit.textContent = '✏️';
    edit.addEventListener('click', () => {
      const nome = prompt('Nome articolo', item.nome);
      if (!nome) return;
      item.nome = nome;
      item.quantita = prompt('Quantità', item.quantita) || item.quantita;
      const key = currentShopKey();
      shoppingState[key] = aggregateItems(shoppingState[key]);
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

function upsertShoppingItem(newItem) {
  const key = currentShopKey();
  ensureShoppingState();
  shoppingState[key].push({ ...newItem, id: crypto.randomUUID(), done: false });
  shoppingState[key] = aggregateItems(shoppingState[key]);
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingState));
}

addShoppingBtn.addEventListener('click', () => {
  shoppingForm.hidden = !shoppingForm.hidden;
});

shoppingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  upsertShoppingItem({ nome: shopName.value.trim(), quantita: shopQty.value.trim(), categoria: shopCategory.value.trim() || 'Generale' });
  shoppingForm.reset();
  shoppingForm.hidden = true;
  renderShoppingList();
});

function renderProfileMenu() {
  profileMenu.innerHTML = plans.map((plan, idx) => `<button type="button" class="profile-item ${idx === selectedPatientIndex ? 'active' : ''}" data-profile="${idx}">${plan.paziente.nome}</button>`).join('');
  profileMenu.querySelectorAll('[data-profile]').forEach((btn) => btn.addEventListener('click', () => {
    profileMenu.hidden = true;
    selectPatient(Number(btn.dataset.profile), true);
  }));
}

profileToggle.addEventListener('click', () => {
  profileMenu.hidden = !profileMenu.hidden;
});
document.addEventListener('click', (e) => {
  if (!profileMenu.hidden && !profileMenu.contains(e.target) && !profileToggle.contains(e.target)) profileMenu.hidden = true;
});

function renderWeekButtons() {
  weekButtons.innerHTML = [1, 2].map((week) => `<button type="button" class="btn ${week === selectedWeek ? 'active' : ''}" data-week="${week}">Settimana ${week}</button>`).join('');
  weekButtons.querySelectorAll('[data-week]').forEach((btn) => btn.addEventListener('click', () => selectWeek(Number(btn.dataset.week), true)));
}

function renderDayButtons(program) {
  const filtered = program.filter((d) => (selectedWeek === 1 ? d.giorno <= 7 : d.giorno >= 8));
  dayButtons.innerHTML = filtered.map((day) => {
    const abbr = WEEKDAY_NAMES[(day.giorno - 1) % 7];
    return `<button type="button" class="day-btn ${day.giorno === selectedDay ? 'active' : ''}" data-day="${day.giorno}"><span class="abbr">${abbr}</span><span class="num">${day.giorno}</span></button>`;
  }).join('');
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
  if (!selected) return showError('Paziente non trovato.');

  const dayPlan = selected.programma.find((d) => d.giorno === selectedDay);
  if (!dayPlan) return showError('Giorno non trovato nel programma.');

  patientMeta.textContent = `${selected.paziente.nome} · ${selected.paziente.indirizzo} · ${selected.paziente.medico} · Visita: ${selected.paziente.data_visita}`;
  dayChip.textContent = dayLabel(dayPlan.giorno);

  mealsContainer.innerHTML = '';
  [
    ['colazione', 'Colazione'],
    ['spuntino_mattina', 'Spuntino mattina'],
    ['pranzo', 'Pranzo'],
    ['spuntino_pomeriggio', 'Spuntino pomeriggio'],
    ['cena', 'Cena']
  ].forEach(([key, label]) => mealsContainer.appendChild(mealSection(key, label, dayPlan.pasti[key] || [])));

  const condiments = Object.entries(dayPlan.condimenti || {}).map(([alimento, quantita]) => ({ alimento, quantita }));
  mealsContainer.appendChild(mealSection('condimenti', 'Condimenti', condiments, 'condimenti'));
  if (!shoppingSection.hidden) renderShoppingList();
}

function currentWeekdayAsPlanDay(week = 1) {
  const jsDay = new Date().getDay();
  const mondayBased = jsDay === 0 ? 7 : jsDay;
  return week === 1 ? mondayBased : mondayBased + 7;
}

function selectPatient(index, save = false, forceToday = false) {
  selectedPatientIndex = index;
  const profileId = plans[selectedPatientIndex].paziente.nome;
  const state = profileState[profileId];
  const today = currentWeekdayAsPlanDay(1);

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
  selectedWeek = 1;
  selectedDay = currentWeekdayAsPlanDay(1);
  selectPatient(0, false, true);
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
