// A browser port of Throughline's constant-turn-rate extended Kalman filter
// (src/filter.cpp): state x, y, heading, speed, turn rate; it measures x, y.
// Units are CSS pixels and seconds, with y pointing down the screen.

type Mat = number[][];
export type Estimate = { mean: number[]; covariance: Mat };

const SIGMA_ACCELERATION = 900; // px/s², along the heading
const SIGMA_YAW_ACCELERATION = 6; // rad/s²
const SIGMA_MEASUREMENT = 3; // px
const STRAIGHT_LINE_YAW_RATE = 1e-4;

const zeros = (n: number): Mat => Array.from({ length: n }, () => new Array(n).fill(0));
const identity = (n: number): Mat => zeros(n).map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
const multiply = (a: Mat, b: Mat): Mat => a.map((row) => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
const transpose = (a: Mat): Mat => a[0].map((_, j) => a.map((row) => row[j]));
const add = (a: Mat, b: Mat): Mat => a.map((row, i) => row.map((v, j) => v + b[i][j]));
const outer = (a: number[], b: number[], s: number): Mat => a.map((x) => b.map((y) => x * y * s));
const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

export function start(x: number, y: number): Estimate {
  const covariance = zeros(5);
  [25, 25, Math.PI ** 2, 400 ** 2, 9].forEach((v, i) => (covariance[i][i] = v));
  return { mean: [x, y, 0, 0, 0], covariance };
}

// Moves the estimate dt seconds along a circular arc (a straight line when
// barely turning), growing the covariance by noise along the heading.
export function predict({ mean, covariance }: Estimate, dt: number): Estimate {
  const [x, y, yaw, v, w] = mean;
  const F = identity(5);
  F[2][4] = dt;
  let nx: number;
  let ny: number;
  if (Math.abs(w) < STRAIGHT_LINE_YAW_RATE) {
    nx = x + v * Math.cos(yaw) * dt;
    ny = y + v * Math.sin(yaw) * dt;
    F[0][2] = -v * Math.sin(yaw) * dt;
    F[0][3] = Math.cos(yaw) * dt;
    F[1][2] = v * Math.cos(yaw) * dt;
    F[1][3] = Math.sin(yaw) * dt;
  } else {
    const yaw2 = yaw + w * dt;
    const r = v / w;
    const ds = Math.sin(yaw2) - Math.sin(yaw);
    const dc = Math.cos(yaw) - Math.cos(yaw2);
    nx = x + r * ds;
    ny = y + r * dc;
    F[0][2] = r * (Math.cos(yaw2) - Math.cos(yaw));
    F[0][3] = ds / w;
    F[0][4] = r * dt * Math.cos(yaw2) - (r * ds) / w;
    F[1][2] = r * ds;
    F[1][3] = dc / w;
    F[1][4] = r * dt * Math.sin(yaw2) - (r * dc) / w;
  }
  const half = 0.5 * dt * dt;
  const g = [half * Math.cos(yaw), half * Math.sin(yaw), 0, dt, 0];
  const h = [0, 0, half, 0, dt];
  const Q = add(outer(g, g, SIGMA_ACCELERATION ** 2), outer(h, h, SIGMA_YAW_ACCELERATION ** 2));
  return { mean: [nx, ny, wrap(yaw + w * dt), v, w], covariance: add(multiply(multiply(F, covariance), transpose(F)), Q) };
}

// Folds in a measured cursor position (Joseph-form covariance update).
export function update({ mean, covariance }: Estimate, mx: number, my: number): Estimate {
  const R = SIGMA_MEASUREMENT ** 2;
  const s00 = covariance[0][0] + R;
  const s01 = covariance[0][1];
  const s11 = covariance[1][1] + R;
  const det = s00 * s11 - s01 * s01;
  const K = covariance.map((row) => [(row[0] * s11 - row[1] * s01) / det, (row[1] * s00 - row[0] * s01) / det]);
  const rx = mx - mean[0];
  const ry = my - mean[1];
  const next = mean.map((v, i) => v + K[i][0] * rx + K[i][1] * ry);
  next[2] = wrap(next[2]);
  const IKH = identity(5).map((row, i) => row.map((v, j) => v - (j < 2 ? K[i][j] : 0)));
  const KRKt = K.map((ki) => K.map((kj) => R * (ki[0] * kj[0] + ki[1] * kj[1])));
  return { mean: next, covariance: add(multiply(multiply(IKH, covariance), transpose(IKH)), KRKt) };
}

// The 2σ ellipse of the position covariance: radii and rotation.
export function ellipse({ covariance }: Estimate) {
  const [a, b, d] = [covariance[0][0], covariance[0][1], covariance[1][1]];
  const mid = (a + d) / 2;
  const spread = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  return { rx: 2 * Math.sqrt(Math.max(mid + spread, 0)), ry: 2 * Math.sqrt(Math.max(mid - spread, 0)), angle: 0.5 * Math.atan2(2 * b, a - d) };
}
