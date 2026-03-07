# PianiAlimentari2026

Web app per consultare i piani alimentari 2026 in modo semplice, moderno e leggibile.

## Avvio locale

Dal root del progetto:

```bash
python3 -m http.server 8000
```

Poi apri `http://localhost:8000`.

## Funzionalità UI

- Selettore profilo rapido in alto a destra (Paolo / Daniela) con menù popup.
- Colori dinamici per profilo: Paolo in tema azzurro, Daniela in tema rosa/magenta.
- Modalità notte/giorno con toggle manuale e persistenza su `localStorage`.
- Selezione settimana e giorni con pulsanti compatti.
- Pulsanti giorno quadrati: abbreviazione sopra (`lun`) e numero grande sotto (`1`).
- Etichetta completa giorno nel formato `Giorno X - NomeGiorno`.
- Stato indipendente per ogni profilo (settimana/giorno).

## Lista della spesa

- Sezione separata richiamabile dal pulsante `🛒 Lista Spesa` nell'header.
- Deduplica automatica degli alimenti uguali (unione dei doppioni).
- Aggiunta articolo manuale (`+ Aggiungi`) con nome, quantità e categoria.
- Modifica rapida articolo (✏️), eliminazione (🗑️), stato acquistato (✓/○).
- Persistenza locale separata per profilo e settimana.

## Dati

- `data/piani_alimentari.json`: contiene 2 piani alimentari completi (14 giorni ciascuno) con paziente, pasti giornalieri e condimenti.
- `index.html` + `app.js`: interfaccia web che legge il JSON e mostra pasti e condimenti per paziente/giorno.
