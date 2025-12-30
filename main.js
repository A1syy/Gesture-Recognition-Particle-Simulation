const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const debugCanvas = document.getElementById("debug");
const debugCtx = debugCanvas.getContext("2d");

const gestureText = document.getElementById("gesture");
const stateText = document.getElementById("state");

/* ---------- Responsive Scale ---------- */

// Base reference: 1920x1080 desktop
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

function getResponsiveScale() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Use the smaller ratio to ensure content fits
  const scaleW = w / BASE_WIDTH;
  const scaleH = h / BASE_HEIGHT;
  // Minimum scale to prevent things from getting too small
  return Math.max(Math.min(scaleW, scaleH), 0.4);
}

function getParticleSize() {
  const scale = getResponsiveScale();
  // Particle size: 2-4px based on screen size
  return Math.max(2, Math.round(3 * scale));
}

/* ---------- Resize ---------- */

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  debugCanvas.width = video.videoWidth || 220;
  debugCanvas.height = video.videoHeight || 160;

  // Reset cached scale on resize
  cachedResponsiveScale = null;
  cachedParticleSize = null;

  // Reset fireworks data on resize so positions recalculate
  if (typeof fireworksData !== "undefined") {
    fireworksData.length = 0;
  }

  // Reset text points so font size recalculates
  if (typeof textPoints3D !== "undefined") {
    textPoints3D.length = 0;
  }

  // Reset shape caches on resize
  if (typeof spherePoints3D !== "undefined") spherePoints3D.length = 0;
  if (typeof heartPoints3D !== "undefined") heartPoints3D.length = 0;
  if (typeof starPoints3D !== "undefined") starPoints3D.length = 0;

  // Force target update after resize
  if (typeof needsTargetUpdate !== "undefined") needsTargetUpdate = true;

  // Update particle targets when resizing
  if (typeof ps !== "undefined") updateTargets();
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => {
  setTimeout(resize, 100);
});

/* ---------- Particle ---------- */

let currentState = "SPHERE";
let lastState = "";
let objectScale = 1.0; // Scale factor for objects
let customText = ""; // User's custom text for TEXT_CUSTOM state

// Cache responsive scale (only update on resize)
let cachedResponsiveScale = null;
let cachedParticleSize = null;

function getCachedResponsiveScale() {
  if (cachedResponsiveScale === null) {
    cachedResponsiveScale = getResponsiveScale();
  }
  return cachedResponsiveScale;
}

function getCachedParticleSize() {
  if (cachedParticleSize === null) {
    cachedParticleSize = getParticleSize();
  }
  return cachedParticleSize;
}

// Determine particle count based on screen size (less particles = better FPS on small devices)
function getParticleCount() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pixels = w * h;

  if (pixels < 300000) return 1000; // Very small screens (phones)
  if (pixels < 500000) return 1500; // Small screens
  if (pixels < 1000000) return 2500; // Medium-small screens
  if (pixels < 2000000) return 3500; // Medium screens
  return 5000; // Large screens
}

// Initialize canvas size first
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particleCount = getParticleCount();
const ps = new ParticleSystem(particleCount, canvas.width, canvas.height);

// Handle text input (defer to after DOM ready)
document.addEventListener("DOMContentLoaded", () => {
  const customTextInput = document.getElementById("custom-text-input");
  const charCount = document.getElementById("char-count");

  if (customTextInput) {
    customTextInput.addEventListener("input", (e) => {
      customText = e.target.value.slice(0, 20);
      if (charCount) charCount.textContent = `${customText.length}/20`;
      // Reset text points to regenerate with new text
      if (typeof textPoints3D !== "undefined") {
        textPoints3D.length = 0;
      }
      // Force target update
      if (typeof needsTargetUpdate !== "undefined") {
        needsTargetUpdate = true;
      }
    });
  }
});

function updateTargets() {
  let targets;
  const responsiveScale = getCachedResponsiveScale();

  if (currentState === "SPHERE") {
    targets = sphereTargets(
      ps.particles.length,
      canvas.width / 2,
      canvas.height / 2,
      100 * objectScale * responsiveScale
    );
  }

  if (currentState === "STAR") {
    targets = starTargets(
      ps.particles.length,
      canvas.width / 2,
      canvas.height / 2,
      150 * objectScale * responsiveScale
    );
  }

  if (currentState === "LOVE") {
    targets = heartTargets(
      ps.particles.length,
      canvas.width / 2,
      canvas.height / 2,
      15 * objectScale * responsiveScale
    );
  }

  if (currentState === "TEXT") {
    targets = textTargets(
      "Happy new year 2026",
      ps.particles.length,
      canvas,
      objectScale * responsiveScale
    );
  }

  if (currentState === "TEXT_CUSTOM") {
    const displayText = customText || "Type here";
    targets = textTargets(
      displayText,
      ps.particles.length,
      canvas,
      objectScale * responsiveScale
    );
  }

  if (currentState === "FIREWORKS") {
    // Always recalculate for animation
    targets = fireworksTargets(
      ps.particles.length,
      canvas.width / 2,
      canvas.height / 2
    );
  }

  ps.setTargets(targets);
}

updateTargets();

/* ---------- MediaPipe ---------- */

const hands = new Hands({
  locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    // Reset to default sphere when no hands detected
    currentState = "SPHERE";
    gestureText.innerText = "Gesture: NO HAND";
    stateText.innerText = "State: SPHERE | Scale: 1.0x";
    return;
  }

  /* DRAW DEBUG LANDMARKS FOR ALL HANDS */
  results.multiHandLandmarks.forEach((landmarks) => {
    drawConnectors(debugCtx, landmarks, HAND_CONNECTIONS, {
      color: "#00FFAA",
      lineWidth: 2,
    });

    drawLandmarks(debugCtx, landmarks, {
      color: "#FF5555",
      radius: 2,
    });
  });

  /* SEPARATE HANDS BY ROLE */
  let gestureHandIndex = -1;
  let scaleHandIndex = -1;

  // Find right hand for gesture control, left hand for scale control
  if (results.multiHandedness) {
    results.multiHandedness.forEach((handedness, index) => {
      const label = handedness.label; // "Left" or "Right"
      if (label === "Right") {
        gestureHandIndex = index;
      } else if (label === "Left") {
        scaleHandIndex = index;
      }
    });
  }

  // Fallback: if only one hand, use it for gesture
  if (gestureHandIndex === -1 && results.multiHandLandmarks.length > 0) {
    gestureHandIndex = 0;
  }

  /* GESTURE LOGIC - ONLY FROM GESTURE HAND */
  if (gestureHandIndex !== -1) {
    const gesture = detectGesture(results.multiHandLandmarks[gestureHandIndex]);
    gestureText.innerText = "Gesture: " + gesture;

    if (gesture === "NONE") currentState = "TEXT_CUSTOM";
    if (gesture === "ONE") currentState = "STAR";
    if (gesture === "TWO") currentState = "LOVE";
    if (gesture === "THREE") currentState = "TEXT"; // Happy New Year
    if (gesture === "OPEN") currentState = "FIREWORKS";
  } else {
    // Default to sphere when no hand detected
    currentState = "SPHERE";
  }

  /* SCALE CONTROL - ONLY FROM SCALE HAND */
  if (scaleHandIndex !== -1 && currentState !== "FIREWORKS") {
    // Pinch zoom: Calculate distance between thumb tip and index finger tip
    // Disabled for fireworks
    const thumb = results.multiHandLandmarks[scaleHandIndex][4]; // Thumb tip
    const index = results.multiHandLandmarks[scaleHandIndex][8]; // Index finger tip

    const distance = Math.sqrt(
      Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
    );

    // Map pinch distance to scale (0.01 to 0.3 = 0.3x to 2.5x scale)
    objectScale = Math.min(Math.max(distance * 8, 0.3), 2.5);
  } else if (currentState !== "FIREWORKS") {
    // Reset to default scale when second hand is not detected (except for fireworks)
    objectScale = 1.0;
  }

  // Always show current scale
  stateText.innerText = `State: ${currentState} | Scale: ${objectScale.toFixed(
    1
  )}x`;
});

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});

camera.start();

video.onloadedmetadata = resize;

/* ---------- Animation ---------- */

// Track if targets need update
let needsTargetUpdate = true;

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Only update targets when needed for better performance
  // FIREWORKS, SPHERE, STAR, LOVE need every frame (animation)
  // TEXT states only need update on state change
  const isAnimatedState =
    currentState === "FIREWORKS" ||
    currentState === "SPHERE" ||
    currentState === "STAR" ||
    currentState === "LOVE";

  if (isAnimatedState || needsTargetUpdate) {
    updateTargets();
    if (!isAnimatedState) needsTargetUpdate = false;
  }

  // Pass current state for color selection
  ps.update(ctx, currentState);

  if (currentState !== lastState) {
    lastState = currentState;
    needsTargetUpdate = true; // Force update on state change
  }

  requestAnimationFrame(animate);
}

animate();
