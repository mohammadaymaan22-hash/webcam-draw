/**
 * main.js — entry point
 * Orchestrates modules: camera, handTracker, drawingState, renderer, ui
 */

import { startCamera } from './camera.js';
import { initHandTracker, startDetectionLoop } from './handTracker.js';
import { drawLandmarks } from './landmarkRenderer.js';
import { setTipPosition, tipPositions, completedStrokes,
         beginStroke, addStrokePoint, endStroke, undoLastStroke, clearAll } from './drawingState.js';
import { drawSegment, clearDrawingCanvas, redrawStrokes } from './drawingRenderer.js';
import { detectGesture } from './gestureDetector.js';
import { Smoother } from './smoother.js';

const INDEX_FINGERTIP = 8;

const videoEl        = document.getElementById('webcam');
const landmarkCanvas = document.getElementById('landmark-canvas');
const drawingCanvas  = document.getElementById('drawing-canvas');

// Track previous tip position per hand for line segments
const prevTip      = new Map();
const smoothers    = new Map();
const prevGestures = new Map(); // track gesture transitions for stroke begin/end
let   undoCooldown = false;     // prevents rapid-fire undo

// Gesture debounce
// ENTER: frames needed to start a new gesture
// EXIT:  frames of a different gesture needed to leave current stable gesture
//        (higher = more tolerant of single-frame dropouts during fast movement)
const ENTER_FRAMES = 4;
const EXIT_FRAMES  = 6;
const gestureState = new Map(); // Map<handIndex, {stable, pending, count}>

function getStableGesture(handIndex, raw) {
  const s = gestureState.get(handIndex) ?? { stable: 'none', pending: null, count: 0 };

  if (raw === s.stable) {
    // Reinforce current stable state — wipe any pending transition
    s.pending = null;
    s.count   = 0;
  } else {
    // Something different from stable is being seen
    if (raw === s.pending) {
      s.count++;
      const threshold = s.stable === 'none' ? ENTER_FRAMES : EXIT_FRAMES;
      if (s.count >= threshold) {
        s.stable  = raw;
        s.pending = null;
        s.count   = 0;
      }
    } else {
      // New candidate — start fresh
      s.pending = raw;
      s.count   = 1;
    }
  }

  gestureState.set(handIndex, s);
  return s.stable;
}

async function main() {
  await startCamera(videoEl);

  landmarkCanvas.width  = videoEl.videoWidth;
  landmarkCanvas.height = videoEl.videoHeight;
  drawingCanvas.width   = videoEl.videoWidth;
  drawingCanvas.height  = videoEl.videoHeight;

  const drawCtx   = drawingCanvas.getContext('2d');
  const hintEl    = document.getElementById('gesture-hint');
  hintEl.textContent = '✋ Palm = clear  |  🤙 Pinky = undo';
  const CLEAR_HOLD_MS = 1500;
  let   clearHoldStart = null;

  // Brush config — passed to drawSegment each frame
  const brush = { color: '#ff4d6d', lineWidth: 4, lineCap: 'round', lineJoin: 'round' };

  // Color swatches
  document.querySelectorAll('.swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      brush.color = btn.dataset.color;
    });
  });

  // Custom color picker
  const customColorEl = document.getElementById('custom-color');
  customColorEl.addEventListener('input', () => {
    document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
    brush.color = customColorEl.value;
  });

  // Brush size slider
  const sizeSlider = document.getElementById('brush-size');
  const sizeVal    = document.getElementById('size-val');
  sizeSlider.addEventListener('input', () => {
    brush.lineWidth = Number(sizeSlider.value);
    sizeVal.textContent = sizeSlider.value;
  });

  await initHandTracker();

  startDetectionLoop(videoEl, (hands) => {
    // Compute stable gesture ONCE per hand per frame
    const gestures = new Map();
    hands.forEach((hand, i) => {
      gestures.set(i, getStableGesture(i, detectGesture(hand)));
    });

    // Update tip positions (with EMA smoothing)
    hands.forEach((hand, i) => {
      if (!smoothers.has(i)) smoothers.set(i, new Smoother(0.5));
      const raw = hand[INDEX_FINGERTIP];
      const smoothed = smoothers.get(i).update({ x: raw.x, y: raw.y });
      setTipPosition(i, smoothed);
    });
    for (const i of tipPositions.keys()) {
      if (i >= hands.length) {
        setTipPosition(i, null);
        prevTip.delete(i);
        smoothers.get(i)?.reset();
        gestureState.delete(i);
      }
    }

    // Draw line segments + track stroke lifecycle
    hands.forEach((hand, i) => {
      const cur      = tipPositions.get(i);
      const prev     = prevTip.get(i);
      const gesture  = gestures.get(i);
      const prevG    = prevGestures.get(i) ?? 'none';

      // Stroke transitions
      if (gesture === 'draw' && prevG !== 'draw') beginStroke(i, brush);
      if (gesture !== 'draw' && prevG === 'draw') endStroke(i);

      if (gesture === 'draw' && cur && prev) {
        drawSegment(drawCtx, prev, cur, brush);
        addStrokePoint(i, cur);
      }

      prevTip.set(i, gesture === 'draw' ? { ...cur } : null);
      prevGestures.set(i, gesture);
    });

    drawLandmarks(landmarkCanvas, hands);

    // Undo gesture: pinky only up
    const anyUndo = hands.some((_, i) => gestures.get(i) === 'undo');
    if (anyUndo && !undoCooldown) {
      undoLastStroke();
      redrawStrokes(drawingCanvas, completedStrokes);
      undoCooldown = true;
      setTimeout(() => { undoCooldown = false; }, 800);
    }

    // Hold-to-clear: open palm held for CLEAR_HOLD_MS
    const anyPalm = hands.some((_, i) => gestures.get(i) === 'open_palm');
    if (anyPalm) {
      if (!clearHoldStart) clearHoldStart = performance.now();
      const held = performance.now() - clearHoldStart;
      const pct  = Math.min(100, (held / CLEAR_HOLD_MS) * 100).toFixed(0);
      hintEl.textContent = `✋ Clearing… ${pct}%`;
      hintEl.classList.add('clearing');
      if (held >= CLEAR_HOLD_MS) {
        clearDrawingCanvas(drawingCanvas);
        clearAll();
        prevTip.clear();
        smoothers.forEach(s => s.reset());
        clearHoldStart = null;
        hintEl.textContent = '✋ Open palm to clear';
        hintEl.classList.remove('clearing');
      }
    } else {
      clearHoldStart = null;
      hintEl.textContent = '✋ Open palm to clear';
      hintEl.classList.remove('clearing');
    }
  });
}

main().catch((err) => {
  console.error(err);
  alert('Error: ' + err.message);
});




