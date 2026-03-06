# PianiAlimentari2026

Web app semplice per consultare i piani alimentari 2026.

## Avvio locale

Dal root del progetto:

```bash
python3 -m http.server 8000
```

Poi apri `http://localhost:8000`.

## Dati

- `data/piani_alimentari.json`: contiene 2 piani alimentari completi (14 giorni ciascuno) con paziente, pasti giornalieri e condimenti.
- `index.html` + `app.js`: interfaccia web che legge il JSON e mostra pasti e condimenti per paziente/giorno.
