# Artefekt — strona studia projektowania wnętrz

## Uruchomienie
```
npm install
cp env.example .env   # uzupełnij OPENROUTER_API_KEY
npm start             # server.js, produkcja
npm run preview       # preview/server.js
```

## Struktura
- `index.html`, `index.css`, `index.js` — strona główna
- `chat.js`, `server.js` — backend chatbota (OpenRouter)
- `assets/` — obrazy i logotypy
- `preview/` — lekki serwer podglądu
- `scripts/organize_assets.js` — porządkuje luźne pliki graficzne do `assets/`
- `docs/` — prompty projektowe i materiały źródłowe (audyt, eksport z FB/IG/WP)
