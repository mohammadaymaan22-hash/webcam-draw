/**
 * gestureDetector.js
 * Classifies a single hand's landmarks into a gesture string.
 * Pure function — no side effects, easy to unit test or extend.
 *
 * Landmark indices (MediaPipe hand):
 *   Index finger:  tip=8,  pip=6
 *   Middle finger: tip=12, pip=10
 *   Ring finger:   tip=16, pip=14
 *   Pinky finger:  tip=20, pip=18
 */

const LM = {
  THUMB_TIP: 4,  INDEX_MCP: 5,   // thumb extension uses distance
  INDEX_TIP: 8,  INDEX_PIP: 6,
  MIDDLE_TIP: 12, MIDDLE_PIP: 10,
  RING_TIP: 16,  RING_PIP: 14,
  PINKY_TIP: 20, PINKY_PIP: 18,
};

/**
 * A finger is "extended" when its tip is above its PIP joint.
 */
function isExtended(landmarks, tipIdx, pipIdx) {
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

/**
 * Thumb is extended when its tip is far from the index finger's MCP joint.
 * Distance threshold works better than Y-axis for the thumb's lateral motion.
 */
function isThumbExtended(landmarks) {
  const tip = landmarks[LM.THUMB_TIP];
  const ref = landmarks[LM.INDEX_MCP];
  const dx = tip.x - ref.x;
  const dy = tip.y - ref.y;
  return Math.sqrt(dx * dx + dy * dy) > 0.1;
}

/**
 * @param {Array<{x,y,z}>} landmarks  21 landmarks for one hand
 * @returns {'draw' | 'hover' | 'none'}
 */
export function detectGesture(landmarks) {
  const indexUp  = isExtended(landmarks, LM.INDEX_TIP,  LM.INDEX_PIP);
  const middleUp = isExtended(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP);
  const ringUp   = isExtended(landmarks, LM.RING_TIP,   LM.RING_PIP);
  const pinkyUp  = isExtended(landmarks, LM.PINKY_TIP,  LM.PINKY_PIP);
  const thumbUp  = isThumbExtended(landmarks);

  if (indexUp && middleUp && ringUp && pinkyUp) return 'open_palm';
  if (indexUp && thumbUp)                       return 'hover';
  if (indexUp)                                  return 'draw'; // open_palm/hover already caught
  return 'none';
}
