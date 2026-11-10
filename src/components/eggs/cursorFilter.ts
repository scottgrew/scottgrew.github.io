// The tracker's Kalman filter, aimed at a cursor. Throughline's own motion
// model assumes a car that turns along arcs; a cursor reverses in an instant,
// which makes that model spin, so this uses constant velocity (state x, y,
// vx, vy; it measures x, y) with the same predict and Joseph-form update.
// Units are CSS pixels and seconds, y pointing down the screen.

type Mat = number[][];
export type Estimate = { mean: number[]; covariance: Mat };

const SIGMA_ACCELERATION = 1400; // px/s², how hard a hand can change direction
const SIGMA_MEASUREMENT = 3; // px

const multiply = (a: Mat, b: Mat): Mat => a.map((row) => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
const transpose = (a: Mat): Mat => a[0].map((_, j) => a.map((row) => row[j]));
const add = (a: Mat, b: Mat): Mat => a.map((row, i) => row.map((v, j) => v + b[i][j]));

export function start(x: number, y: number): Estimate {
  return { mean: [x, y, 0, 0], covariance: [[9, 0, 0, 0], [0, 9, 0, 0], [0, 0, 600 ** 2, 0], [0, 0, 0, 600 ** 2]] };
}

export function predict({ mean, covariance }: Estimate, dt: number): Estimate {
  const F = [[1, 0, dt, 0], [0, 1, 0, dt], [0, 0, 1, 0], [0, 0, 0, 1]];
  const q = SIGMA_ACCELERATION ** 2;
  const [a, b, c] = [(dt ** 4) / 4, (dt ** 3) / 2, dt ** 2].map((v) => v * q);
  const Q = [[a, 0, b, 0], [0, a, 0, b], [b, 0, c, 0], [0, b, 0, c]];
  const [x, y, vx, vy] = mean;
  return { mean: [x + vx * dt, y + vy * dt, vx, vy], covariance: add(multiply(multiply(F, covariance), transpose(F)), Q) };
}

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
  const IKH = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? 1 : 0) - (j < 2 ? K[i][j] : 0)));
  const KRKt = K.map((ki) => K.map((kj) => R * (ki[0] * kj[0] + ki[1] * kj[1])));
  return { mean: next, covariance: add(multiply(multiply(IKH, covariance), transpose(IKH)), KRKt) };
}

// The 2σ ellipse of the position covariance, capped so a coasting track
// never balloons across the page.
export function ellipse({ covariance }: Estimate) {
  const [a, b, d] = [covariance[0][0], covariance[0][1], covariance[1][1]];
  const mid = (a + d) / 2;
  const spread = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const cap = (r: number) => Math.min(90, Math.max(3, r));
  return { rx: cap(2 * Math.sqrt(mid + spread)), ry: cap(2 * Math.sqrt(Math.max(mid - spread, 0))), angle: 0.5 * Math.atan2(2 * b, a - d) };
}
