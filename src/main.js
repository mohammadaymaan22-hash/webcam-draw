/**
 * main.js — entry point
 * Orchestrates modules: camera, handTracker, drawingState, renderer, ui
 */

import { startCamera } from './camera.js';

const videoEl = document.getElementById('webcam');

startCamera(videoEl).catch((err) => {
  console.error('Camera failed:', err);
  alert('Could not access webcam. Make sure you allow camera permission and are on localhost or HTTPS.');
});

