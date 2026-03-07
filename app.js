const patientButtons = document.getElementById('patientButtons');
const weekButtons = document.getElementById('weekButtons');
const dayButtons = document.getElementById('dayButtons');
const mealsContainer = document.getElementById('meals');
const patientMeta = document.getElementById('patientMeta');
const errorBox = document.getElementById('error');
const dayChip = document.getElementById('dayChip');
const themeToggle = document.getElementById('themeToggle');

let plans = [];
let selectedPatientIndex = 0;
let selectedWeek = 1;
let selectedDay = 1;

const THEME_KEY = 'piani-theme';
const WEEKDAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

function dayLabel(dayNumber) {
  const weekday = WEEKDAY_NAMES[(dayNumber - 1) % 7];
  return `Giorno ${dayNumber} - ${weekday}`;
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
  section.innerHTML = `
    <h3>${title}</h3>
    <ul>
      ${items.length ? items.map((i) => `<li>${i.alimento}: <strong>${i.quantita}</strong></li>`).join('') : '<li>Nessun dato disponibile</li>'}
    </ul>
  `;
  return section;
}

function renderPatientButtons() {
  patientButtons.innerHTML = plans
    .map((plan, idx) => `<button type="button" class="btn ${idx === selectedPatientIndex ? 'active' : ''}" data-patient="${idx}">${plan.paziente.nome}</button>`)
    .join('');

  patientButtons.querySelectorAll('[data-patient]').forEach((btn) => {
    btn.addEventListener('click', () => selectPatient(Number(btn.dataset.patient)));
  });
}

function renderWeekButtons() {
  weekButtons.innerHTML = [1, 2]
    .map((week) => `<button type="button" class="btn ${week === selectedWeek ? 'active' : ''}" data-week="${week}">Settimana ${week}</button>`)
    .join('');

  weekButtons.querySelectorAll('[data-week]').forEach((btn) => {
    btn.addEventListener('click', () => selectWeek(Number(btn.dataset.week)));
  });
}

function renderDayButtons(program) {
  const filtered = program.filter((d) => (selectedWeek === 1 ? d.giorno <= 7 : d.giorno >= 8));
  dayButtons.innerHTML = filtered
    .map((day) => `<button type="button" class="btn ${day.giorno === selectedDay ? 'active' : ''}" data-day="${day.giorno}">${dayLabel(day.giorno)}</button>`)
    .join('');

  dayButtons.querySelectorAll('[data-day]').forEach((btn) => {
    btn.addEventListener('click', () => selectDay(Number(btn.dataset.day)));
  });
}

function syncPickers() {
  const program = plans[selectedPatientIndex]?.programma || [];
  renderPatientButtons();
  renderWeekButtons();
  renderDayButtons(program);
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

  const { paziente } = selected;
  patientMeta.textContent = `${paziente.nome} · ${paziente.indirizzo} · ${paziente.medico} · Visita: ${paziente.data_visita}`;
  dayChip.textContent = dayLabel(dayPlan.giorno);

  mealsContainer.innerHTML = '';
  const sections = [
    ['colazione', 'Colazione'],
    ['spuntino_mattina', 'Spuntino mattina'],
    ['pranzo', 'Pranzo'],
    ['spuntino_pomeriggio', 'Spuntino pomeriggio'],
    ['cena', 'Cena']
  ];

  sections.forEach(([key, label]) => {
    mealsContainer.appendChild(mealSection(label, dayPlan.pasti[key] || []));
  });

  const condimentiItems = Object.entries(dayPlan.condimenti || {}).map(([alimento, quantita]) => ({ alimento, quantita }));
  mealsContainer.appendChild(mealSection('Condimenti', condimentiItems, 'condimenti'));
}

function selectPatient(index) {
  const program = plans[index]?.programma;
  if (!program || program.length === 0) {
    showError('Programma paziente non disponibile.');
    return;
  }

  selectedPatientIndex = index;
  selectedWeek = 1;
  selectedDay = 1;
  syncPickers();
  renderDay();
}

function selectWeek(week) {
  selectedWeek = week;
  selectedDay = week === 1 ? 1 : 8;
  syncPickers();
  renderDay();
}

function selectDay(day) {
  selectedDay = day;
  selectedWeek = day <= 7 ? 1 : 2;
  syncPickers();
  renderDay();
}

function initUI() {
  syncPickers();
  renderDay();
}

initTheme();

fetch('data/piani_alimentari.json')
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Errore HTTP ${res.status}`);
    }
    return res.json();
  })
  .then((payload) => {
    plans = payload.piani_alimentari;
    if (!Array.isArray(plans) || plans.length === 0) {
      throw new Error('Nessun piano alimentare disponibile.');
    }
    initUI();
  })
  .catch((err) => {
    patientMeta.textContent = 'Impossibile caricare i dati dei piani.';
    showError(err.message);
  });
