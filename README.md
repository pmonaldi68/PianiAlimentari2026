# PianiAlimentari2026

Web app per consultare i piani alimentari 2026 in modo semplice, moderno e leggibile.

## Avvio locale

Dal root del progetto:

```bash
python3 -m http.server 8000
```

Poi apri `http://localhost:8000`.

## Funzionalità UI

- Interfaccia responsive (desktop, tablet, mobile).
- Su telefono usa pulsanti (non select a discesa) per scegliere paziente e giorno.
- Cambio rapido paziente tramite pulsanti "pill" sempre visibili.
- Modalità notte/giorno con toggle manuale, preferenza sistema e salvataggio su `localStorage`.

## Dati

- `data/piani_alimentari.json`: contiene 2 piani alimentari completi (14 giorni ciascuno) con paziente, pasti giornalieri e condimenti.
- `index.html` + `app.js`: interfaccia web che legge il JSON e mostra pasti e condimenti per paziente/giorno.
