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
- Navigazione totalmente a pulsanti (niente caselle a discesa) per paziente, settimana e giorno.
- Etichette giorni complete nel formato: `Giorno X - NomeGiorno` (es. `Giorno 1 - Lunedì`).
- Modalità notte/giorno con toggle manuale, preferenza sistema e salvataggio su `localStorage`.

## Dati

- `data/piani_alimentari.json`: contiene 2 piani alimentari completi (14 giorni ciascuno) con paziente, pasti giornalieri e condimenti.
- `index.html` + `app.js`: interfaccia web che legge il JSON e mostra pasti e condimenti per paziente/giorno.
