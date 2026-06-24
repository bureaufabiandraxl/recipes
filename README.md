# Mariannes Rezept-Schatz

Lokaler MVP einer persönlichen Rezept-Web-App: handschriftliche Rezeptkarten aus Omas Kochbuch, neu interpretiert und modern umgesetzt.

## Starten

```bash
npm install
npm run dev
```

Dann im Browser: [http://localhost:3000](http://localhost:3000)

## Was ist drin?

- **Startseite** – kurzer Intro-Text, Button „Rezeptkarten entdecken“
- **Discover** – Rezeptkarten als Stapel, mit Pfeilen blättern, Klick öffnet Detail
- **Rezept-Detail** – Titel, Story, Bilder, Zutaten mit **Portionsrechner**, Schritte, Tipps, Omas Originalkarte

## Projektstruktur (vereinfacht)

- `src/app/` – Seiten (Home, Discover, Rezept nach Slug)
- `src/components/` – wiederverwendbare Bausteine (Header, Karten, Zutaten, Schritte, …)
- `src/data/recipes.ts` – lokale Rezeptdaten (3 Beispielrezepte)
- `src/types/recipe.ts` – Typdefinitionen für Rezepte
- `public/images/recipes/` – hier später Rezeptbilder ablegen

## Rezepte bearbeiten / hinzufügen

Rezepte liegen in **`src/data/recipes.ts`**. Ein Rezept hat u. a.:

- `slug` (für die URL, z. B. `kaiserschmarrn`)
- `title`, `shortDescription`, `story`
- `ingredients` (name, amount, unit, optional note)
- `steps` (number, instruction)
- `originalCardImage`, `coverImage`, `galleryImages` – Pfade zu Bildern in `public/images/recipes/`

Bilder sind optional: Wenn keine Datei existiert, wird ein Platzhalter angezeigt. Bilder einfach in `public/images/recipes/` ablegen und in den Rezepten den Dateinamen angeben.

**Design-Referenz:** Die Framer-Seite [rezept-schatz.framer.website](https://rezept-schatz.framer.website) zeigt derzeit nur „Coming Soon“. Sobald dort Karten oder Rezeptbilder veröffentlicht sind, kannst du Bilder von dort exportieren und in `public/images/recipes/` ablegen; die Karten in dieser App sind bereits im gleichen Stil (Papier-Optik, Hochformat 3:4) vorbereitet.

## Tech-Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Kein CMS, keine Datenbank, kein Login – alles lokal mit Dateien/JSON.

Viel Freude beim Ausprobieren und Erweitern.
