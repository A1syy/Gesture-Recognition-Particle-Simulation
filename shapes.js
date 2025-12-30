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

function fireworksTargets(count, cx, cy) {
  const time = Date.now() * 0.001; // Slower for better visibility

  // Responsive scale - calculate ONCE at start (not in loops)
  const screenScale = Math.min(window.innerWidth, window.innerHeight) / 1080;
  const respScale = Math.max(screenScale, 0.4);

  // Initialize fireworks with pair-based timing (max 2 active at a time)
  const numFireworks = 4; // 2 pairs of fireworks
  const cycleDuration = 7; // Longer cycle for longer explosion

  if (fireworksData.length === 0) {
    fireworksData = [];

    // All fireworks launch from center bottom
    const launchX = window.innerWidth / 2;
    const launchY = window.innerHeight - 50 * respScale;

    for (let i = 0; i < numFireworks; i++) {
      // Random explosion position - based on screen height
      // Explosion should be in upper 20-60% of screen
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;

      // Target Y position: 20% to 50% from top of screen
      const minY = screenHeight * 0.2;
      const maxY = screenHeight * 0.5;
      const explosionY = minY + Math.random() * (maxY - minY);

      // X position: spread across middle 70% of screen
      const marginX = screenWidth * 0.15;
      const explosionX = marginX + Math.random() * (screenWidth - marginX * 2);

      // Pair-based timing: max 2 fireworks active at a time
      // Within each pair: 1.5s stagger
      // Between pairs: wait for previous pair to finish (7s cycle) + 2s wait
      const pairIndex = Math.floor(i / 2);
      const positionInPair = i % 2;
      const pairDelay = pairIndex * (cycleDuration + 2); // Wait for previous pair + 2s
      const withinPairDelay = positionInPair * 1.5; // 1.5s stagger within pair

      fireworksData.push({
        launchX: launchX,
        launchY: launchY,
        explosionX: explosionX,
        explosionY: explosionY,
        hue: Math.random() * 360,
        delay: pairDelay + withinPairDelay,
      });
    }
  }

  const targets = [];
  const particlesPerFirework = Math.floor(count / numFireworks);

  fireworksData.forEach((firework, fwIndex) => {
    // Calculate phase for this firework with delay
    const adjustedTime = time - firework.delay;
    const localTime = adjustedTime % cycleDuration;
    const phase = localTime / cycleDuration; // 0 to 1

    let centerX, centerY, expansionFactor, opacity;

    // Only 3 phases: hidden/wait, launch, explode+fade (no return animation)
    if (localTime < 0) {
      // Before start - hidden
      centerX = firework.launchX;
      centerY = firework.launchY;
      expansionFactor = 0.01;
      opacity = 0;
    } else if (phase < 0.25) {
      // Rise phase - slow launch with trail effect (25% = 1.75s)
      const t = phase / 0.25;
      centerX = firework.launchX + (firework.explosionX - firework.launchX) * t;
      centerY = firework.launchY + (firework.explosionY - firework.launchY) * t;
      expansionFactor = 0.02;
      opacity = 1;
    } else if (phase < 0.55) {
      // Explosion phase - LONGER dramatic expansion (30% = 2.1s)
      const t = (phase - 0.25) / 0.3;
      centerX = firework.explosionX;
      centerY = firework.explosionY;
      expansionFactor = Math.pow(t, 0.3); // Dramatic expansion
      opacity = 1;
    } else if (phase < 0.8) {
      // Fade phase - particles stay scattered and fade out (25% = 1.75s)
      const t = (phase - 0.55) / 0.25;
      centerX = firework.explosionX;
      centerY = firework.explosionY; // Stay at explosion point
      expansionFactor = 1.0; // Stay fully expanded
      opacity = Math.max(1 - t, 0); // Fade out completely
    } else {
      // Hidden - no return animation, just instant reset for next cycle
      centerX = firework.launchX;
      centerY = firework.launchY;
      expansionFactor = 0.01;
      opacity = 0; // Completely invisible - no animation back
    }

    // Add trail effect during rise phase - particles left behind
    if (localTime >= 0 && phase >= 0 && phase < 0.25) {
      // During rise, create trail by leaving particles behind at various positions
      const t = phase / 0.25;

      for (let i = 0; i < particlesPerFirework; i++) {
        // Determine if this particle is part of the current rocket or left behind in trail
        const particlePhase = i / particlesPerFirework; // 0 to 1

        // Particles are "dropped" progressively along the path
        // Earlier particles (lower index) stay at earlier positions
        let particleProgress;
        if (particlePhase < 0.2) {
          // 20% of particles form the current rocket head
          particleProgress = t;
        } else {
          // 80% of particles are trail - left behind at various points
          const trailIndex = (particlePhase - 0.2) / 0.8; // 0 to 1
          // Each trail particle stays at the position where it was "released"
          const releaseTime = trailIndex * t; // Released progressively
          particleProgress = releaseTime;
        }

        const particleX =
          firework.launchX +
          (firework.explosionX - firework.launchX) * particleProgress;
        const particleY =
          firework.launchY +
          (firework.explosionY - firework.launchY) * particleProgress;

        // Add small random spread (use pre-calculated respScale)
        const spreadAngle = Math.random() * Math.PI * 2;
        const spreadDist = Math.random() * 12 * respScale;

        // Trail particles fade based on how long they've been left behind
        const timeSinceRelease = t - particleProgress;
        // Gradual fade from back - creates visible trail gradient
        const trailOpacity =
          opacity * Math.max(0.2, 1 - timeSinceRelease * 2.0);

        targets.push({
          x: particleX + Math.cos(spreadAngle) * spreadDist,
          y: particleY + Math.sin(spreadAngle) * spreadDist,
          explosionIndex: fwIndex,
          opacity: trailOpacity,
          isExploding: false, // Solid color during launch
        });
      }
    } else if (localTime >= 0 && phase >= 0.25 && phase < 0.32) {
      // Convergence phase - ALL trail particles gather to ONE PERFECT POINT at explosion center
      const t = (phase - 0.25) / 0.07;

      for (let i = 0; i < particlesPerFirework; i++) {
        const particlePhase = i / particlesPerFirework;

        // Calculate where this particle was left during trail
        let trailProgress;
        if (particlePhase < 0.2) {
          trailProgress = 1.0; // Rocket head was at end
        } else {
          const trailIndex = (particlePhase - 0.2) / 0.8;
          trailProgress = trailIndex; // Where it was released
        }

        const trailX =
          firework.launchX +
          (firework.explosionX - firework.launchX) * trailProgress;
        const trailY =
          firework.launchY +
          (firework.explosionY - firework.launchY) * trailProgress;

        // Linear interpolation to exact center - ALL particles converge to SAME POINT
        const particleX = trailX + (firework.explosionX - trailX) * t;
        const particleY = trailY + (firework.explosionY - trailY) * t;

        // At t=1, ALL particles will be at EXACTLY (firework.explosionX, firework.explosionY)
        targets.push({
          x: particleX,
          y: particleY,
          explosionIndex: fwIndex,
          opacity: 1,
          isExploding: false, // Solid color during convergence
        });
      }
    } else if (localTime >= 0 && phase >= 0.32 && phase < 0.55) {
      // Explosion phase - LONGER dramatic expansion from exact center
      const t = (phase - 0.32) / 0.23;
      const currentExpansion = Math.pow(t, 0.3);

      for (let i = 0; i < particlesPerFirework; i++) {
        // Each particle gets unique random direction stored per particle
        const angle =
          (i / particlesPerFirework) * Math.PI * 2 + Math.random() * 0.2;
        const maxDistance = 900 * respScale;
        const randomRadius = Math.random();
        const distanceVariation = 0.3 + Math.random() * 1.5;
        const distance =
          currentExpansion * maxDistance * randomRadius * distanceVariation;

        const extraOffsetX = (Math.random() - 0.5) * 100 * respScale;
        const extraOffsetY = (Math.random() - 0.5) * 100 * respScale;

        targets.push({
          x: firework.explosionX + Math.cos(angle) * distance + extraOffsetX,
          y: firework.explosionY + Math.sin(angle) * distance + extraOffsetY,
          explosionIndex: fwIndex,
          opacity: 1,
          isExploding: true, // Flickering colors during explosion
        });
      }
    } else if (localTime >= 0 && phase >= 0.55 && phase < 0.8) {
      // Fade phase - particles stay scattered and fade out (longer)
      const t = (phase - 0.55) / 0.25;

      for (let i = 0; i < particlesPerFirework; i++) {
        const angle = Math.random() * Math.PI * 2;
        const maxDistance = 1500 * respScale;
        const randomRadius = Math.random();
        const distanceVariation = 0.3 + Math.random() * 1.5;
        const distance = maxDistance * randomRadius * distanceVariation;

        const extraOffsetX = (Math.random() - 0.5) * 100 * respScale;
        const extraOffsetY = (Math.random() - 0.5) * 100 * respScale;

        targets.push({
          x: firework.explosionX + Math.cos(angle) * distance + extraOffsetX,
          y: firework.explosionY + Math.sin(angle) * distance + extraOffsetY,
          explosionIndex: fwIndex,
          opacity: Math.max(1 - t, 0),
          isExploding: true, // Keep flickering during fade
        });
      }
    } else {
      // Hidden phase - push targets with opacity 0 so particles disappear
      for (let i = 0; i < particlesPerFirework; i++) {
        targets.push({
          x: firework.launchX,
          y: firework.launchY,
          explosionIndex: fwIndex,
          opacity: 0, // Completely invisible
        });
      }
    }
  });

  return targets;
}

function textTargets(text, count, canvas, scale = 1.0) {
  // Generate fixed 2D points only once or when text changes
  if (textPoints3D.length !== count || textPoints3D.text !== text) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Responsive font size - VERY large on small screens
    const isSmallScreen = canvas.width < 768;
    const isVerySmallScreen = canvas.width < 480;

    let fontSize;
    if (isVerySmallScreen) {
      fontSize = canvas.width * 0.25; // 25% of screen width on very small
    } else if (isSmallScreen) {
      fontSize = canvas.width * 0.2; // 20% of screen width on small
    } else {
      fontSize = Math.min(canvas.width * 0.08, 100); // 8% on desktop, max 100px
    }
    fontSize = Math.max(fontSize, 70); // Minimum 70px

    tempCtx.fillStyle = "white";
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";

    // On small screens, split text into multiple lines for better visibility
    if (isSmallScreen && text.includes(" ")) {
      const words = text.split(" ");
      // Split into 4 lines on very small screens (one word per line)
      if (isVerySmallScreen) {
        const lineHeight = fontSize * 1.0;
        const totalHeight = words.length * lineHeight;
        const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;
        words.forEach((word, idx) => {
          tempCtx.fillText(
            word,
            tempCanvas.width / 2,
            startY + idx * lineHeight
          );
        });
      } else {
        // 2 lines on medium small screens
        const midPoint = Math.ceil(words.length / 2);
        const line1 = words.slice(0, midPoint).join(" ");
        const line2 = words.slice(midPoint).join(" ");
        const lineHeight = fontSize * 1.2;
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
      tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
    }

    const img = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    ).data;
    const pts = [];

    for (let i = 0; i < img.length; i += 4) {
      if (img[i + 3] > 128) {
        const p = i / 4;
        pts.push({
          x: p % tempCanvas.width,
          y: Math.floor(p / tempCanvas.width),
        });
      }
    }

    if (pts.length === 0) {
      textPoints3D = Array(count).fill({
        x: canvas.width / 2,
        y: canvas.height / 2,
      });
    } else {
      textPoints3D = [];
      for (let i = 0; i < count; i++) {
        const pt = pts[Math.floor((i / count) * pts.length)];
        textPoints3D.push({
          x: pt.x,
          y: pt.y,
        });
      }
    }
    textPoints3D.text = text;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Apply scale to text points
  return textPoints3D.map((p) => {
    return {
      x: cx + (p.x - cx) * scale,
      y: cy + (p.y - cy) * scale,
    };
  });
}
