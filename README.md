# HappyKit Schülerkurs – 60‑Minuten Workshop: Websites mit HTML, CSS & JS

Kurz und praxisnah: In 1 Stunde bauen die Schüler:innen einen interaktiven 3D‑„Prompt‑Würfel“. Sie erstellen HTML‑Inputs, stylen sie mit CSS und verbinden alles per JavaScript, damit Texte/Farben der sechs Würfelseiten live gesteuert und per Button „gewürfelt“ werden können.

## Vorbereitung (2 Min)

- Öffne `index.html` direkt im Browser (Doppelklick) oder mit Live Server.
- Relevante Dateien:
  - `index.html` – Seite, Aufgaben und Script‑Hook `verbindeSteuerung()`
  - `Helfer/style.css` – Basis‑Styles
  - `Helfer/wuerfel.js` – 3D‑Logik (Three.js), App‑API: `WuerfelApp(...)`

## Lernziele (1 Min)

- HTML: Inputs anlegen und sinnvoll benennen
- CSS: Inputs und Button ansprechend gestalten
- JS: DOM‑Elemente holen, Events verknüpfen, App‑API nutzen
- Browser vs. Server: Hier läuft alles lokal im Browser

## Ablauf / Zeitplan (ca. 60 Min)

1. Einstieg: Was machen Browser & JS? (0–5 Min)

- Browser rendert HTML, wendet CSS an, führt JS aus. Kein Server nötig.

2. Überblick zum Ziel (5–10 Min)

- In `index.html` seht ihr Platzhalter im Bereich `div#steuerung` und die Funktion `verbindeSteuerung()`.
- Ziel: 6 Texte + 6 Farben steuern und mit einem Button würfeln.

3. Aufgabe 1 – HTML bauen (10–25 Min)

- Fügt im Bereich `div#steuerung` 6 Blöcke ein. Nutzt folgende ID‑Konvention:
  - Text‑IDs: `seite1Text` … `seite6Text`
  - Farb‑IDs: `seite1Farbe` … `seite6Farbe`
- Fügt danach einen Button zum Starten hinzu: `wuerfelnBtn`

Beispiel für einen Block (Seite 1):

```html
<div class="eingabe-container">
  <input type="text" id="seite1Text" placeholder="Seite 1 Text" />
  <input type="color" id="seite1Farbe" value="#ffcc00" />
  <!-- Wiederhole für Seite 2–6 mit passenden IDs -->
  <!-- Button unten separat anlegen -->
  <!-- <input type="button" id="wuerfelnBtn" value="Würfeln" /> -->
</div>
```

Button unterhalb der Eingaben einfügen:

```html
<input type="button" id="wuerfelnBtn" value="Würfeln" />
```

Tipps:

- IDs müssen exakt mit den späteren JS‑Arrays übereinstimmen.
- Nutzt sprechende Platzhalter und sinnvolle Default‑Farben.

4. Aufgabe 2 – CSS stylen (25–35 Min)

- Ergänzt das Style‑Gerüst in `index.html` (Bereich `<style>`). Minimal‑Styles, die gut aussehen und schnell gehen:

```css
/* Button Styling */
input[type="button"],
button {
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
}

input[type="button"]:hover,
button:hover {
  filter: brightness(1.1);
}

/* Input Styling */
input[type="text"],
input[type="color"] {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.eingabe-container {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
```

5. Aufgabe 3 – JavaScript verbinden (35–50 Min)

- In `index.html` ist `verbindeSteuerung()` vorbereitet. Tragt eure IDs dort ein:

```js
const textIds = [
  "seite1Text",
  "seite2Text",
  "seite3Text",
  "seite4Text",
  "seite5Text",
  "seite6Text",
];

const farbIds = [
  "seite1Farbe",
  "seite2Farbe",
  "seite3Farbe",
  "seite4Farbe",
  "seite5Farbe",
  "seite6Farbe",
];

var button = document.getElementById("wuerfelnBtn");
```

Hinweise:

- Die App liefert Startwerte per `app.getSeitenTexte()` und `app.getSeitenFarben()` und aktualisiert sich bei `input`‑Events.
- Der Button ruft `app.wuerfeln()` auf.

6. Testen, Show & Tell, Bonus (50–60 Min)

- Test: Ändert Texte/Farben → Wird der Würfel live aktualisiert? Klick → Würfeln?
- Debug: F12 → „Konsole“, Meldungen lesen; IDs prüfen; Tippfehler sind häufig.
- Bonusideen: Standardtexte setzen, Button stilistisch hervorheben, Platzhalter variieren.

## Cheat‑Sheet (für die Tafel)

- `document.getElementById("id")` → Element holen
- `element.addEventListener("input" | "click", handler)` → Events verknüpfen
- `input.value` → aktuellen Wert lesen/schreiben
- App‑API: `app.setText(index, wert)`, `app.setFarbe(index, hex)`, `app.wuerfeln()`

## Kurz zu 3D & Physik

- Three.js rendert die Szene im `<canvas id="szene">`.
- In diesem Workshop nutzen wir den nicht‑physikbasierten Modus (`physikbasiert: false`) für weniger Komplexität.

Viel Erfolg und Spaß beim Bauen! TalentTage Ruhr – 30.09.2025 · Hochschule Ruhr West
