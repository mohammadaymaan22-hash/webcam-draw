/**
 * main.js — entry point
 * Orchestrates modules: camera, handTracker, drawingState, renderer, ui
 */

import { startCamera } from './camera.js';
import { initHandTracker, startDetectionLoop } from './handTracker.js';
import { drawLandmarks } from './landmarkRenderer.js';
import { setTipPosition, tipPositions } from './drawingState.js';
import { drawSegment, clearDrawingCanvas } from './drawingRenderer.js';
import { detectGesture } from './gestureDetector.js';
import { Smoother } from './smoother.js';

const INDEX_FINGERTIP = 8;

const videoEl        = document.getElementById('webcam');
const landmarkCanvas = document.getElementById('landmark-canvas');
const drawingCanvas  = document.getElementById('drawing-canvas');

// Track previous tip position per hand for line segments
const prevTip    = new Map(); // Map<handIndex, {x,y}>
const smoothers  = new Map(); // Map<handIndex, Smoother>

async function main() {
  await startCamera(videoEl);

  landmarkCanvas.width  = videoEl.videoWidth;
  landmarkCanvas.height = videoEl.videoHeight;
  drawingCanvas.width   = videoEl.videoWidth;
  drawingCanvas.height  = videoEl.videoHeight;

  const drawCtx   = drawingCanvas.getContext('2d');
  const hintEl    = document.getElementById('gesture-hint');
  const CLEAR_HOLD_MS = 1500; // hold open palm this long to clear
  let   clearHoldStart = null; // timestamp when open_palm gesture started

  await initHandTracker();

  startDetectionLoop(videoEl, (hands) => {
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
      }
    }

    // Draw line segments for each detected hand
    hands.forEach((hand, i) => {
      const cur     = tipPositions.get(i);
      const prev    = prevTip.get(i);
      const gesture = detectGesture(hand);

      if (gesture === 'draw' && cur && prev) {
        drawSegment(drawCtx, prev, cur);
      }

      // Only carry prev forward when drawing — avoids jump on pen-down
      prevTip.set(i, gesture === 'draw' ? { ...cur } : null);
    });

    drawLandmarks(landmarkCanvas, hands);

    // Hold-to-clear: open palm held for CLEAR_HOLD_MS
    const anyPalm = hands.some((_, i) => detectGesture(hands[i]) === 'open_palm');
    if (anyPalm) {
      if (!clearHoldStart) clearHoldStart = performance.now();
      const held = performance.now() - clearHoldStart;
      const pct  = Math.min(100, (held / CLEAR_HOLD_MS) * 100).toFixed(0);
      hintEl.textContent = `✋ Clearing… ${pct}%`;
      hintEl.classList.add('clearing');
      if (held >= CLEAR_HOLD_MS) {
        clearDrawingCanvas(drawingCanvas);
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




