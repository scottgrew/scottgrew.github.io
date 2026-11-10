"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Background.module.css";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const POOL_STEPS = [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1];
const STEP_MS = 90;

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  w: number,
  h: number,
) {
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  const scale = Math.max(w / iw, h / ih);
  const sw = iw * scale;
  const sh = ih * scale;
  const dx = (w - sw) / 2;
  const dy = (h - sh) / 2;
  ctx.drawImage(image, dx, dy, sw, sh);
}

function greyscale(data: Uint8ClampedArray): Float32Array {
  const out = new Float32Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    out[j] =
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return out;
}

function sobelMagnitude(gray: Float32Array, width: number, height: number) {
  const out = new Float32Array(gray.length);
  let max = 0;
  const gxK = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gyK = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const v = gray[(y + ky) * width + (x + kx)];
          gx += v * gxK[k];
          gy += v * gyK[k];
          k++;
        }
      }
      const mag = Math.sqrt(gx * gx + gy * gy);
      const idx = y * width + x;
      out[idx] = mag;
      if (mag > max) max = mag;
    }
  }

  const scale = max > 0 ? 255 / max : 0;
  for (let i = 0; i < out.length; i++) {
    out[i] = out[i] * scale;
  }
  return out;
}

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const featureMapRef = useRef<ImageData | null>(null);
  const konamiIdx = useRef(0);
  const [featureMap, setFeatureMap] = useState(false);
  const [loadDone, setLoadDone] = useState(false);
  const reducedMotion = useRef(false);

  const renderFrame = useCallback((useFeature: boolean) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    if (useFeature && featureMapRef.current) {
      ctx.putImageData(featureMapRef.current, 0, 0);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    drawCover(ctx, img, w, h);
  }, []);

  const pooledLoad = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    if (reducedMotion.current) {
      ctx.imageSmoothingEnabled = true;
      drawCover(ctx, img, w, h);
      setLoadDone(true);
      window.dispatchEvent(new Event("background-ready"));
      return;
    }

    let step = 0;
    const run = () => {
      const frac = POOL_STEPS[step];
      const sw = Math.max(1, Math.floor(w * frac));
      const sh = Math.max(1, Math.floor(h * frac));

      const off = document.createElement("canvas");
      off.width = sw;
      off.height = sh;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.imageSmoothingEnabled = true;
      drawCover(octx, img, sw, sh);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, sw, sh, 0, 0, w, h);

      step++;
      if (step < POOL_STEPS.length) {
        window.setTimeout(run, STEP_MS);
      } else {
        ctx.imageSmoothingEnabled = true;
        drawCover(ctx, img, w, h);
        setLoadDone(true);
        window.dispatchEvent(new Event("background-ready"));
      }
    };
    run();
  }, []);

  const buildFeatureMap = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    const long = Math.max(window.innerWidth, window.innerHeight);
    const scale = long > 1600 ? 1600 / long : 1;
    const w = Math.floor(window.innerWidth * scale);
    const h = Math.floor(window.innerHeight * scale);

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d");
    if (!octx) return;
    drawCover(octx, img, w, h);
    const id = octx.getImageData(0, 0, w, h);
    const gray = greyscale(id.data);
    const mag = sobelMagnitude(gray, w, h);

    const out = octx.createImageData(w, h);
    for (let i = 0; i < mag.length; i++) {
      const v = Math.round(mag[i]);
      const j = i * 4;
      out.data[j] = v;
      out.data[j + 1] = v;
      out.data[j + 2] = v;
      out.data[j + 3] = 255;
    }

    const main = canvasRef.current;
    if (!main) return;
    const mainW = main.width;
    const mainH = main.height;
    const scaled = document.createElement("canvas");
    scaled.width = mainW;
    scaled.height = mainH;
    const sctx = scaled.getContext("2d");
    if (!sctx) return;
    sctx.imageSmoothingEnabled = true;
    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    temp.getContext("2d")?.putImageData(out, 0, 0);
    sctx.drawImage(temp, 0, 0, w, h, 0, 0, mainW, mainH);
    featureMapRef.current = sctx.getImageData(0, 0, mainW, mainH);
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    featureMapRef.current = null;
    if (featureMap) {
      buildFeatureMap();
      renderFrame(true);
    } else if (loadDone) {
      renderFrame(false);
    } else {
      pooledLoad();
    }
  }, [buildFeatureMap, featureMap, loadDone, pooledLoad, renderFrame]);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const img = new Image();
    img.src = "/media/background.jpg";
    img.onload = () => {
      imageRef.current = img;
      resize();
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const expected = KONAMI[konamiIdx.current];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === expected) {
        konamiIdx.current++;
        if (konamiIdx.current === KONAMI.length) {
          konamiIdx.current = 0;
          setFeatureMap((prev) => {
            const next = !prev;
            if (next) {
              buildFeatureMap();
              requestAnimationFrame(() => renderFrame(true));
            } else {
              renderFrame(false);
            }
            window.dispatchEvent(
              new CustomEvent("feature-map-change", { detail: next }),
            );
            return next;
          });
        }
      } else {
        konamiIdx.current = key === KONAMI[0] ? 1 : 0;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buildFeatureMap, renderFrame]);

  return (
    <div
      className={`${styles.wrap} ${loadDone && !featureMap ? styles.drift : ""} ${
        featureMap ? styles.paused : ""
      }`}
      data-load-done={loadDone ? "true" : "false"}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      {featureMap ? (
        <p className={`${styles.featureLabel} mono`} aria-live="polite">
          conv1 · sobel 3×3 · 2 kernels
        </p>
      ) : null}
    </div>
  );
}
