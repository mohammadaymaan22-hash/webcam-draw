/**
 * main.js — entry point
 * Orchestrates modules: camera, handTracker, drawingState, renderer, ui
 */

import { startCamera } from './camera.js';
import { initHandTracker, startDetectionLoop } from './handTracker.js';
import { drawLandmarks } from './landmarkRenderer.js';

const videoEl = document.getElementById('webcam');
const landmarkCanvas = document.getElementById('landmark-canvas');

async function main() {
  await startCamera(videoEl);

  // Match canvas resolution to video
  landmarkCanvas.width = videoEl.videoWidth;
  landmarkCanvas.height = videoEl.videoHeight;

  await initHandTracker();

  startDetectionLoop(videoEl, (hands) => {
    drawLandmarks(landmarkCanvas, hands);
  });
}

main().catch((err) => {
  console.error(err);
  alert('Error: ' + err.message);
});


