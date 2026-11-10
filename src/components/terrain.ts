// Gradient descent down the mountains in background.jpg. The height function
// mirrors height() in the shader: it falls with distance below the traced
// ridgeline and rises with blurred brightness (snow and lit rock). Two
// descents, one on each side of the name, start under a summit like training
// runs from different random initialisations; each steps against the gradient
// with momentum and settles in its own valley.

export const PATHS = 2;
export const PATH_POINTS = 16;
export const PATH_SEGMENTS = PATH_POINTS - 1;
export const PATH_STAGGER = 4; // segments between one descent starting and the next

// Image-space starts, first drawn first: the right-hand summit (drawn
// strongest), then the far left ridge. Both stay clear of the centre column.
const STARTS = [
  { x: 0.865, y: 0.535 },
  { x: 0.1, y: 0.53 },
];
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

// Returns the descents, 16 points each, as x, y, x, y, … floats.
export function descendMountain(image: HTMLImageElement) {
  const out = new Float32Array(PATHS * PATH_POINTS * 2);
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
  STARTS.forEach((start, p) => {
    let { x, y } = start;
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < PATH_POINTS; i++) {
      out[(p * PATH_POINTS + i) * 2] = x;
      out[(p * PATH_POINTS + i) * 2 + 1] = y;
      if (y >= FLOOR) continue;
      const gx = (h(x + e, y) - h(x - e, y)) / (2 * e);
      const gy = (h(x, y + e) - h(x, y - e)) / (2 * e);
      const norm = Math.hypot(gx, gy) || 1;
      vx = MOMENTUM * vx - (1 - MOMENTUM) * (gx / norm);
      vy = MOMENTUM * vy - (1 - MOMENTUM) * (gy / norm);
      const speed = Math.hypot(vx, vy) || 1;
      // Each descent stays on its own side, clear of the centre column.
      x = start.x > 0.5 ? Math.min(0.98, Math.max(0.68, x + (vx / speed) * STEP)) : Math.min(0.3, Math.max(0.02, x + (vx / speed) * STEP));
      y = Math.min(FLOOR, Math.max(ridgeAt(x) + 0.015, y + (vy / speed) * STEP));
    }
  });
  return out;
}
