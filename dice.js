(function () {
  const DREI = window.THREE;
  if (!DREI) {
    console.error("THREE.js nicht geladen");
    return;
  }

  const standardSeitenTexte = [
    "Trink ein Glas Wasser.",
    "Mache einen kleinen Spaziergang.",
    "Was ist etwas wofür du dankbar bist?",
    "Schreibe einen Brief an deinen Lieblingsmensch.",
    "Berühre eine Pflanze.",
    "Worauf freust du dich diese Woche am meisten?",
  ];
  const standardSeitenFarben = [
    "#C7017F",
    "#A2C617",
    "#FBBA00",
    "#C40C42",
    "#35B6B4",
    "#00AEEF",
  ];

  let materialien = [];
  const geometrie = new DREI.BoxGeometry(2, 2, 2);
  const wuerfel = new DREI.Mesh(geometrie, materialien);
  const markierung = new DREI.Mesh(
    new DREI.PlaneGeometry(2.04, 2.04),
    new DREI.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
    })
  );

  const kantenGeom = new DREI.EdgesGeometry(new DREI.PlaneGeometry(2.04, 2.04));
  const kanten = new DREI.LineSegments(
    kantenGeom,
    new DREI.LineBasicMaterial({ color: 0x10b981 })
  );

  let animation = null;

  const useOldAnimation = false;

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

  function erzeugeTextTextur(text, hintergrund) {
    const groesse = 512;
    const leinwand = document.createElement("canvas");
    leinwand.width = groesse;
    leinwand.height = groesse;
    const kontext = leinwand.getContext("2d");

    const rand = 40;
    const maxBreite = groesse - rand * 2;
    const maxHoehe = groesse - rand * 2;

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

    const textur = new DREI.CanvasTexture(leinwand);
    textur.anisotropy = 8;
    textur.needsUpdate = true;
    return textur;
  }

  // MATERIAL ORDER FÜR BOXGEOMETRY: [ +x, -x, +y, -y, +z, -z ]
  const seiteZuMaterialIndex = [2, 0, 4, 5, 1, 3];
  const materialIndexZuSeite = [1, 4, 0, 5, 2, 3];
  const flaechenNormalen = [
    new DREI.Vector3(1, 0, 0),
    new DREI.Vector3(-1, 0, 0),
    new DREI.Vector3(0, 1, 0),
    new DREI.Vector3(0, -1, 0),
    new DREI.Vector3(0, 0, 1),
    new DREI.Vector3(0, 0, -1),
  ];
  const textObenRichtung = [
    new DREI.Vector3(0, 1, 0),
    new DREI.Vector3(0, 1, 0),
    new DREI.Vector3(0, 0, -1),
    new DREI.Vector3(0, 0, 1),
    new DREI.Vector3(0, 1, 0),
    new DREI.Vector3(0, 1, 0),
  ];

  // ELEMENT FÜR DEN WÜRFEL
  const leinwandElement = document.getElementById("szene");
  const renderer = new DREI.WebGLRenderer({
    canvas: leinwandElement,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const szene = new DREI.Scene();
  szene.background = new DREI.Color(0xf3f4f6);

  const kamera = new DREI.PerspectiveCamera(45, 1, 0.1, 100);
  kamera.position.set(3.5, 3.0, 3.5);
  kamera.lookAt(0, 0, 0);

  const umgebungsLicht = new DREI.AmbientLight(0xffffff, 0.8);
  szene.add(umgebungsLicht);
  const richtungsLicht = new DREI.DirectionalLight(0xffffff, 0.6);
  richtungsLicht.position.set(5, 10, 7.5);
  szene.add(richtungsLicht);

  const wuerfelGruppe = new DREI.Group();
  szene.add(wuerfelGruppe);

  function baueMaterialien(texte, farben) {
    if (materialien.length) {
      materialien.forEach((m) => {
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
    materialien = mats;
    if (wuerfel) wuerfel.material = materialien;
  }

  wuerfelGruppe.add(wuerfel);

  // Markierung für obere Fläche

  wuerfel.add(markierung);

  markierung.add(kanten);

  // ELEMENT FÜR DIE EINGABEFELDER (aus HTML)
  const seitenTexte = standardSeitenTexte.slice();
  const seitenFarben = standardSeitenFarben.slice();

  const textEingaebe = [
    document.getElementById("seiteText1"),
    document.getElementById("seiteText2"),
    document.getElementById("seiteText3"),
    document.getElementById("seiteText4"),
    document.getElementById("seiteText5"),
    document.getElementById("seiteText6"),
  ];
  const farbEingaebe = [
    document.getElementById("seiteFarbe1"),
    document.getElementById("seiteFarbe2"),
    document.getElementById("seiteFarbe3"),
    document.getElementById("seiteFarbe4"),
    document.getElementById("seiteFarbe5"),
    document.getElementById("seiteFarbe6"),
  ];

  for (let i = 0; i < 6; i++) {
    if (textEingaebe[i]) textEingaebe[i].value = seitenTexte[i];
    if (farbEingaebe[i]) farbEingaebe[i].value = seitenFarben[i];
  }

  function verbindeSteuerung() {
    for (let i = 0; i < 6; i++) {
      const text = textEingaebe[i];
      const farbe = farbEingaebe[i];
      if (text) {
        text.addEventListener("input", () => {
          seitenTexte[i] = text.value;
          const mi = seiteZuMaterialIndex[i];
          const m = materialien[mi];
          if (m && m.map) m.map.dispose();
          m.map = erzeugeTextTextur(seitenTexte[i], seitenFarben[i]);
          m.needsUpdate = true;
        });
      }
      if (farbe) {
        farbe.addEventListener("input", () => {
          seitenFarben[i] = farbe.value;
          const mi = seiteZuMaterialIndex[i];
          const m = materialien[mi];
          if (m && m.map) m.map.dispose();
          m.map = erzeugeTextTextur(seitenTexte[i], seitenFarben[i]);
          m.needsUpdate = true;
        });
      }
    }
  }

  verbindeSteuerung();
  baueMaterialien(seitenTexte, seitenFarben);

  function ermittleOberesMaterialIndex() {
    const q = wuerfel.quaternion;
    let bestIdx = 2;
    let bestDot = -Infinity;
    const oben = new DREI.Vector3(0, 1, 0);
    for (let i = 0; i < 6; i++) {
      const weltNormal = flaechenNormalen[i].clone().applyQuaternion(q);
      const punkt = weltNormal.dot(oben);
      if (punkt > bestDot) {
        bestDot = punkt;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function quaternionFuerObereFlaeche(materialIndex, drehViertel) {
    const von = flaechenNormalen[materialIndex];
    const zu = new DREI.Vector3(0, 1, 0);
    const ausrichten = new DREI.Quaternion().setFromUnitVectors(von, zu);
    const gieren = new DREI.Quaternion().setFromAxisAngle(
      new DREI.Vector3(0, 1, 0),
      (Math.PI / 2) * (drehViertel % 4)
    );
    return gieren.multiply(ausrichten);
  }

  function waehleGierFuerLesbarkeit(materialIndex) {
    let besteViertel = 0;
    let besteBewertung = -Infinity;
    const zentrumLokal = flaechenNormalen[materialIndex]
      .clone()
      .multiplyScalar(1.0);
    for (let k = 0; k < 4; k++) {
      const q = quaternionFuerObereFlaeche(materialIndex, k);
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

  function aktualisiereMarkierung() {
    const topIdx = ermittleOberesMaterialIndex();
    const lokaleNormale = flaechenNormalen[topIdx];
    const pos = lokaleNormale.clone().multiplyScalar(1.02);
    markierung.position.copy(pos);
    const q = new DREI.Quaternion().setFromUnitVectors(
      new DREI.Vector3(0, 0, 1),
      lokaleNormale
    );
    markierung.quaternion.copy(q);
  }

  function wuerfeln_improved() {
    const zufallsAchse = new DREI.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();
    const staerke = 10 + Math.random() * 5; // rad/s
    const winkelgeschwindigkeit = zufallsAchse.multiplyScalar(staerke);

    animation = {
      phase: 0,
      start: performance.now(),
      letzteZeit: performance.now(),
      winkelgeschwindigkeit,
      daempfung: 0.985,
    };
    hinweis("", true);
  }

  function wuerfeln() {
    if (!useOldAnimation) {
      wuerfeln_improved();
      return;
    }

    animation = {
      phase: 0,
      start: performance.now(),
      duration: 1200,
      from: wuerfel.quaternion.clone(),
      to: new DREI.Quaternion().setFromEuler(
        new DREI.Euler(
          Math.PI * 2 * (2 + Math.random() * 3),
          Math.PI * 2 * (2 + Math.random() * 3),
          Math.PI * 2 * (2 + Math.random() * 3),
          "XYZ"
        )
      ),
    };
    hinweis("", true);
  }

  function hinweis(nachricht, verstecken) {
    const el = document.getElementById("hinweis");
    console.log(el, nachricht);
    if (verstecken) {
      el.style.display = "none";
      el.textContent = "";
      return;
    }
    el.textContent = nachricht;
    el.style.display = "block";
  }

  // ELEMENT FÜR DEN WÜRFEL
  document.getElementById("wuerfelButton").addEventListener("click", wuerfeln);

  function passeRendererAnAnzeigeAn() {
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

  function animiere() {
    requestAnimationFrame(animiere);
    passeRendererAnAnzeigeAn();

    aktualisiereMarkierung();

    if (animation) {
      const jetzt = performance.now();

      if (animation.phase === 0) {
        if (!useOldAnimation) {
          const dt = Math.min(0.05, (jetzt - animation.letzteZeit) / 1000);
          animation.letzteZeit = jetzt;
          const omega = animation.winkelgeschwindigkeit;
          const winkel = omega.length() * dt;
          if (winkel > 0) {
            const achse = omega.clone().normalize();
            const dq = new DREI.Quaternion().setFromAxisAngle(achse, winkel);
            wuerfel.quaternion.multiplyQuaternions(dq, wuerfel.quaternion);
          }
          const faktor = Math.pow(animation.daempfung, dt * 60);
          omega.multiplyScalar(faktor);

          if (omega.length() < 0.6) {
            const oberesMatIdx = ermittleOberesMaterialIndex();
            const gierViertel = waehleGierFuerLesbarkeit(oberesMatIdx);
            animation = {
              phase: 1,
              start: performance.now(),
              duration: 450,
              from: wuerfel.quaternion.clone(),
              to: quaternionFuerObereFlaeche(oberesMatIdx, gierViertel),
            };
          }
        } else if (useOldAnimation) {
          const t = Math.min(1, (jetzt - animation.start) / animation.duration);
          const eased = 1 - Math.pow(1 - t, 3);
          wuerfel.quaternion.slerpQuaternions(
            animation.from,
            animation.to,
            eased
          );
          if (t >= 1) {
            if (animation.phase === 0) {
              const topMatIdx = ermittleOberesMaterialIndex();
              const yawTurns = waehleGierFuerLesbarkeit(topMatIdx);
              animation = {
                phase: 1,
                start: performance.now(),
                duration: 450,
                from: wuerfel.quaternion.clone(),
                to: quaternionFuerObereFlaeche(topMatIdx, yawTurns),
              };
            }
          }
        }
      }

      if (animation.phase === 1) {
        const t2 = Math.min(1, (jetzt - animation.start) / animation.duration);
        const eased2 = 1 - Math.pow(1 - t2, 3);
        if (animation.from && animation.to) {
          wuerfel.quaternion.slerpQuaternions(
            animation.from,
            animation.to,
            eased2
          );
        }
        if (t2 >= 1) {
          animation = null;
          const endTop = ermittleOberesMaterialIndex();
          const seitenIndex = materialIndexZuSeite[endTop];
          hinweis(seitenTexte[seitenIndex]);
        }
      }
    }

    renderer.render(szene, kamera);
  }

  animiere();
})();
