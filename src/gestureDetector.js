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
  WRIST: 0,
  THUMB_TIP: 4,  INDEX_MCP: 5,
  INDEX_TIP: 8,  INDEX_MCP_REF: 5,  // use MCP (knuckle) — stays in frame near bottom
  MIDDLE_TIP: 12, MIDDLE_MCP: 9,
  RING_TIP: 16,  RING_MCP: 13,
  PINKY_TIP: 20, PINKY_MCP: 17,
};

/**
 * A finger is extended when its tip is above its MCP (base knuckle).
 * Using MCP instead of PIP because MCP stays in frame longer near frame edges.
 */
function isExtended(landmarks, tipIdx, mcpIdx) {
  return landmarks[tipIdx].y < landmarks[mcpIdx].y;
}

/**
 * Thumb is extended when its tip is far from the index finger's MCP joint.
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
 * @returns {'draw' | 'hover' | 'open_palm' | 'none'}
 */
export function detectGesture(landmarks) {
  const wristInFrame = landmarks[LM.WRIST].y < 0.80; // hand not cropped at bottom

  const indexUp  = isExtended(landmarks, LM.INDEX_TIP,  LM.INDEX_MCP_REF);
  const middleUp = isExtended(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_MCP);
  const ringUp   = isExtended(landmarks, LM.RING_TIP,   LM.RING_MCP);
  const pinkyUp  = isExtended(landmarks, LM.PINKY_TIP,  LM.PINKY_MCP);
  const thumbUp  = isThumbExtended(landmarks);

  // open_palm only valid when whole hand is in frame
  if (wristInFrame && indexUp && middleUp && ringUp && pinkyUp) return 'open_palm';
  if (indexUp && thumbUp) return 'hover';
  if (indexUp)            return 'draw';
  return 'none';
}
