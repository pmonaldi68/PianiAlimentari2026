const patientSelect = document.getElementById('patientSelect');
const daySelect = document.getElementById('daySelect');
const mealsContainer = document.getElementById('meals');
const patientMeta = document.getElementById('patientMeta');
const errorBox = document.getElementById('error');
const dayChip = document.getElementById('dayChip');
const themeToggle = document.getElementById('themeToggle');

let plans = [];

const THEME_KEY = 'piani-theme';

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  themeToggle.textContent = theme === 'dark' ? '☀️ Modalità giorno' : '🌙 Modalità notte';
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

function renderDay() {
  clearError();
  const patientIndex = Number(patientSelect.value);
  const dayValue = Number(daySelect.value);
  const selected = plans[patientIndex];

  if (!selected) {
    showError('Paziente non trovato.');
    return;
  }

  const dayPlan = selected.programma.find((d) => d.giorno === dayValue);
  if (!dayPlan) {
    showError('Giorno non trovato nel programma.');
    return;
  }

  const { paziente } = selected;
  patientMeta.textContent = `${paziente.nome} · ${paziente.indirizzo} · ${paziente.medico} · Visita: ${paziente.data_visita}`;
  dayChip.textContent = `Giorno ${dayPlan.giorno}`;

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

function fillDays(programma) {
  daySelect.innerHTML = programma
    .map((day) => `<option value="${day.giorno}">Giorno ${day.giorno}</option>`)
    .join('');
}

function initSelectors() {
  patientSelect.innerHTML = plans
    .map((plan, idx) => `<option value="${idx}">${plan.paziente.nome}</option>`)
    .join('');

  fillDays(plans[0].programma);

  patientSelect.addEventListener('change', () => {
    const patientIndex = Number(patientSelect.value);
    fillDays(plans[patientIndex]?.programma || []);
    renderDay();
  });

  daySelect.addEventListener('change', renderDay);
  renderDay();
}

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
    initTheme();
    initSelectors();
  })
  .catch((err) => {
    patientMeta.textContent = 'Impossibile caricare i dati dei piani.';
    showError(err.message);
    initTheme();
  });
