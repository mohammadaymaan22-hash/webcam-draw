/**
 * smoother.js
 * Exponential Moving Average (EMA) smoother for 2D points.
 * One Smoother instance per tracked point (e.g. one per hand).
 *
 * EMA formula: smoothed = alpha * raw + (1 - alpha) * previous
 *   alpha=1.0 → no smoothing (raw input)
 *   alpha=0.0 → completely frozen
 *   alpha=0.5 → good balance of smoothness vs responsiveness
 */

export class Smoother {
  /**
   * @param {number} alpha  0 < alpha <= 1
   */
  constructor(alpha = 0.5) {
    this.alpha = alpha;
    this._prev = null; // {x, y} | null
  }

  /**
   * Feed a new raw point, get back the smoothed point.
   * @param {{ x: number, y: number } | null} point
   * @returns {{ x: number, y: number } | null}
   */
  update(point) {
    if (point === null) {
      this._prev = null;
      return null;
    }

    if (this._prev === null) {
      // First point — no history yet, return raw
      this._prev = { ...point };
      return this._prev;
    }

    this._prev = {
      x: this.alpha * point.x + (1 - this.alpha) * this._prev.x,
      y: this.alpha * point.y + (1 - this.alpha) * this._prev.y,
    };

    return { ...this._prev };
  }

  reset() {
    this._prev = null;
  }
}
