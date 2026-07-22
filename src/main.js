/**
 * main.js — entry point
 * Orchestrates modules: camera, handTracker, drawingState, renderer, ui
 */

import { startCamera } from './camera.js';
import { initHandTracker, startDetectionLoop } from './handTracker.js';
import { drawLandmarks } from './landmarkRenderer.js';
import { setTipPosition, tipPositions } from './drawingState.js';

const INDEX_FINGERTIP = 8; // MediaPipe landmark index for index fingertip

const videoEl = document.getElementById('webcam');
const landmarkCanvas = document.getElementById('landmark-canvas');

async function main() {
  await startCamera(videoEl);

  landmarkCanvas.width = videoEl.videoWidth;
  landmarkCanvas.height = videoEl.videoHeight;

  await initHandTracker();

  startDetectionLoop(videoEl, (hands) => {
    // Update tip positions for all detected hands
    hands.forEach((hand, i) => {
      const tip = hand[INDEX_FINGERTIP];
      setTipPosition(i, { x: tip.x, y: tip.y });
    });
    // Clear positions for hands that disappeared
    for (const i of tipPositions.keys()) {
      if (i >= hands.length) setTipPosition(i, null);
    }

    drawLandmarks(landmarkCanvas, hands);
  });
}

main().catch((err) => {
  console.error(err);
  alert('Error: ' + err.message);
});



