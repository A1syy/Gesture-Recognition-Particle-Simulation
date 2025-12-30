let rotation = 0;
let spherePoints3D = [];
let heartPoints3D = [];
let textPoints3D = [];
let starPoints3D = [];
let fireworksData = [];

// Reusable target arrays to avoid GC pressure
let sphereTargetsCache = [];
let heartTargetsCache = [];
let starTargetsCache = [];

function sphereTargets(count, cx, cy, r) {
  rotation += 0.01;

  // Generate fixed 3D points only once
  if (spherePoints3D.length !== count) {
    spherePoints3D = Array.from({ length: count }, () => {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const rad = Math.cbrt(Math.random()) * r;

      return {
        x: rad * Math.sin(phi) * Math.cos(theta),
        y: rad * Math.sin(phi) * Math.sin(theta),
        z: rad * Math.cos(phi),
      };
    });
    sphereTargetsCache = new Array(count);
    for (let i = 0; i < count; i++) {
      sphereTargetsCache[i] = { x: 0, y: 0 };
    }
  }

  // Pre-calculate trig values once
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  // Rotate and project existing points - reuse cache array
  for (let i = 0; i < spherePoints3D.length; i++) {
    const p = spherePoints3D[i];
    const rotX = p.x * cosR - p.z * sinR;
    const rotZ = p.x * sinR + p.z * cosR;
    const scale = 500 / (500 + rotZ);

    sphereTargetsCache[i].x = cx + rotX * scale;
    sphereTargetsCache[i].y = cy + p.y * scale;
  }

  return sphereTargetsCache;
}

function heartTargets(count, cx, cy, s) {
  rotation += 0.01;

  // Generate 2D heart shape with z=0
  if (heartPoints3D.length !== count) {
    heartPoints3D = Array.from({ length: count }, () => {
      const t = Math.random() * Math.PI * 2;
      return {
        x: 16 * Math.pow(Math.sin(t), 3),
        y:
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t),
        z: 0,
      };
    });
    heartTargetsCache = new Array(count);
    for (let i = 0; i < count; i++) {
      heartTargetsCache[i] = { x: 0, y: 0 };
    }
  }

  // Pre-calculate trig values once
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  // Reuse cache array
  for (let i = 0; i < heartPoints3D.length; i++) {
    const p = heartPoints3D[i];
    const rotX = p.x * cosR - p.z * sinR;
    const rotZ = p.x * sinR + p.z * cosR;
    const scale = 500 / (500 + rotZ);

    heartTargetsCache[i].x = cx + rotX * s * scale;
    heartTargetsCache[i].y = cy - p.y * s * scale;
  }

  return heartTargetsCache;
}

function starTargets(count, cx, cy, r) {
  rotation += 0.01;

  // Generate 2D star shape - particles along the edges
  if (starPoints3D.length !== count) {
    const points = 5;
    const outerRadius = r;
    const innerRadius = r * 0.4;

    const vertices = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      vertices.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }

    starPoints3D = Array.from({ length: count }, () => {
      const edgeIndex = Math.floor(Math.random() * vertices.length);
      const v1 = vertices[edgeIndex];
      const v2 = vertices[(edgeIndex + 1) % vertices.length];
      const t = Math.random();
      return {
        x: v1.x + (v2.x - v1.x) * t,
        y: v1.y + (v2.y - v1.y) * t,
        z: 0,
      };
    });
    starTargetsCache = new Array(count);
    for (let i = 0; i < count; i++) {
      starTargetsCache[i] = { x: 0, y: 0 };
    }
  }

  // Pre-calculate trig values once
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  // Reuse cache array
  for (let i = 0; i < starPoints3D.length; i++) {
    const p = starPoints3D[i];
    const rotX = p.x * cosR - p.z * sinR;
    const rotZ = p.x * sinR + p.z * cosR;
    const scale = 500 / (500 + rotZ);

    starTargetsCache[i].x = cx + rotX * scale;
    starTargetsCache[i].y = cy - p.y * scale;
  }

  return starTargetsCache;
}

// Fireworks cache
let fireworksTargetsCache = [];
let fireworksParticleData = []; // Pre-generated random values

function fireworksTargets(count, cx, cy) {
  const time = Date.now() * 0.001;

  // Cache responsive scale
  const screenScale = Math.min(window.innerWidth, window.innerHeight) / 1080;
  const respScale = Math.max(screenScale, 0.4);

  // Simplified: only 2 fireworks for better performance
  const numFireworks = 2;
  const cycleDuration = 5;

  // Initialize fireworks data once
  if (fireworksData.length === 0) {
    const launchX = window.innerWidth / 2;
    const launchY = window.innerHeight - 50 * respScale;
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;

    for (let i = 0; i < numFireworks; i++) {
      const minY = screenHeight * 0.25;
      const maxY = screenHeight * 0.45;
      const explosionY = minY + Math.random() * (maxY - minY);
      const marginX = screenWidth * 0.2;
      const explosionX = marginX + Math.random() * (screenWidth - marginX * 2);

      fireworksData.push({
        launchX,
        launchY,
        explosionX,
        explosionY,
        hue: Math.random() * 360,
        delay: i * 2.5,
      });
    }
  }

  const particlesPerFirework = Math.floor(count / numFireworks);

  // Initialize cache arrays once
  if (fireworksTargetsCache.length !== count) {
    fireworksTargetsCache = new Array(count);
    fireworksParticleData = new Array(count);
    
    for (let i = 0; i < count; i++) {
      fireworksTargetsCache[i] = { x: 0, y: 0, explosionIndex: 0, opacity: 0 };
      // Pre-generate random values
      fireworksParticleData[i] = {
        angle: Math.random() * Math.PI * 2,
        radius: 0.3 + Math.random() * 0.7,
        offset: (Math.random() - 0.5) * 50 * respScale,
      };
    }
  }

  // Update targets in place (no array creation)
  for (let fwIndex = 0; fwIndex < numFireworks; fwIndex++) {
    const firework = fireworksData[fwIndex];
    const adjustedTime = time - firework.delay;
    const localTime = adjustedTime % cycleDuration;
    const phase = localTime / cycleDuration;

    const startIdx = fwIndex * particlesPerFirework;
    const endIdx = Math.min(startIdx + particlesPerFirework, count);

    for (let i = startIdx; i < endIdx; i++) {
      const target = fireworksTargetsCache[i];
      const pData = fireworksParticleData[i];
      
      target.explosionIndex = fwIndex;

      if (localTime < 0 || phase >= 0.85) {
        // Hidden
        target.x = firework.launchX;
        target.y = firework.launchY;
        target.opacity = 0;
      } else if (phase < 0.2) {
        // Rise phase - simple line
        const t = phase / 0.2;
        target.x = firework.launchX + (firework.explosionX - firework.launchX) * t;
        target.y = firework.launchY + (firework.explosionY - firework.launchY) * t;
        target.opacity = 1;
      } else if (phase < 0.6) {
        // Explosion phase
        const t = (phase - 0.2) / 0.4;
        const expansion = Math.pow(t, 0.4);
        const maxDist = 400 * respScale;
        const dist = expansion * maxDist * pData.radius;
        
        target.x = firework.explosionX + Math.cos(pData.angle) * dist + pData.offset;
        target.y = firework.explosionY + Math.sin(pData.angle) * dist + pData.offset;
        target.opacity = 1;
      } else {
        // Fade phase
        const t = (phase - 0.6) / 0.25;
        const maxDist = 400 * respScale;
        
        target.x = firework.explosionX + Math.cos(pData.angle) * maxDist * pData.radius + pData.offset;
        target.y = firework.explosionY + Math.sin(pData.angle) * maxDist * pData.radius + pData.offset;
        target.opacity = Math.max(1 - t, 0);
      }
    }
  }

  return fireworksTargetsCache;
}

// Text cache
let textTargetsCache = [];

function textTargets(text, count, canvas, scale = 1.0) {
  // Generate fixed 2D points only once or when text changes
  if (textPoints3D.length !== count || textPoints3D.text !== text) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    const isSmallScreen = canvas.width < 768;
    const isVerySmallScreen = canvas.width < 480;

    let fontSize;
    if (isVerySmallScreen) {
      fontSize = canvas.width * 0.25;
    } else if (isSmallScreen) {
      fontSize = canvas.width * 0.2;
    } else {
      fontSize = Math.min(canvas.width * 0.08, 100);
    }
    fontSize = Math.max(fontSize, 70);

    tempCtx.fillStyle = "white";
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";

    if (isSmallScreen && text.includes(" ")) {
      const words = text.split(" ");
      if (isVerySmallScreen) {
        const lineHeight = fontSize * 1.0;
        const totalHeight = words.length * lineHeight;
        const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;
        for (let idx = 0; idx < words.length; idx++) {
          tempCtx.fillText(words[idx], tempCanvas.width / 2, startY + idx * lineHeight);
        }
      } else {
        const midPoint = Math.ceil(words.length / 2);
        const line1 = words.slice(0, midPoint).join(" ");
        const line2 = words.slice(midPoint).join(" ");
        const lineHeight = fontSize * 1.2;
        tempCtx.fillText(line1, tempCanvas.width / 2, tempCanvas.height / 2 - lineHeight / 2);
        tempCtx.fillText(line2, tempCanvas.width / 2, tempCanvas.height / 2 + lineHeight / 2);
      }
    } else {
      tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
    }

    const img = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
    const pts = [];

    // Sample pixels more efficiently
    const step = 4; // Skip pixels for performance
    for (let i = 0; i < img.length; i += 4 * step) {
      if (img[i + 3] > 128) {
        const p = i / 4;
        pts.push({ x: p % tempCanvas.width, y: Math.floor(p / tempCanvas.width) });
      }
    }

    textPoints3D = new Array(count);
    textTargetsCache = new Array(count);
    
    if (pts.length === 0) {
      for (let i = 0; i < count; i++) {
        textPoints3D[i] = { x: canvas.width / 2, y: canvas.height / 2 };
        textTargetsCache[i] = { x: canvas.width / 2, y: canvas.height / 2 };
      }
    } else {
      for (let i = 0; i < count; i++) {
        const pt = pts[Math.floor((i / count) * pts.length)];
        textPoints3D[i] = { x: pt.x, y: pt.y };
        textTargetsCache[i] = { x: 0, y: 0 };
      }
    }
    textPoints3D.text = text;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Update cache in place
  for (let i = 0; i < textPoints3D.length; i++) {
    const p = textPoints3D[i];
    textTargetsCache[i].x = cx + (p.x - cx) * scale;
    textTargetsCache[i].y = cy + (p.y - cy) * scale;
  }

  return textTargetsCache;
}
