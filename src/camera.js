/**
 * camera.js
 * Handles webcam access and streams video into a <video> element.
 * Exported as a module so other components (e.g. handTracker) can
 * reference the video element without coupling to getUserMedia logic.
 */

/**
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<HTMLVideoElement>} resolves when video is playing
 */
export async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode: 'user' },
    audio: false,
  });

  videoEl.srcObject = stream;

  return new Promise((resolve) => {
    videoEl.onloadedmetadata = () => {
      videoEl.play();
      resolve(videoEl);
    };
  });
}
