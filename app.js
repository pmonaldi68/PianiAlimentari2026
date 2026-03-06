const patientSelect = document.getElementById('patientSelect');
const daySelect = document.getElementById('daySelect');
const mealsContainer = document.getElementById('meals');
const patientMeta = document.getElementById('patientMeta');
const errorBox = document.getElementById('error');

let plans = [];

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
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

  mealsContainer.innerHTML = '';
  const sections = [
    ['colazione', 'Colazione'],
    ['spuntino_mattina', 'Spuntino mattina'],
    ['pranzo', 'Pranzo'],
    ['spuntino_pomeriggio', 'Spuntino pomeriggio'],
    ['cena', 'Cena']
  ];

  sections.forEach(([key, label]) => {
    const box = document.createElement('section');
    box.className = 'meal';
    const items = dayPlan.pasti[key] || [];
    box.innerHTML = `<h3>${label}</h3><ul>${items.map((i) => `<li>${i.alimento}: ${i.quantita}</li>`).join('')}</ul>`;
    mealsContainer.appendChild(box);
  });

  const condimenti = document.createElement('section');
  condimenti.className = 'meal';
  const condimentiList = Object.entries(dayPlan.condimenti || {})
    .map(([k, v]) => `<li>${k}: ${v}</li>`)
    .join('');
  condimenti.innerHTML = `<h3>Condimenti</h3><ul>${condimentiList}</ul>`;
  mealsContainer.appendChild(condimenti);
}

function initSelectors() {
  patientSelect.innerHTML = plans
    .map((plan, idx) => `<option value="${idx}">${plan.paziente.nome}</option>`)
    .join('');

  daySelect.innerHTML = plans[0].programma
    .map((day) => `<option value="${day.giorno}">Giorno ${day.giorno}</option>`)
    .join('');

  patientSelect.addEventListener('change', () => {
    const patientIndex = Number(patientSelect.value);
    const program = plans[patientIndex]?.programma || [];
    daySelect.innerHTML = program
      .map((day) => `<option value="${day.giorno}">Giorno ${day.giorno}</option>`)
      .join('');
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
    initSelectors();
  })
  .catch((err) => {
    patientMeta.textContent = 'Impossibile caricare i dati dei piani.';
    showError(err.message);
  });
