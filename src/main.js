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

  const drawCtx = drawingCanvas.getContext('2d');

  // Clear button
  document.getElementById('btn-clear').addEventListener('click', () => {
    clearDrawingCanvas(drawingCanvas);
    prevTip.clear();
    smoothers.forEach(s => s.reset());
  });

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
  });
}

main().catch((err) => {
  console.error(err);
  alert('Error: ' + err.message);
});




