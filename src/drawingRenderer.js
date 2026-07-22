/**
 * drawingRenderer.js
 * Renders strokes from drawingState onto the persistent drawing canvas.
 * Does NOT clear the canvas each frame — only the caller decides when to clear.
 *
 * Accepts a brushConfig so color/size are easy to change later (Step 8).
 */

const DEFAULT_BRUSH = {
  color: '#ff4d6d',
  lineWidth: 4,
  lineCap: 'round',
  lineJoin: 'round',
};

/**
 * Draw a single line segment onto the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number }} from  normalized coords
 * @param {{ x: number, y: number }} to    normalized coords
 * @param {object} brush
 */
export function drawSegment(ctx, from, to, brush = DEFAULT_BRUSH) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.beginPath();
  ctx.moveTo(from.x * W, from.y * H);
  ctx.lineTo(to.x * W, to.y * H);
  ctx.strokeStyle = brush.color;
  ctx.lineWidth = brush.lineWidth;
  ctx.lineCap = brush.lineCap;
  ctx.lineJoin = brush.lineJoin;
  ctx.stroke();
}

/**
 * Clear the drawing canvas entirely.
 * @param {HTMLCanvasElement} canvas
 */
export function clearDrawingCanvas(canvas) {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
