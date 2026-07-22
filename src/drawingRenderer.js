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

/**
 * Redraw all completed strokes from scratch (used after undo).
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{points, brush}>} strokes
 */
export function redrawStrokes(canvas, strokes) {
  clearDrawingCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x * W, stroke.points[0].y * H);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * W, stroke.points[i].y * H);
    }
    ctx.strokeStyle = stroke.brush.color;
    ctx.lineWidth   = stroke.brush.lineWidth;
    ctx.lineCap     = stroke.brush.lineCap;
    ctx.lineJoin    = stroke.brush.lineJoin;
    ctx.stroke();
  }
}
