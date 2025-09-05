(function () {
  const THREE_NS = window.THREE;
  if (!THREE_NS) {
    console.error("THREE.js not loaded");
    return;
  }

  const defaultFaceTexts = [
    "Trink ein Glas Wasser.",
    "Mache einen kleinen Spaziergang.",
    "Was ist etwas wofür du dankbar bist?",
    "Schreibe einen Brief an deinen Lieblingsmensch.",
    "Berühre eine Pflanze.",
    "Worauf freust du dich diese Woche am meisten?",
  ];
  const defaultFaceColors = [
    "#C7017F",
    "#A2C617",
    "#FBBA00",
    "#C40C42",
    "#35B6B4",
    "#00AEEF",
  ];

  function getTextColor(bgHex) {
    try {
      const color = new THREE_NS.Color(bgHex);
      const r = color.r,
        g = color.g,
        b = color.b;
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luminance > 0.6 ? "#111111" : "#ffffff";
    } catch (e) {
      return "#111111";
    }
  }

  function createTextTexture(text, bg) {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const padding = 40;
    const maxWidth = size - padding * 2;
    const maxHeight = size - padding * 2;

    const wrapLines = (context, t, width) => {
      const words = String(t ?? "").split(/\s+/);
      const out = [];
      let current = "";
      for (let i = 0; i < words.length; i++) {
        const candidate = current ? current + " " + words[i] : words[i];
        if (context.measureText(candidate).width <= width) current = candidate;
        else {
          if (current) out.push(current);
          current = words[i];
        }
      }
      if (current) out.push(current);
      return out.length ? out : [""];
    };

    let fontSize = 220;
    let fittedLines = [String(text ?? "")];
    while (fontSize >= 16) {
      ctx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      const lines = wrapLines(ctx, text ?? "", maxWidth);
      const lineHeight = Math.ceil(fontSize * 1.15);
      const totalHeight = lines.length * lineHeight;
      let widest = 0;
      for (let i = 0; i < lines.length; i++)
        widest = Math.max(widest, ctx.measureText(lines[i]).width);
      if (totalHeight <= maxHeight && widest <= maxWidth) {
        fittedLines = lines;
        break;
      }
      fontSize -= 4;
    }

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = getTextColor(bg);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const lineHeight = Math.ceil(fontSize * 1.15);
    const totalHeight = fittedLines.length * lineHeight;
    let y = size / 2 - totalHeight / 2 + lineHeight / 2;
    for (let i = 0; i < fittedLines.length; i++) {
      ctx.fillText(fittedLines[i], size / 2, y);
      y += lineHeight;
    }

    const texture = new THREE_NS.CanvasTexture(canvas);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }

  // material order for BoxGeometry: [ +x, -x, +y, -y, +z, -z ]
  const slotToMaterialIndex = [2, 0, 4, 5, 1, 3];
  const materialIndexToSlot = [1, 4, 0, 5, 2, 3];
  const faceNormals = [
    new THREE_NS.Vector3(1, 0, 0),
    new THREE_NS.Vector3(-1, 0, 0),
    new THREE_NS.Vector3(0, 1, 0),
    new THREE_NS.Vector3(0, -1, 0),
    new THREE_NS.Vector3(0, 0, 1),
    new THREE_NS.Vector3(0, 0, -1),
  ];
  const faceTextUp = [
    new THREE_NS.Vector3(0, 1, 0),
    new THREE_NS.Vector3(0, 1, 0),
    new THREE_NS.Vector3(0, 0, -1),
    new THREE_NS.Vector3(0, 0, 1),
    new THREE_NS.Vector3(0, 1, 0),
    new THREE_NS.Vector3(0, 1, 0),
  ];

  const canvas = document.getElementById("scene");
  const renderer = new THREE_NS.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE_NS.Scene();
  scene.background = new THREE_NS.Color(0xf3f4f6);

  const camera = new THREE_NS.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(3.5, 3.0, 3.5);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE_NS.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  const dir = new THREE_NS.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);

  const diceGroup = new THREE_NS.Group();
  scene.add(diceGroup);

  const geometry = new THREE_NS.BoxGeometry(2, 2, 2);
  let materials = [];

  function buildMaterials(texts, colors) {
    // Dispose old
    if (materials.length) {
      materials.forEach((m) => {
        if (!m) return;
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
    const mats = new Array(6);
    for (let slot = 0; slot < 6; slot++) {
      const mi = slotToMaterialIndex[slot];
      mats[mi] = new THREE_NS.MeshBasicMaterial({
        map: createTextTexture(texts[slot], colors[slot]),
      });
    }
    materials = mats;
    if (mesh) mesh.material = materials;
  }

  const mesh = new THREE_NS.Mesh(geometry, materials);
  diceGroup.add(mesh);

  // Top-face indicator
  const indicator = new THREE_NS.Mesh(
    new THREE_NS.PlaneGeometry(2.04, 2.04),
    new THREE_NS.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
    })
  );
  mesh.add(indicator);
  const edgeGeom = new THREE_NS.EdgesGeometry(
    new THREE_NS.PlaneGeometry(2.04, 2.04)
  );
  const edges = new THREE_NS.LineSegments(
    edgeGeom,
    new THREE_NS.LineBasicMaterial({ color: 0x10b981 })
  );
  indicator.add(edges);

  // Controls setup
  const controlsContainer = document.getElementById("controls");
  const faceTexts = defaultFaceTexts.slice();
  const faceColors = defaultFaceColors.slice();

  function renderControls() {
    controlsContainer.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const row = document.createElement("div");
      row.className = "slot";
      const text = document.createElement("input");
      text.type = "text";
      text.value = faceTexts[i];
      text.placeholder = `Text for slot ${i + 1}`;
      text.addEventListener("input", () => {
        faceTexts[i] = text.value;
        const mi = slotToMaterialIndex[i];
        const m = materials[mi];
        if (m && m.map) m.map.dispose();
        m.map = createTextTexture(faceTexts[i], faceColors[i]);
        m.needsUpdate = true;
      });
      const color = document.createElement("input");
      color.type = "color";
      color.value = faceColors[i];
      color.addEventListener("input", () => {
        faceColors[i] = color.value;
        const mi = slotToMaterialIndex[i];
        const m = materials[mi];
        if (m && m.map) m.map.dispose();
        m.map = createTextTexture(faceTexts[i], faceColors[i]);
        m.needsUpdate = true;
      });
      row.appendChild(text);
      row.appendChild(color);
      controlsContainer.appendChild(row);
    }
  }

  renderControls();
  buildMaterials(faceTexts, faceColors);

  function getTopMaterialIndex() {
    const q = mesh.quaternion;
    let bestIdx = 2;
    let bestDot = -Infinity;
    const up = new THREE_NS.Vector3(0, 1, 0);
    for (let i = 0; i < 6; i++) {
      const worldNormal = faceNormals[i].clone().applyQuaternion(q);
      const dot = worldNormal.dot(up);
      if (dot > bestDot) {
        bestDot = dot;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function quaternionForTopFace(materialIndex, yawQuarterTurns) {
    const from = faceNormals[materialIndex];
    const to = new THREE_NS.Vector3(0, 1, 0);
    const align = new THREE_NS.Quaternion().setFromUnitVectors(from, to);
    const yaw = new THREE_NS.Quaternion().setFromAxisAngle(
      new THREE_NS.Vector3(0, 1, 0),
      (Math.PI / 2) * (yawQuarterTurns % 4)
    );
    return yaw.multiply(align);
  }

  function chooseYawForReadable(materialIndex) {
    let bestTurns = 0;
    let bestScore = -Infinity;
    const centerLocal = faceNormals[materialIndex].clone().multiplyScalar(1.0);
    for (let k = 0; k < 4; k++) {
      const q = quaternionForTopFace(materialIndex, k);
      const upLocal = faceTextUp[materialIndex];
      const centerWorld = centerLocal.clone().applyQuaternion(q);
      const upWorld = upLocal.clone().applyQuaternion(q).normalize();
      const p0 = centerWorld.clone();
      const p1 = centerWorld.clone().add(upWorld.clone().multiplyScalar(0.5));
      const p0N = p0.clone().project(camera);
      const p1N = p1.clone().project(camera);
      const dx = p1N.x - p0N.x;
      const dy = p1N.y - p0N.y;
      const score = dy - Math.abs(dx) * 0.25;
      if (score > bestScore) {
        bestScore = score;
        bestTurns = k;
      }
    }
    return bestTurns;
  }

  function updateIndicator() {
    const topIdx = getTopMaterialIndex();
    const localNormal = faceNormals[topIdx];
    const pos = localNormal.clone().multiplyScalar(1.02);
    indicator.position.copy(pos);
    const q = new THREE_NS.Quaternion().setFromUnitVectors(
      new THREE_NS.Vector3(0, 0, 1),
      localNormal
    );
    indicator.quaternion.copy(q);
  }

  let anim = null; // { phase, start, duration, from, to }
  function roll() {
    anim = {
      phase: 1,
      start: performance.now(),
      duration: 1200,
      from: mesh.quaternion.clone(),
      to: new THREE_NS.Quaternion().setFromEuler(
        new THREE_NS.Euler(
          Math.PI * 2 * (2 + Math.random() * 3),
          Math.PI * 2 * (2 + Math.random() * 3),
          Math.PI * 2 * (2 + Math.random() * 3),
          "XYZ"
        )
      ),
    };
    toast("", true);
  }

  function toast(message, hide) {
    const el = document.getElementById("toast");
    if (hide) {
      el.style.display = "none";
      el.textContent = "";
      return;
    }
    el.textContent = message;
    el.style.display = "block";
  }

  document.getElementById("rollBtn").addEventListener("click", roll);

  function resizeRendererToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    return needResize;
  }

  function animate() {
    requestAnimationFrame(animate);
    resizeRendererToDisplaySize();

    updateIndicator();

    if (anim) {
      const now = performance.now();
      const t = Math.min(1, (now - anim.start) / anim.duration);
      const eased = 1 - Math.pow(1 - t, 3);
      mesh.quaternion.slerpQuaternions(anim.from, anim.to, eased);
      if (t >= 1) {
        if (anim.phase === 1) {
          const topMatIdx = getTopMaterialIndex();
          const yawTurns = chooseYawForReadable(topMatIdx);
          anim = {
            phase: 2,
            start: performance.now(),
            duration: 450,
            from: mesh.quaternion.clone(),
            to: quaternionForTopFace(topMatIdx, yawTurns),
          };
        } else if (anim.phase === 2) {
          anim = null;
          const finalTop = getTopMaterialIndex();
          const slotIdx = materialIndexToSlot[finalTop];
          toast(faceTexts[slotIdx]);
        }
      }
    }

    renderer.render(scene, camera);
  }

  animate();
})();
