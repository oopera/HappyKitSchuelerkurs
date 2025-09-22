# HappyKit Schülerkurs – Grundlagen der Webentwicklung

Willkommen! In diesem Projekt bekommen Schüler:innen einen praktischen Einstieg in die Webentwicklung: HTML für Struktur, CSS für Design und JavaScript für Interaktivität. Außerdem klären wir kurz, was Browser und Server tun. Zum Schluss sprechen wir über 3D-Programmierung und den Unterschied zwischen physikbasierten und nicht-physikbasierten Ansätzen.

## Lernziele

- Verstehen, wie HTML, CSS und JavaScript zusammenarbeiten
- Eigene HTML-Eingaben (Inputs) erstellen
- Elemente mit CSS gestalten (Layout, Farben, Responsiveness)
- Inputs mit JavaScript auslesen und den DOM verändern
- Grundidee von Browser vs. Server
- Überblick: 3D im Web, physikbasiert vs. nicht-physikbasiert

## Projekt starten

- Öffne `index.html` im Browser (Doppelklick) oder nutze eine Live-Server-Erweiterung in deinem Editor.
- Der Code liegt hier:
  - `index.html` – Startseite/Struktur
  - `würfel.js` – Beispiel-Logik (JavaScript)

## Was machen Browser und Server?

- Browser: rendert HTML (Struktur), wendet CSS an (Aussehen) und führt JavaScript aus (Logik/Interaktivität). Alles passiert zunächst lokal im Browser.
- Server: stellt Dateien bereit (z. B. `index.html`, Bilder, `.js`-Dateien) oder liefert Daten per API. In diesem Projekt reicht der Browser – ein Server ist optional.

## Kurzüberblick: HTML, CSS, JavaScript

### HTML (Struktur)

- Bausteine: Tags/Elemente (`<h1>`, `<p>`, `<button>`, `<input>`, ...)
- Attribute: zusätzliche Infos (`id`, `class`, `type`, `placeholder`, ...)
- Semantik: nutze passende Elemente (z. B. `<form>`, `<label>`, `<main>`, ...)

Beispiel Inputs:

```html
<label for="anzahl">Anzahl</label>
<input id="anzahl" type="number" min="1" value="1" />

<label for="farbe">Farbe</label>
<input id="farbe" type="color" value="#4f46e5" />

<button id="start">Start</button>
```

### CSS (Design)

- Selektoren (`.klasse`, `#id`, `button`, `input[type="number"]`, ...)
- Box-Modell (margin, border, padding, content)
- Layout (Flexbox, Grid)
- Farben, Schriften, Abstände, Zustände (Hover, Focus)

Beispiel Styling:

```css
:root {
  --brand: #4f46e5;
}

body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
}

.form {
  display: grid;
  gap: 0.75rem;
  max-width: 420px;
}

button {
  background: var(--brand);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

button:hover {
  filter: brightness(1.1);
}
```

### JavaScript (Interaktivität)

- Variablen, Funktionen, Events
- DOM-Manipulation: Elemente finden, Werte auslesen, Inhalte ändern
- Event-Listener für Klicks, Input-Änderungen, Form-Submit

Beispiel Verknüpfung:

```js
// DOM-Referenzen holen
const inputAnzahl = document.querySelector("#anzahl");
const inputFarbe = document.querySelector("#farbe");
const startBtn = document.querySelector("#start");

// Klick-Handler registrieren
startBtn.addEventListener("click", () => {
  const anzahl = Number(inputAnzahl.value);
  const farbe = inputFarbe.value;

  // TODO: Eigene Logik einfügen oder mit Funktionen aus dice.js arbeiten
  // Beispiel: Ausgabe in die Konsole oder DOM aktualisieren
  console.log("Anzahl:", anzahl, "Farbe:", farbe);

  const output = document.querySelector("#output");
  if (output) {
    output.textContent = `Gewählte Anzahl: ${anzahl}`;
    output.style.color = farbe;
  }
});
```

## Aufgaben

> Ziel: Selbstständig Inputs bauen, stylen und mit JS verknüpfen. Starte klein, erweitere schrittweise.

1. HTML – Eingaben erstellen

- Baue ein Formular mit:
  - mindestens einem `number`-Input (z. B. Anzahl)
  - einem weiteren Input deiner Wahl (`text`, `color`, `checkbox`, `range`, `select`)
  - einem `button` zum Starten/Auslösen
- Nutze zu jedem Input ein passendes `<label>`.

2. CSS – Erscheinungsbild gestalten

- Ordne die Felder übersichtlich an (z. B. Grid/Flexbox)
- Hebe den Button visuell hervor
- Style `:focus`-Zustände für bessere Bedienbarkeit
- Achte auf ausreichenden Kontrast und Lesbarkeit

3. JavaScript – Logik verknüpfen

- Lies die Werte aus den Inputs aus
- Reagiere auf Klick (oder Form-Submit) und führe eine Aktion aus
- Aktualisiere den DOM (z. B. Text ändern, Elemente ein-/ausblenden)
- Bonus: Validierung (z. B. nur positive Zahlen zulassen)

4. Bonus-Ideen

- Speichere Einstellungen im `localStorage`
- Erzeuge dynamisch neue Elemente (z. B. Ergebnisliste)
- Nutze einfache Animationen (CSS-Transitions oder JS-Klassen toggeln)

## Debugging-Tipps

- Browser-Konsole öffnen (F12) → „Konsole“: Fehlermeldungen lesen, `console.log` nutzen
- „Elemente“-Tab: HTML-Struktur und CSS live prüfen
- Netzwerkanfragen im „Netzwerk“-Tab (falls später APIs dazukommen)

## 3D im Web: Überblick

- Rendering-Wege: Canvas 2D, WebGL, WebGPU (modern, experimentell), Bibliotheken wie Three.js
- Szenen bestehen typischerweise aus: Szene, Kamera, Licht, Meshes (Geometrie + Material)

### Physikbasiert vs. nicht-physikbasiert

- Physikbasiert:
  - Simulation realer Effekte (Schwerkraft, Kräfte, Kollisionen)
  - Nutzt Physik-Engines (z. B. Cannon.js, Ammo.js)
  - Vorteil: realistische Bewegung, glaubwürdiges Verhalten
  - Nachteil: komplexer, Performance-Kosten, Feintuning nötig
- Nicht-physikbasiert:
  - Bewegung durch direkte Transformationen (Position, Rotation, Skalierung)
  - Keyframe-Animationen, Tweening (z. B. GSAP), kinematische Steuerung
  - Vorteil: volle Kontrolle, oft einfacher
  - Nachteil: weniger „realistisch“ ohne zusätzlichen Aufwand

Wann nutze ich was?

- Spiele/Simulationen mit Kollisionen/Gravitation → physikbasiert
- UI-Effekte, Visualisierungen, einfache Animationen → nicht-physikbasiert

Mini-Experiment (Idee für Demo):

- Nicht-physikbasiert: Würfel rotiert konstant um die Y-Achse (feste Rotationsgeschwindigkeit)
- Physikbasiert: Würfel fällt nach unten, prallt auf Boden, kommt zum Liegen (Schwerkraft + Kollision)

## Weiterführende Ressourcen

- MDN Web Docs: HTML, CSS, JS Grundlagen – `https://developer.mozilla.org`
- Flexbox & Grid Üben – `https://flexboxfroggy.com` und `https://cssgridgarden.com`
- JavaScript Basics (freeCodeCamp) – `https://www.freecodecamp.org/learn`
- Three.js Docs (3D im Web) – `https://threejs.org/docs/`
- Cannon-es (Physik-Engine in JS) – `https://pmndrs.github.io/cannon-es/`

Viel Spaß beim Ausprobieren und Bauen!
