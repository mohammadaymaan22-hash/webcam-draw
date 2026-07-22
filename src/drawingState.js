/**
 * drawingState.js
 * Central store for all drawing-related state.
 */

export const tipPositions     = new Map(); // Map<handIndex, {x,y}>
export const completedStrokes = [];        // Array<{points, brush}>
const activeStrokes           = new Map(); // Map<handIndex, {points, brush}>

export function setTipPosition(handIndex, pos) {
  if (pos === null) tipPositions.delete(handIndex);
  else              tipPositions.set(handIndex, pos);
}

/** Call when a hand transitions INTO draw gesture */
export function beginStroke(handIndex, brush) {
  activeStrokes.set(handIndex, { points: [], brush: { ...brush } });
}

/** Record a point into the active stroke */
export function addStrokePoint(handIndex, point) {
  activeStrokes.get(handIndex)?.points.push({ ...point });
}

/** Call when a hand transitions OUT OF draw gesture */
export function endStroke(handIndex) {
  const s = activeStrokes.get(handIndex);
  if (s && s.points.length > 1) completedStrokes.push(s);
  activeStrokes.delete(handIndex);
}

/** Remove the last completed stroke (undo) */
export function undoLastStroke() {
  completedStrokes.pop();
}

export function clearAll() {
  completedStrokes.length = 0;
  activeStrokes.clear();
  tipPositions.clear();
}

