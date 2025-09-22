(function () {
  // Hilfsfunktionen für Text-/Textur-Erzeugung und Kontrastberechnung
  const DREI = window.THREE;
  if (!DREI) {
    console.error("THREE.js nicht geladen (Helpers)");
    return;
  }

  // Ermittelt lesbare Textfarbe (#111 oder #fff) basierend auf Hintergrundhelligkeit
  function ermittleTextFarbe(hintergrundHex) {
    try {
      const farbe = new DREI.Color(hintergrundHex);
      const r = farbe.r,
        g = farbe.g,
        b = farbe.b;
      const helligkeit = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return helligkeit > 0.6 ? "#111111" : "#ffffff";
    } catch (e) {
      return "#111111";
    }
  }

  // Rendert Text mittig in ein 512x512-Canvas und erzeugt eine CanvasTexture
  function erzeugeTextTextur(text, hintergrund) {
    const groesse = 512;
    const leinwand = document.createElement("canvas");
    leinwand.width = groesse;
    leinwand.height = groesse;
    const kontext = leinwand.getContext("2d");

    const rand = 40;
    const maxBreite = groesse - rand * 2;
    const maxHoehe = groesse - rand * 2;

    // Bricht langen Text auf mehrere Zeilen, sodass er in maxBreite passt
    const umbrecheZeilen = (ctx, t, breite) => {
      const woerter = String(t ?? "").split(/\s+/);
      const ausgabe = [];
      let aktuell = "";
      for (let i = 0; i < woerter.length; i++) {
        const kandidat = aktuell ? aktuell + " " + woerter[i] : woerter[i];
        if (ctx.measureText(kandidat).width <= breite) aktuell = kandidat;
        else {
          if (aktuell) ausgabe.push(aktuell);
          aktuell = woerter[i];
        }
      }
      if (aktuell) ausgabe.push(aktuell);
      return ausgabe.length ? ausgabe : [""];
    };

    // Suche eine Schriftgröße, die sowohl Höhe als auch Breite einhält
    let schriftgroesse = 220;
    let passendeZeilen = [String(text ?? "")];
    while (schriftgroesse >= 16) {
      kontext.font = `${schriftgroesse}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      const zeilen = umbrecheZeilen(kontext, text ?? "", maxBreite);
      const zeilenHoehe = Math.ceil(schriftgroesse * 1.15);
      const gesamtHoehe = zeilen.length * zeilenHoehe;
      let breiteste = 0;
      for (let i = 0; i < zeilen.length; i++)
        breiteste = Math.max(breiteste, kontext.measureText(zeilen[i]).width);
      if (gesamtHoehe <= maxHoehe && breiteste <= maxBreite) {
        passendeZeilen = zeilen;
        break;
      }
      schriftgroesse -= 4;
    }

    kontext.fillStyle = hintergrund;
    kontext.fillRect(0, 0, groesse, groesse);
    kontext.fillStyle = ermittleTextFarbe(hintergrund);
    kontext.textAlign = "center";
    kontext.textBaseline = "middle";
    kontext.font = `${schriftgroesse}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const zeilenHoehe = Math.ceil(schriftgroesse * 1.15);
    const gesamtHoehe = passendeZeilen.length * zeilenHoehe;
    let y = groesse / 2 - gesamtHoehe / 2 + zeilenHoehe / 2;
    for (let i = 0; i < passendeZeilen.length; i++) {
      kontext.fillText(passendeZeilen[i], groesse / 2, y);
      y += zeilenHoehe;
    }

    // Canvas in eine THREE-Textur umwandeln
    const textur = new DREI.CanvasTexture(leinwand);
    textur.anisotropy = 8;
    textur.needsUpdate = true;
    return textur;
  }

  // Hilfs-Wrapper: Material-Map einer Seite neu setzen
  function updateMaterialTexture(
    index,
    seitenTexte,
    seitenFarben,
    materialien,
    seiteZuMaterialIndex
  ) {
    const mi = seiteZuMaterialIndex[index];
    const m = materialien[mi];
    if (m && m.map) m.map.dispose();
    m.map = erzeugeTextTextur(seitenTexte[index], seitenFarben[index]);
    m.needsUpdate = true;
  }

  // Baut (und entsorgt) die 6 Materialien anhand Text+Farbe
  function baueMaterialien(
    alteMaterialien,
    texte,
    farben,
    seiteZuMaterialIndex
  ) {
    if (Array.isArray(alteMaterialien) && alteMaterialien.length) {
      alteMaterialien.forEach((m) => {
        if (!m) return;
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
    const mats = new Array(6);
    for (let seite = 0; seite < 6; seite++) {
      const mi = seiteZuMaterialIndex[seite];
      mats[mi] = new DREI.MeshBasicMaterial({
        map: erzeugeTextTextur(texte[seite], farben[seite]),
      });
    }
    return mats;
  }

  // Bestimmt Index der nach oben gerichteten Fläche
  function ermittleOberesMaterialIndex(quaternion, flaechenNormalen) {
    let bestIdx = 2;
    let bestDot = -Infinity;
    const oben = new DREI.Vector3(0, 1, 0);
    for (let i = 0; i < 6; i++) {
      const weltNormal = flaechenNormalen[i]
        .clone()
        .applyQuaternion(quaternion);
      const punkt = weltNormal.dot(oben);
      if (punkt > bestDot) {
        bestDot = punkt;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  // Quaternion, das eine Fläche nach oben bringt; drehViertel rotiert um Y
  function quaternionFuerObereFlaeche(
    materialIndex,
    drehViertel,
    flaechenNormalen
  ) {
    const von = flaechenNormalen[materialIndex];
    const zu = new DREI.Vector3(0, 1, 0);
    const ausrichten = new DREI.Quaternion().setFromUnitVectors(von, zu);
    const gieren = new DREI.Quaternion().setFromAxisAngle(
      new DREI.Vector3(0, 1, 0),
      (Math.PI / 2) * (drehViertel % 4)
    );
    return gieren.multiply(ausrichten);
  }

  // Wählt 0..3 Vierteldrehungen für lesbare Textausrichtung
  function waehleGierFuerLesbarkeit(
    materialIndex,
    flaechenNormalen,
    textObenRichtung,
    kamera
  ) {
    let besteViertel = 0;
    let besteBewertung = -Infinity;
    const zentrumLokal = flaechenNormalen[materialIndex]
      .clone()
      .multiplyScalar(1.0);
    for (let k = 0; k < 4; k++) {
      const q = quaternionFuerObereFlaeche(materialIndex, k, flaechenNormalen);
      const obenLokal = textObenRichtung[materialIndex];
      const zentrumWelt = zentrumLokal.clone().applyQuaternion(q);
      const obenWelt = obenLokal.clone().applyQuaternion(q).normalize();
      const p0 = zentrumWelt.clone();
      const p1 = zentrumWelt.clone().add(obenWelt.clone().multiplyScalar(0.5));
      const p0N = p0.clone().project(kamera);
      const p1N = p1.clone().project(kamera);
      const dx = p1N.x - p0N.x;
      const dy = p1N.y - p0N.y;
      const bewertung = dy - Math.abs(dx) * 0.25;
      if (bewertung > besteBewertung) {
        besteBewertung = bewertung;
        besteViertel = k;
      }
    }
    return besteViertel;
  }

  // Positioniert Markierung über aktueller Oberseite; gibt deren Index zurück
  function aktualisiereMarkierung(
    markierung,
    wuerfelQuaternion,
    flaechenNormalen
  ) {
    const topIdx = ermittleOberesMaterialIndex(
      wuerfelQuaternion,
      flaechenNormalen
    );
    const lokaleNormale = flaechenNormalen[topIdx];
    const pos = lokaleNormale.clone().multiplyScalar(1.02);
    markierung.position.copy(pos);
    const q = new DREI.Quaternion().setFromUnitVectors(
      new DREI.Vector3(0, 0, 1),
      lokaleNormale
    );
    markierung.quaternion.copy(q);
    return topIdx;
  }

  // Hinweis anzeigen/verbergen
  function hinweis(nachricht, verstecken, elementId = "hinweis") {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (verstecken) {
      el.textContent = "";
      return;
    }
    el.textContent = nachricht;
  }

  // Renderer/Kamera ans Canvas anpassen
  function passeRendererAnAnzeigeAn(renderer, kamera, leinwandElement) {
    const rect = leinwandElement.getBoundingClientRect();
    const breite = Math.floor(rect.width);
    const hoehe = Math.floor(rect.height);
    const mussAnpassen =
      leinwandElement.width !== breite || leinwandElement.height !== hoehe;
    if (mussAnpassen) {
      renderer.setSize(breite, hoehe, false);
      kamera.aspect = breite / hoehe;
      kamera.updateProjectionMatrix();
    }
    return mussAnpassen;
  }

  // Input-Handler für Texte/Farben
  function onSeiteTextInput(
    index,
    e,
    seitenTexte,
    seitenFarben,
    materialien,
    seiteZuMaterialIndex
  ) {
    seitenTexte[index] = e.target.value;
    updateMaterialTexture(
      index,
      seitenTexte,
      seitenFarben,
      materialien,
      seiteZuMaterialIndex
    );
  }

  function onSeiteFarbeInput(
    index,
    e,
    seitenTexte,
    seitenFarben,
    materialien,
    seiteZuMaterialIndex
  ) {
    seitenFarben[index] = e.target.value;
    updateMaterialTexture(
      index,
      seitenTexte,
      seitenFarben,
      materialien,
      seiteZuMaterialIndex
    );
  }

  window.Helpers = {
    ermittleTextFarbe,
    erzeugeTextTextur,
    updateMaterialTexture,
    baueMaterialien,
    ermittleOberesMaterialIndex,
    quaternionFuerObereFlaeche,
    waehleGierFuerLesbarkeit,
    aktualisiereMarkierung,
    hinweis,
    passeRendererAnAnzeigeAn,
    onSeiteTextInput,
    onSeiteFarbeInput,
  };
})();
