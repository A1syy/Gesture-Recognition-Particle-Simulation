const HOLD_FRAMES = 20;

let lastGesture = "NONE";
let holdCounter = 0;

function fingerUp(lm, tip, pip) {
  return lm[tip].y < lm[pip].y;
}

function thumbUp(lm) {
  // Thumb is up if tip (4) is to the left/right of base (2) depending on hand
  return Math.abs(lm[4].x - lm[2].x) > 0.05;
}

function detectGesture(landmarks) {
  const thumb = thumbUp(landmarks);
  const index = fingerUp(landmarks, 8, 6);
  const middle = fingerUp(landmarks, 12, 10);
  const ring = fingerUp(landmarks, 16, 14);
  const pinky = fingerUp(landmarks, 20, 18);

  // Count fingers up (excluding thumb for clearer gestures)
  const count = [index, middle, ring, pinky].filter(Boolean).length;

  if (count === 1 && index && !middle && !ring && !pinky) return "ONE";
  if (count === 2 && index && middle && !ring && !pinky) return "TWO";
  if (count === 3 && index && middle && ring && !pinky) return "THREE";
  if (count === 4 && index && middle && ring && pinky) return "OPEN";
  return "NONE";
}

function getHeldGesture(current) {
  if (current === lastGesture && current !== "NONE") {
    holdCounter++;
    if (holdCounter >= HOLD_FRAMES) return current;
  } else {
    holdCounter = 0;
  }

  lastGesture = current;
  return null;
}
