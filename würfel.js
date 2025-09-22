(function () {
  // Würfel mit THREE.js: Texturen, Eingaben, Animation, Hinweisanzeige
  const DREI = window.THREE;
  if (!DREI) {
    console.error("THREE.js nicht geladen");
    return;
  }

  // Standardtexte für die 6 Würfelseiten
  const standardSeitenTexte = [
    "Trink ein Glas Wasser.",
    "Mache einen kleinen Spaziergang.",
    "Was ist etwas wofür du dankbar bist?",
    "Schreibe einen Brief an deinen Lieblingsmensch.",
    "Berühre eine Pflanze.",
    "Worauf freust du dich diese Woche am meisten?",
  ];
  // Standardfarben für die 6 Würfelseiten
  const standardSeitenFarben = [
    "#C7017F",
    "#A2C617",
    "#FBBA00",
    "#C40C42",
    "#35B6B4",
    "#00AEEF",
  ];

  // Materialien der 6 Seiten (wird dynamisch neu erzeugt)
  let materialien = [];
  const geometrie = new DREI.BoxGeometry(2, 2, 2);
  const wuerfel = new DREI.Mesh(geometrie, materialien);
  // Halbtransparente Markierung für die obenliegende Seite
  const markierung = new DREI.Mesh(
    new DREI.PlaneGeometry(2.04, 2.04),
    new DREI.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
    })
  );

  // Kanten-Overlay der Markierungs-Plane
  const kantenGeom = new DREI.EdgesGeometry(new DREI.PlaneGeometry(2.04, 2.04));
  const kanten = new DREI.LineSegments(
    kantenGeom,
    new DREI.LineBasicMaterial({ color: 0x10b981 })
  );

  let animation = null;

  // true = neue, gedämpfte Rotation; false = alte, zeitbasierte Animation
  const PhysikbasierteAnimation = false;

  // MATERIAL ORDER FÜR BOXGEOMETRY: [ +x, -x, +y, -y, +z, -z ]
  const seiteZuMaterialIndex = [2, 0, 4, 5, 1, 3];
  const materialIndexZuSeite = [1, 4, 0, 5, 2, 3];
  // Lokale Normalen jeder Seitenfläche
  const flaechenNormalen = [
    new DREI.Vector3(1, 0, 0),
    new DREI.Vector3(-1, 0, 0),
    new DREI.Vector3(0, 1, 0),
    new DREI.Vector3(0, -1, 0),
    new DREI.Vector3(0, 0, 1),
    new DREI.Vector3(0, 0, -1),
  ];
  // Für jede Seite: Richtung, in die der Text "nach oben" zeigt
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
  // Pixelratio begrenzen für Performance auf High-DPI-Displays
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

  // Materialien mit Helper erzeugen
  function baueMaterialien(texte, farben) {
    materialien = Helpers.baueMaterialien(
      materialien,
      texte,
      farben,
      seiteZuMaterialIndex
    );
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

  // Text geändert: Textur der betreffenden Seite neu rendern
  function onSeiteTextInput(index, e) {
    Helpers.onSeiteTextInput(
      index,
      e,
      seitenTexte,
      seitenFarben,
      materialien,
      seiteZuMaterialIndex
    );
  }

  // Farbe geändert: Textur der betreffenden Seite neu rendern
  function onSeiteFarbeInput(index, e) {
    Helpers.onSeiteFarbeInput(
      index,
      e,
      seitenTexte,
      seitenFarben,
      materialien,
      seiteZuMaterialIndex
    );
  }

  // const t1 = document.getElementById("seiteText1");
  // if (t1) t1.addEventListener("input", (e) => onSeiteTextInput(0, e));

  // Verdrahtet Inputs (Texte/Farben) mit den Handlern
  function verbindeSteuerung() {
    const t1 = document.getElementById("seiteText1");
    if (t1) t1.addEventListener("input", (e) => onSeiteTextInput(0, e));
    const t2 = document.getElementById("seiteText2");
    if (t2) t2.addEventListener("input", (e) => onSeiteTextInput(1, e));
    const t3 = document.getElementById("seiteText3");
    if (t3) t3.addEventListener("input", (e) => onSeiteTextInput(2, e));
    const t4 = document.getElementById("seiteText4");
    if (t4) t4.addEventListener("input", (e) => onSeiteTextInput(3, e));
    const t5 = document.getElementById("seiteText5");
    if (t5) t5.addEventListener("input", (e) => onSeiteTextInput(4, e));
    const t6 = document.getElementById("seiteText6");
    if (t6) t6.addEventListener("input", (e) => onSeiteTextInput(5, e));

    const f1 = document.getElementById("seiteFarbe1");
    if (f1) f1.addEventListener("input", (e) => onSeiteFarbeInput(0, e));
    const f2 = document.getElementById("seiteFarbe2");
    if (f2) f2.addEventListener("input", (e) => onSeiteFarbeInput(1, e));
    const f3 = document.getElementById("seiteFarbe3");
    if (f3) f3.addEventListener("input", (e) => onSeiteFarbeInput(2, e));
    const f4 = document.getElementById("seiteFarbe4");
    if (f4) f4.addEventListener("input", (e) => onSeiteFarbeInput(3, e));
    const f5 = document.getElementById("seiteFarbe5");
    if (f5) f5.addEventListener("input", (e) => onSeiteFarbeInput(4, e));
    const f6 = document.getElementById("seiteFarbe6");
    if (f6) f6.addEventListener("input", (e) => onSeiteFarbeInput(5, e));
  }

  verbindeSteuerung();
  baueMaterialien(seitenTexte, seitenFarben);

  // Bestimmt die aktuell nach oben gerichtete Fläche (Materialindex 0..5)
  function ermittleOberesMaterialIndex() {
    return Helpers.ermittleOberesMaterialIndex(
      wuerfel.quaternion,
      flaechenNormalen
    );
  }

  // Orientierung, die eine gegebene Fläche nach oben bringt; drehViertel rotiert um Y
  function quaternionFuerObereFlaeche(materialIndex, drehViertel) {
    return Helpers.quaternionFuerObereFlaeche(
      materialIndex,
      drehViertel,
      flaechenNormalen
    );
  }

  // Wählt 0..3 Vierteldrehungen für bestmögliche Lesbarkeit der Textausrichtung
  function waehleGierFuerLesbarkeit(materialIndex) {
    return Helpers.waehleGierFuerLesbarkeit(
      materialIndex,
      flaechenNormalen,
      textObenRichtung,
      kamera
    );
  }

  // Positioniert die Markierung über der oberen Fläche
  function aktualisiereMarkierung() {
    Helpers.aktualisiereMarkierung(
      markierung,
      wuerfel.quaternion,
      flaechenNormalen
    );
  }

  // Neue Animation mit zufälliger Achse und Dämpfung ("physikalischer")
  function physischesWürfeln() {
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

  // Startet die Würfelanimation
  function wuerfeln() {
    if (PhysikbasierteAnimation) {
      physischesWürfeln();
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

  // Anzeigeelement unter dem Würfel ein-/ausblenden und Text setzen
  function hinweis(nachricht, verstecken) {
    Helpers.hinweis(nachricht, verstecken, "hinweis");
  }

  // ELEMENT FÜR DEN WÜRFEL
  document.getElementById("wuerfelButton").addEventListener("click", wuerfeln);

  // Passt Renderergröße und Kamera an die aktuelle Canvasgröße an
  function passeRendererAnAnzeigeAn() {
    return Helpers.passeRendererAnAnzeigeAn(renderer, kamera, leinwandElement);
  }

  // Render-Loop: Größe anpassen, Markierung/Animation aktualisieren, Szene rendern
  function animiere() {
    requestAnimationFrame(animiere);
    passeRendererAnAnzeigeAn();

    aktualisiereMarkierung();

    if (animation) {
      const jetzt = performance.now();

      if (animation.phase === 0) {
        if (PhysikbasierteAnimation) {
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
        } else {
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
