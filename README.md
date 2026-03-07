# PianiAlimentari2026

Web app mobile-first per consultare i piani alimentari 2026 e gestire la spesa.

## Avvio locale

```bash
python3 -m http.server 8000
```

Apri `http://localhost:8000`.

## Sezioni app

- **Dashboard**: riepilogo del giorno con meal card, progress e quick stats.
- **Plan**: selettore settimana/giorno 14 giorni con card pasti e condimenti.
- **Shopping**: lista spesa deduplicata con filtri, aggiunta, modifica, rimozione e stato acquisto.

## Funzionalità

- Cambio profilo rapido (Paolo/Daniela) con tema colore dinamico.
- Avvio sempre sul giorno corrente della settimana (data odierna).
- Quando selezioni un giorno, l'app apre direttamente la sezione pasti (Piano).
- Tema chiaro/scuro con persistenza locale.
- Condivisione WhatsApp del giorno con icone cibo.
- Persistenza locale separata per profilo/settimana (`localStorage`).

## Dati

- `data/piani_alimentari.json`: 2 piani completi da 14 giorni.
- `index.html` + `app.js`: UI + logica client-side.
