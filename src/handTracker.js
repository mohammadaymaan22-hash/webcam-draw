/**
 * handTracker.js
 * Loads MediaPipe Hand Landmarker and runs detection on each video frame.
 * Calls onResults(landmarksArray) every frame with an array of detected hands.
 * Each hand is an array of 21 {x, y, z} normalized landmark objects.
 */

import {
  HandLandmarker,
  FilesetResolver,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

let handLandmarker = null;

/**
 * Initialize the Hand Landmarker model.
 * Call once before starting the detection loop.
 */
export async function initHandTracker() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2, // ready for multi-hand/multiplayer
  });
}

/**
 * Start the per-frame detection loop.
 * @param {HTMLVideoElement} videoEl
 * @param {(hands: Array) => void} onResults  called every frame
 */
export function startDetectionLoop(videoEl, onResults) {
  let lastTimestamp = -1;

  function detect() {
    if (videoEl.readyState >= 2) {
      const now = performance.now();
      // MediaPipe requires strictly increasing timestamps
      if (now !== lastTimestamp) {
        const result = handLandmarker.detectForVideo(videoEl, now);
        lastTimestamp = now;
        onResults(result.landmarks ?? []);
      }
    }
    requestAnimationFrame(detect);
  }

  requestAnimationFrame(detect);
}
