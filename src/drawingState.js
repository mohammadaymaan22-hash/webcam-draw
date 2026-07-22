/**
 * drawingState.js
 * Central store for all drawing-related state.
 * Keeping this separate from rendering means it can later be shared
 * over a network (multiplayer) without touching render code.
 *
 * State is keyed by handIndex so multi-hand / multi-player is natural.
 */

// Map<handIndex, { x, y }> — normalized (0-1) fingertip positions
export const tipPositions = new Map();

// Will hold stroke data in later steps
// Map<handIndex, Array<{x, y}[]>> — array of strokes, each stroke = array of points
export const strokes = new Map();

/**
 * Update the tracked fingertip position for a given hand.
 * @param {number} handIndex
 * @param {{ x: number, y: number } | null} pos  null when hand not detected
 */
export function setTipPosition(handIndex, pos) {
  if (pos === null) {
    tipPositions.delete(handIndex);
  } else {
    tipPositions.set(handIndex, pos);
  }
}

/**
 * Clear all state (used for canvas clear gesture later).
 */
export function clearAll() {
  tipPositions.clear();
  strokes.clear();
}
