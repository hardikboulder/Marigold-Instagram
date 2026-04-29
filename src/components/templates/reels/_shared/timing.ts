/**
 * Timing helpers shared across reel templates. Pure math — no React.
 */

export function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Linear ramp from 0 → 1 between `start` and `start + duration`. Clamps at
 * both ends so it's safe to use directly as an opacity / progress.
 */
export function ramp(now: number, start: number, duration: number): number {
  if (duration <= 0) return now >= start ? 1 : 0;
  return clamp01((now - start) / duration);
}

/**
 * Standard ease-out-cubic for slide-up / scale-in entrances. `t` should be
 * 0..1 (use `ramp` to compute it from a timeline).
 */
export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

/**
 * Ease-out-back — slight overshoot, used for the "slam" entrance on
 * FactStackReel.
 */
export function easeOutBack(t: number): number {
  const c = clamp01(t);
  const s = 1.70158;
  return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2);
}

/**
 * Computes opacity for an element that fades in at `start`, holds for
 * `hold` ms, then fades out over `fadeOut` ms.
 */
export function fadeWindow(
  now: number,
  start: number,
  fadeIn: number,
  hold: number,
  fadeOut: number,
): number {
  if (now < start) return 0;
  const t = now - start;
  if (t < fadeIn) return easeOutCubic(t / fadeIn);
  if (t < fadeIn + hold) return 1;
  const out = t - fadeIn - hold;
  if (out >= fadeOut) return 0;
  return 1 - easeOutCubic(out / fadeOut);
}
