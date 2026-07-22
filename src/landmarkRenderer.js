/**
 * landmarkRenderer.js
 * Draws hand landmark dots onto the overlay canvas each frame.
 * Separated from handTracker so rendering can be swapped or removed later.
 */

const DOT_RADIUS = 4;
const DOT_COLOR = '#00ff88';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Array} handsLandmarks  array of hands, each hand = 21 {x,y,z} objects
 */
export function drawLandmarks(canvas, handsLandmarks) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  for (const hand of handsLandmarks) {
    for (const lm of hand) {
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = DOT_COLOR;
      ctx.fill();
    }
  }
}
