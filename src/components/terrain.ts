// Gradient descent down the right-hand mountain in background.jpg. The
// height function mirrors height() in the shader: it falls with distance
// below the traced ridgeline and rises with blurred brightness (snow and lit
// rock). Starting just under the summit, each step moves against the
// gradient with momentum, down the slope the contours show, clear of the name.

export const PATH_POINTS = 16;
export const PATH_SEGMENTS = PATH_POINTS - 1;

const START = { x: 0.865, y: 0.535 };
const STEP = 0.014;
const MOMENTUM = 0.55;
const FLOOR = 0.8; // the valley mist; descent stops here
const SAMPLE_WIDTH = 480;

let ridge: number[] = [];

function ridgeAt(x: number) {
  const f = Math.min(Math.max(x, 0), 1) * 20;
  const i = Math.min(Math.floor(f), 19);
  return ridge[i] + (ridge[i + 1] - ridge[i]) * (f - i);
}

// The shader reads its arrays as vec4s; pack the 21 ridge heights four to one.
export function packRidge(values: number[]) {
  ridge = values;
  const packed = new Float32Array(24);
  packed.set(values);
  return packed;
}

// The descent as 16 points, x, y, x, y, … in image space.
export function descendMountain(image: HTMLImageElement) {
  const out = new Float32Array(PATH_POINTS * 2);
  const width = SAMPLE_WIDTH;
  const height = Math.round((width * image.naturalHeight) / image.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return out;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;

  const lum = (x: number, y: number) => {
    const px = Math.min(width - 1, Math.max(0, Math.round(x * (width - 1))));
    const py = Math.min(height - 1, Math.max(0, Math.round(y * (height - 1))));
    const i = (py * width + px) * 4;
    return (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255;
  };
  const blurred = (x: number, y: number) =>
    (lum(x, y) * 2 + lum(x + 0.02, y) + lum(x - 0.02, y) + lum(x, y + 0.03) + lum(x, y - 0.03)) / 6;
  const h = (x: number, y: number) => -(y - ridgeAt(x)) * 3 + blurred(x, y) * 2;

  const e = 0.006;
  let { x, y } = START;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < PATH_POINTS; i++) {
    out[i * 2] = x;
    out[i * 2 + 1] = y;
    if (y >= FLOOR) continue;
    const gx = (h(x + e, y) - h(x - e, y)) / (2 * e);
    const gy = (h(x, y + e) - h(x, y - e)) / (2 * e);
    const norm = Math.hypot(gx, gy) || 1;
    vx = MOMENTUM * vx - (1 - MOMENTUM) * (gx / norm);
    vy = MOMENTUM * vy - (1 - MOMENTUM) * (gy / norm);
    const speed = Math.hypot(vx, vy) || 1;
    x = Math.min(0.98, Math.max(0.68, x + (vx / speed) * STEP));
    y = Math.min(FLOOR, Math.max(ridgeAt(x) + 0.015, y + (vy / speed) * STEP));
  }
  return out;
}
