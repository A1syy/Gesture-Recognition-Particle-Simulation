const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const debugCanvas = document.getElementById("debug");
const debugCtx = debugCanvas.getContext("2d");

const gestureText = document.getElementById("gesture");
const stateText = document.getElementById("state");

/* ---------- Loading Screen ---------- */

const loadingScreen = document.getElementById("loading-screen");
const progressBar = document.getElementById("progress-bar");
const loadingStatus = document.getElementById("loading-status");

let loadProgress = 0;
let mediaLoaded = false;
let cameraReady = false;
let handsModelReady = false;

function updateLoadingProgress(progress, status) {
  loadProgress = Math.min(progress, 100);
  if (progressBar) progressBar.style.width = loadProgress + "%";
  if (loadingStatus) loadingStatus.textContent = status;
}

function checkAllLoaded() {
  if (mediaLoaded && cameraReady && handsModelReady) {
    updateLoadingProgress(100, "Selesai!");
    setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add("hidden");
    }, 500);
  }
}

// Fallback: Hide loading screen after 15 seconds max (in case something fails)
setTimeout(() => {
  if (loadingScreen && !loadingScreen.classList.contains("hidden")) {
    updateLoadingProgress(100, "Memulai...");
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 300);
  }
}, 15000);

// Initial progress
updateLoadingProgress(10, "Memuat scripts...");

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
  if (typeof fireworksTargetsCache !== "undefined")
    fireworksTargetsCache.length = 0;
  if (typeof textTargetsCache !== "undefined") textTargetsCache.length = 0;

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

  // Check if mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    // Mobile: 1500 particles for better text visibility
    return 1500;
  }

  // Desktop
  if (pixels < 1000000) return 2000;
  if (pixels < 2000000) return 3000;
  return 4000;
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
      objectScale
    );
  }

  if (currentState === "TEXT_CUSTOM") {
    const displayText = customText || "Type here";
    targets = textTargets(
      displayText,
      ps.particles.length,
      canvas,
      objectScale
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

// Check if mobile for lighter settings
const isMobileDevice =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Mobile state management
let mobileHandTrackingEnabled = false;
let mobileCamera = null;
let mobileHands = null;
let touchClickHandler = null;

// Touch states for touch mode
const touchStates = [
  "SPHERE",
  "STAR",
  "LOVE",
  "TEXT_CUSTOM",
  "TEXT",
  "FIREWORKS",
];
let touchStateIndex = 0;

// Setup touch controls for mobile
function setupTouchControls() {
  canvas.style.pointerEvents = "auto";

  // Remove old handler if exists
  if (touchClickHandler) {
    canvas.removeEventListener("click", touchClickHandler);
  }

  touchClickHandler = () => {
    touchStateIndex = (touchStateIndex + 1) % touchStates.length;
    currentState = touchStates[touchStateIndex];
    stateText.innerText = `State: ${currentState}`;
    if (typeof needsTargetUpdate !== "undefined") needsTargetUpdate = true;
  };

  canvas.addEventListener("click", touchClickHandler);
}

// Remove touch controls
function removeTouchControls() {
  if (touchClickHandler) {
    canvas.removeEventListener("click", touchClickHandler);
    touchClickHandler = null;
  }
  canvas.style.pointerEvents = "none";
}

// Update instructions based on mode
function updateMobileInstructions(handTrackingOn) {
  const instructions = document.getElementById("instructions");
  if (!instructions) return;

  if (handTrackingOn) {
    instructions.innerHTML = `
      <h3>🎆 Mode Hand Tracking</h3>
      <ul style="padding-left:15px;margin:5px 0">
        <li>👋 Tanpa Tangan → Bola</li>
        <li>✊ Tutup → Text Custom</li>
        <li>☝️ 1 Jari → Bintang</li>
        <li>✌️ 2 Jari → Love</li>
        <li>🤟 3 Jari → Happy NY</li>
        <li>🖐️ Terbuka → Kembang Api</li>
      </ul>
    `;
  } else {
    instructions.innerHTML = `
      <h3>🎆 Mode Sentuh</h3>
      <p style="margin:5px 0">Tap layar untuk ganti efek:</p>
      <ul style="padding-left:15px;margin:5px 0">
        <li>Bola → Bintang → Love</li>
        <li>→ Text Custom → Happy NY</li>
        <li>→ Kembang Api</li>
      </ul>
    `;
  }
}

// Initialize MediaPipe for mobile (lighter settings)
function initMobileMediaPipe() {
  return new Promise((resolve, reject) => {
    const toggleBtn = document.getElementById("hand-toggle-btn");
    const cameraLoading = document.getElementById("camera-loading");
    
    if (toggleBtn) {
      toggleBtn.classList.add("loading");
      toggleBtn.querySelector(".toggle-text").textContent = "Loading...";
    }

    mobileHands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    // Light settings for mobile
    mobileHands.setOptions({
      maxNumHands: 1, // Only 1 hand on mobile
      modelComplexity: 0, // Lightest model
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

    mobileHands.onResults((results) => {
      if (!mobileHandTrackingEnabled) return;

      debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

      if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
      ) {
        currentState = "SPHERE";
        gestureText.innerText = "Gesture: NO HAND";
        stateText.innerText = "State: SPHERE";
        return;
      }

      // Draw landmarks
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

      // Detect gesture
      const gesture = detectGesture(results.multiHandLandmarks[0]);
      gestureText.innerText = "Gesture: " + gesture;

      if (gesture === "NONE") currentState = "TEXT_CUSTOM";
      if (gesture === "ONE") currentState = "STAR";
      if (gesture === "TWO") currentState = "LOVE";
      if (gesture === "THREE") currentState = "TEXT";
      if (gesture === "OPEN") currentState = "FIREWORKS";

      stateText.innerText = `State: ${currentState}`;
    });

    // Initialize camera with lower resolution for mobile
    if (cameraLoading) {
      cameraLoading.querySelector(".camera-text").textContent = "Menyalakan kamera...";
    }
    
    mobileCamera = new Camera(video, {
      onFrame: async () => {
        if (mobileHandTrackingEnabled && mobileHands) {
          await mobileHands.send({ image: video });
        }
      },
      width: 320, // Lower resolution for mobile
      height: 240,
    });

    mobileCamera
      .start()
      .then(() => {
        // Camera ready - hide loading and resolve
        if (cameraLoading) {
          cameraLoading.classList.add("hidden");
        }
        resolve();
      })
      .catch((err) => {
        console.error("Mobile camera error:", err);
        reject(err);
      });
  });
}

// Toggle hand tracking on mobile
async function toggleMobileHandTracking() {
  const toggleBtn = document.getElementById("hand-toggle-btn");
  const cameraBox = document.getElementById("camera-box");
  const cameraLoading = document.getElementById("camera-loading");

  if (mobileHandTrackingEnabled) {
    // Turn OFF hand tracking
    mobileHandTrackingEnabled = false;

    if (toggleBtn) {
      toggleBtn.classList.remove("active");
      toggleBtn.querySelector(".toggle-text").textContent =
        "Hand Tracking: OFF";
    }

    if (cameraBox) cameraBox.style.display = "none";

    // Re-enable touch controls
    setupTouchControls();
    updateMobileInstructions(false);

    gestureText.innerText = "Gesture: TAP MODE";
  } else {
    // Turn ON hand tracking
    try {
      // Show camera box with loading overlay
      if (cameraBox) cameraBox.style.display = "block";
      if (cameraLoading) {
        cameraLoading.classList.remove("hidden");
        cameraLoading.querySelector(".camera-text").textContent = "Memuat kamera...";
      }
      
      if (toggleBtn) {
        toggleBtn.classList.add("loading");
        toggleBtn.querySelector(".toggle-text").textContent = "Loading...";
      }

      // Initialize if not already
      if (!mobileHands) {
        if (cameraLoading) {
          cameraLoading.querySelector(".camera-text").textContent = "Memuat model AI...";
        }
        await initMobileMediaPipe();
      }

      mobileHandTrackingEnabled = true;

      // Hide loading overlay
      if (cameraLoading) {
        cameraLoading.classList.add("hidden");
      }

      if (toggleBtn) {
        toggleBtn.classList.remove("loading");
        toggleBtn.classList.add("active");
        toggleBtn.querySelector(".toggle-text").textContent =
          "Hand Tracking: ON";
      }

      // Disable touch controls
      removeTouchControls();
      updateMobileInstructions(true);

      gestureText.innerText = "Gesture: DETECTING...";
    } catch (err) {
      console.error("Failed to enable hand tracking:", err);
      
      // Hide loading and camera box on error
      if (cameraLoading) cameraLoading.classList.add("hidden");
      if (cameraBox) cameraBox.style.display = "none";
      
      if (toggleBtn) {
        toggleBtn.classList.remove("loading");
        toggleBtn.querySelector(".toggle-text").textContent =
          "Error - Tap to retry";
      }
      alert(
        "Gagal mengaktifkan hand tracking. Pastikan izin kamera diberikan."
      );
    }
  }
}

// On mobile
if (isMobileDevice) {
  updateLoadingProgress(50, "Mode sentuh aktif...");

  // Hide camera box initially on mobile
  const cameraBox = document.getElementById("camera-box");
  if (cameraBox) cameraBox.style.display = "none";

  // Setup toggle button
  const toggleBtn = document.getElementById("hand-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleMobileHandTracking);
  }

  // Start with touch controls
  setupTouchControls();
  updateMobileInstructions(false);

  // Mark as ready
  mediaLoaded = true;
  cameraReady = true;
  handsModelReady = true;
  updateLoadingProgress(100, "Siap!");
  checkAllLoaded();
} else {
  // Desktop: use MediaPipe with full settings
  updateLoadingProgress(30, "Memuat model MediaPipe...");

  const hands = new Hands({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  // Mark hands model as ready after first result
  let firstResultReceived = false;

  hands.onResults((results) => {
    // Mark model as ready on first result
    if (!firstResultReceived) {
      firstResultReceived = true;
      handsModelReady = true;
      updateLoadingProgress(90, "Model siap!");
      checkAllLoaded();
    }

    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

    if (
      !results.multiHandLandmarks ||
      results.multiHandLandmarks.length === 0
    ) {
      currentState = "SPHERE";
      gestureText.innerText = "Gesture: NO HAND";
      stateText.innerText = "State: SPHERE | Scale: 1.0x";
      return;
    }

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

    let gestureHandIndex = -1;
    let scaleHandIndex = -1;

    if (results.multiHandedness) {
      results.multiHandedness.forEach((handedness, index) => {
        const label = handedness.label;
        if (label === "Right") gestureHandIndex = index;
        else if (label === "Left") scaleHandIndex = index;
      });
    }

    if (gestureHandIndex === -1 && results.multiHandLandmarks.length > 0) {
      gestureHandIndex = 0;
    }

    if (gestureHandIndex !== -1) {
      const gesture = detectGesture(
        results.multiHandLandmarks[gestureHandIndex]
      );
      gestureText.innerText = "Gesture: " + gesture;

      if (gesture === "NONE") currentState = "TEXT_CUSTOM";
      if (gesture === "ONE") currentState = "STAR";
      if (gesture === "TWO") currentState = "LOVE";
      if (gesture === "THREE") currentState = "TEXT";
      if (gesture === "OPEN") currentState = "FIREWORKS";
    } else {
      currentState = "SPHERE";
    }

    if (scaleHandIndex !== -1 && currentState !== "FIREWORKS") {
      const thumb = results.multiHandLandmarks[scaleHandIndex][4];
      const index = results.multiHandLandmarks[scaleHandIndex][8];
      const distance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      objectScale = Math.min(Math.max(distance * 8, 0.3), 2.5);
    } else if (currentState !== "FIREWORKS") {
      objectScale = 1.0;
    }

    stateText.innerText = `State: ${currentState} | Scale: ${objectScale.toFixed(
      1
    )}x`;
  });

  updateLoadingProgress(50, "Mengakses kamera...");

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480,
  });

  camera
    .start()
    .then(() => {
      cameraReady = true;
      updateLoadingProgress(70, "Kamera siap, memuat model...");
      checkAllLoaded();
    })
    .catch((err) => {
      console.error("Camera error:", err);
      cameraReady = true;
      checkAllLoaded();
    });

  video.onloadedmetadata = () => {
    mediaLoaded = true;
    updateLoadingProgress(60, "Video siap...");
    resize();
    checkAllLoaded();
  };
}

/* ---------- Animation ---------- */

// Track if targets need update
let needsTargetUpdate = true;
let lastObjectScale = 1.0;

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Check if scale changed - need to update targets
  if (objectScale !== lastObjectScale) {
    needsTargetUpdate = true;
    lastObjectScale = objectScale;
  }

  // Update targets when needed (animated states or scale changed)
  const isAnimatedState =
    currentState === "FIREWORKS" ||
    currentState === "SPHERE" ||
    currentState === "STAR" ||
    currentState === "LOVE";

  if (isAnimatedState || needsTargetUpdate) {
    updateTargets();
    if (!isAnimatedState) needsTargetUpdate = false;
  }

  ps.update(ctx, currentState);

  if (currentState !== lastState) {
    lastState = currentState;
    needsTargetUpdate = true;
  }

  requestAnimationFrame(animate);
}

animate();
