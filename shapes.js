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

  // Generate fixed 3D points only once with NORMALIZED radius (1.0)
  if (spherePoints3D.length !== count) {
    spherePoints3D = Array.from({ length: count }, () => {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const rad = Math.cbrt(Math.random()); // Normalized 0-1

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

  // Rotate and project existing points - APPLY SCALE (r) during render
  for (let i = 0; i < spherePoints3D.length; i++) {
    const p = spherePoints3D[i];
    const rotX = p.x * cosR - p.z * sinR;
    const rotZ = p.x * sinR + p.z * cosR;
    const perspScale = 500 / (500 + rotZ * r);

    sphereTargetsCache[i].x = cx + rotX * r * perspScale;
    sphereTargetsCache[i].y = cy + p.y * r * perspScale;
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

  // Generate 2D star shape with NORMALIZED radius (1.0)
  if (starPoints3D.length !== count) {
    const points = 5;
    const outerRadius = 1.0; // Normalized
    const innerRadius = 0.4; // Normalized

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

  // Reuse cache array - APPLY SCALE (r) during render
  for (let i = 0; i < starPoints3D.length; i++) {
    const p = starPoints3D[i];
    const rotX = p.x * cosR - p.z * sinR;
    const rotZ = p.x * sinR + p.z * cosR;
    const perspScale = 500 / (500 + rotZ * r);

    starTargetsCache[i].x = cx + rotX * r * perspScale;
    starTargetsCache[i].y = cy - p.y * r * perspScale;
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

  // 4 fireworks with trail effect
  const numFireworks = 4;
  const cycleDuration = 6;

  // Initialize fireworks data once
  if (fireworksData.length === 0) {
    const launchX = window.innerWidth / 2;
    const launchY = window.innerHeight - 50 * respScale;
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;

    for (let i = 0; i < numFireworks; i++) {
      const minY = screenHeight * 0.2;
      const maxY = screenHeight * 0.5;
      const explosionY = minY + Math.random() * (maxY - minY);
      const marginX = screenWidth * 0.15;
      const explosionX = marginX + Math.random() * (screenWidth - marginX * 2);

      fireworksData.push({
        launchX,
        launchY,
        explosionX,
        explosionY,
        hue: Math.random() * 360,
        delay: i * 1.5, // Staggered launch
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
      // Pre-generate random values for explosion
      fireworksParticleData[i] = {
        angle: Math.random() * Math.PI * 2,
        radius: 0.2 + Math.random() * 0.8,
        trailPos: Math.random(), // Position along trail (0-1)
      };
    }
  }

  // Update targets in place
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
      const particleIdx = i - startIdx;
      const particleRatio = particleIdx / particlesPerFirework;

      target.explosionIndex = fwIndex;

      if (localTime < 0 || phase >= 0.9) {
        // Hidden
        target.x = firework.launchX;
        target.y = firework.launchY;
        target.opacity = 0;
      } else if (phase < 0.25) {
        // Rise phase WITH TRAIL
        const t = phase / 0.25;

        // Trail effect: particles spread along the path
        let particleProgress;
        if (particleRatio < 0.15) {
          // 15% particles are rocket head
          particleProgress = t;
        } else {
          // 85% particles form trail behind
          const trailIdx = (particleRatio - 0.15) / 0.85;
          particleProgress = Math.max(0, t - trailIdx * t * 0.8);
        }

        target.x =
          firework.launchX +
          (firework.explosionX - firework.launchX) * particleProgress;
        target.y =
          firework.launchY +
          (firework.explosionY - firework.launchY) * particleProgress;

        // Trail fade effect
        const distFromHead = t - particleProgress;
        target.opacity = Math.max(0.3, 1 - distFromHead * 3);
      } else if (phase < 0.3) {
        // Convergence phase - all particles gather to explosion point
        const t = (phase - 0.25) / 0.05;
        const prevX =
          firework.launchX +
          (firework.explosionX - firework.launchX) * pData.trailPos;
        const prevY =
          firework.launchY +
          (firework.explosionY - firework.launchY) * pData.trailPos;

        target.x = prevX + (firework.explosionX - prevX) * t;
        target.y = prevY + (firework.explosionY - prevY) * t;
        target.opacity = 1;
      } else if (phase < 0.65) {
        // Explosion phase - dramatic expansion
        const t = (phase - 0.3) / 0.35;
        const expansion = Math.pow(t, 0.35);
        const maxDist = 600 * respScale;
        const dist = expansion * maxDist * pData.radius;

        target.x = firework.explosionX + Math.cos(pData.angle) * dist;
        target.y = firework.explosionY + Math.sin(pData.angle) * dist;
        target.opacity = 1;
      } else {
        // Fade phase - particles stay and fade
        const t = (phase - 0.65) / 0.25;
        const maxDist = 600 * respScale;

        target.x =
          firework.explosionX + Math.cos(pData.angle) * maxDist * pData.radius;
        target.y =
          firework.explosionY + Math.sin(pData.angle) * maxDist * pData.radius;
        target.opacity = Math.max(1 - t * 1.2, 0);
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
      fontSize = canvas.width * 0.2; // 20% on very small
    } else if (isSmallScreen) {
      fontSize = canvas.width * 0.15; // 15% on small
    } else {
      // Desktop: 10% of screen width, max 150px
      fontSize = Math.min(canvas.width * 0.1, 150);
    }
    fontSize = Math.max(fontSize, 50);

    tempCtx.fillStyle = "white";
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";

    // Check if text is too wide - if so, split into lines
    const textWidth = tempCtx.measureText(text).width;
    const maxWidth = canvas.width * 0.85; // Max 85% of screen width

    if (text.includes(" ") && textWidth > maxWidth) {
      const words = text.split(" ");

      if (isVerySmallScreen) {
        // One word per line on very small screens
        const lineHeight = fontSize * 1.1;
        const totalHeight = words.length * lineHeight;
        const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;
        for (let idx = 0; idx < words.length; idx++) {
          tempCtx.fillText(
            words[idx],
            tempCanvas.width / 2,
            startY + idx * lineHeight
          );
        }
      } else {
        // Split into 2 lines
        const midPoint = Math.ceil(words.length / 2);
        const line1 = words.slice(0, midPoint).join(" ");
        const line2 = words.slice(midPoint).join(" ");
        const lineHeight = fontSize * 1.3;
        tempCtx.fillText(
          line1,
          tempCanvas.width / 2,
          tempCanvas.height / 2 - lineHeight / 2
        );
        tempCtx.fillText(
          line2,
          tempCanvas.width / 2,
          tempCanvas.height / 2 + lineHeight / 2
        );
      }
    } else {
      // Single line - fits on screen
      tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
    }

    const img = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    ).data;
    const pts = [];

    // Sample pixels more efficiently
    const step = 4; // Skip pixels for performance
    for (let i = 0; i < img.length; i += 4 * step) {
      if (img[i + 3] > 128) {
        const p = i / 4;
        pts.push({
          x: p % tempCanvas.width,
          y: Math.floor(p / tempCanvas.width),
        });
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
