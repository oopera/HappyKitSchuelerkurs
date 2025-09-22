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

  window.Helpers = {
    ermittleTextFarbe,
    erzeugeTextTextur,
    updateMaterialTexture,
  };
})();
