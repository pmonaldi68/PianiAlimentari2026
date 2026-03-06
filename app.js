const patientSelect = document.getElementById('patientSelect');
const daySelect = document.getElementById('daySelect');
const mealsContainer = document.getElementById('meals');
const patientMeta = document.getElementById('patientMeta');
const errorBox = document.getElementById('error');
const dayChip = document.getElementById('dayChip');
const themeToggle = document.getElementById('themeToggle');
const quickPatients = document.getElementById('quickPatients');
const mobilePatients = document.getElementById('mobilePatients');
const mobileDays = document.getElementById('mobileDays');

let plans = [];
let selectedPatientIndex = 0;
let selectedDay = 1;

const THEME_KEY = 'piani-theme';

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

function renderQuickPatients() {
  quickPatients.innerHTML = plans
    .map((plan, idx) => `<button type="button" class="pill ${idx === selectedPatientIndex ? 'active' : ''}" data-patient="${idx}">${plan.paziente.nome}</button>`)
    .join('');

  quickPatients.querySelectorAll('[data-patient]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectPatient(Number(btn.dataset.patient));
    });
  });
}

function renderMobilePatients() {
  mobilePatients.innerHTML = plans
    .map((plan, idx) => `<button type="button" class="mobile-btn ${idx === selectedPatientIndex ? 'active' : ''}" data-mobile-patient="${idx}">${plan.paziente.nome}</button>`)
    .join('');

  mobilePatients.querySelectorAll('[data-mobile-patient]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectPatient(Number(btn.dataset.mobilePatient));
    });
  });
}

function renderMobileDays(programma) {
  mobileDays.innerHTML = programma
    .map((day) => `<button type="button" class="mobile-btn ${day.giorno === selectedDay ? 'active' : ''}" data-mobile-day="${day.giorno}">Giorno ${day.giorno}</button>`)
    .join('');

  mobileDays.querySelectorAll('[data-mobile-day]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectDay(Number(btn.dataset.mobileDay));
    });
  });
}

function fillDays(programma) {
  daySelect.innerHTML = programma
    .map((day) => `<option value="${day.giorno}">Giorno ${day.giorno}</option>`)
    .join('');
}

function syncControls(programma) {
  patientSelect.value = String(selectedPatientIndex);
  fillDays(programma);
  daySelect.value = String(selectedDay);
  renderQuickPatients();
  renderMobilePatients();
  renderMobileDays(programma);
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

function selectPatient(index) {
  const program = plans[index]?.programma;
  if (!program || program.length === 0) {
    showError('Programma paziente non disponibile.');
    return;
  }

  selectedPatientIndex = index;
  selectedDay = program[0].giorno;
  syncControls(program);
  renderDay();
}

function selectDay(day) {
  selectedDay = day;
  const program = plans[selectedPatientIndex]?.programma || [];
  syncControls(program);
  renderDay();
}

function initControls() {
  patientSelect.innerHTML = plans
    .map((plan, idx) => `<option value="${idx}">${plan.paziente.nome}</option>`)
    .join('');

  const initialProgram = plans[selectedPatientIndex].programma;
  selectedDay = initialProgram[0].giorno;
  syncControls(initialProgram);

  patientSelect.addEventListener('change', () => {
    selectPatient(Number(patientSelect.value));
  });

  daySelect.addEventListener('change', () => {
    selectDay(Number(daySelect.value));
  });

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
    initControls();
  })
  .catch((err) => {
    patientMeta.textContent = 'Impossibile caricare i dati dei piani.';
    showError(err.message);
  });
