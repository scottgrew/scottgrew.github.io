"use client";

import { useEffect, useRef } from "react";
import { COLUMN_DONE, NAME_DONE, after, hasHappened, introSeen, onSkip, signal } from "./intro";
import styles from "./NameCloud.module.css";

// The name as a lidar point cloud. The letters are sampled into a few
// thousand points; on load an orange scan line sweeps across and each point
// locks onto its letter as the beam passes, as if the scanner were resolving
// the word. Afterwards the points shimmer slightly, and the cursor scatters
// the ones near it before they spring back. The real heading text stays in
// the DOM for screen readers and shows as plain text without JavaScript.

const SCATTER_MARGIN = 48; // CSS px the canvas extends past the heading, at most
// The scan starts once the name's box has appeared (the column signals it)
// and resolves the name in SCAN_MS. If that signal never comes, scan anyway.
const SCAN_MS = 1200;
const COLUMN_FALLBACK_MS = 4000;
const SPRING = 0.075; // pull toward the letter per frame
const DAMPING = 0.78; // velocity kept per frame
const CURSOR_RADIUS = 56;
const CURSOR_PUSH = 5.5;
// Once settled and untouched, the shimmer is drawn at 30 frames a second.
const IDLE_FRAME_MS = 1000 / 30;
// The physics steps once per drawn frame, so the active rate is capped too:
// a 120 or 144 Hz display would otherwise run it faster and at twice the cost.
const ACTIVE_FRAME_MS = 1000 / 60;
// Point opacity is rounded to one of these levels, so each frame reuses a
// few colour strings instead of building one per point.
const ALPHA_LEVELS = 16;
const alphaStyles = (rgb: string) =>
  Array.from({ length: ALPHA_LEVELS + 1 }, (_, i) => `rgba(${rgb},${(i / ALPHA_LEVELS).toFixed(3)})`);
const WHITE_STYLES = alphaStyles("255,255,255");
const WARM_STYLES = alphaStyles("242,154,74");
const HALO_STYLE = "rgba(10,12,15,0.5)";
const IDLE_AFTER_MS = 1200;

// Each point's target is stored as a fraction of the heading's box. A resize
// resamples the letters at their new size (a millisecond or two) and puts
// every point straight onto them, so the name is legible at every width.
type Point = {
  nx: number;
  ny: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  warm: boolean;
  scale: number; // 0.75 to 1.35, so the cloud reads as having depth
};

// Draws the heading's text on a roomy canvas, keeps a point for every filled
// cell of a grid over it, then fits the letters' actual extent inside the
// heading box, so the name can never be clipped at its edges.
function samplePoints(heading: HTMLElement, text: string, width: number, height: number): Point[] {
  // During a page transition the heading can measure zero; there is nothing
  // to sample then, and a zero-sized canvas would throw.
  if (width < 1 || height < 1) return [];
  const style = getComputedStyle(heading);
  const fontSize = parseFloat(style.fontSize);
  const spacing = parseFloat(style.letterSpacing) || 0;
  const canvas = document.createElement("canvas");
  const roomX = Math.ceil(width * 0.5);
  const roomY = Math.ceil(height * 0.5);
  canvas.width = Math.ceil(width) + roomX * 2;
  canvas.height = Math.ceil(height) + roomY * 2;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  context.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  context.textBaseline = "middle";
  context.fillStyle = "#fff";

  const letters = [...(style.textTransform === "uppercase" ? text.toUpperCase() : text)];
  const widths = letters.map((ch) => context.measureText(ch).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * (letters.length - 1);
  let x = (canvas.width - total) / 2;
  letters.forEach((ch, i) => {
    context.fillText(ch, x, canvas.height / 2);
    x += widths[i] + spacing;
  });

  const step = Math.max(2, Math.round(fontSize / 24));
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const filled: [number, number][] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let py = 0; py < canvas.height; py += step) {
    for (let px = 0; px < canvas.width; px += step) {
      if (data[(py * canvas.width + px) * 4 + 3] < 128) continue;
      filled.push([px, py]);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  }
  if (!filled.length) return [];

  // Natural size if it fits, shrunk uniformly if it would overflow; centred.
  const fit = Math.min(1, (width * 0.98) / (maxX - minX + step), (height * 0.95) / (maxY - minY + step));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  return filled.map(([px, py]) => ({
    nx: (width / 2 + (px - midX + (Math.random() - 0.5) * step * 0.6) * fit) / width,
    ny: (height / 2 + (py - midY + (Math.random() - 0.5) * step * 0.6) * fit) / height,
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
    phase: Math.random() * Math.PI * 2,
    warm: Math.random() < 0.06,
    scale: 0.75 + Math.random() * 0.6,
  }));
}

export function NameCloud({ text, className }: { text: string; className?: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const canvas = canvasRef.current;
    if (!heading || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // With reduced motion, on a later load in the same visit, or after any
    // input, the name is simply there.
    let instant = reduced || introSeen() || hasHappened(NAME_DONE);
    let scanStart = Infinity;
    let announced = instant;
    let points: Point[] = [];
    let box = { width: 0, height: 0, margin: 0 }; // the heading, and the canvas margin around it
    let dpr = 1;
    let size = 1.6;
    let frame = 0;
    let disposed = false;
    let lastDraw = 0;
    let lastActive = 0; // last cursor move or resize; the loop runs full speed after it
    // The cursor in viewport coordinates; it is converted to canvas
    // coordinates once per frame, not on every pointer event.
    const pointer = { x: -1e4, y: -1e4 };
    const cursor = { x: -1e4, y: -1e4 };

    const targetX = (p: Point) => box.margin + p.nx * box.width;
    const targetY = (p: Point) => SCATTER_MARGIN + p.ny * box.height;

    // Sizes the canvas around the heading and samples the letters at the
    // current size. Once the name has resolved (or on a resize mid-scan),
    // every point is placed directly on its letter.
    const layout = (resizing: boolean) => {
      const rect = heading.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const room = Math.min(rect.left, window.innerWidth - rect.right) - 4;
      box = { width: rect.width, height: rect.height, margin: Math.max(0, Math.min(SCATTER_MARGIN, room)) };
      if (resizing && !instant) {
        instant = true;
        announced = true;
        signal(NAME_DONE);
      }
      points = samplePoints(heading, text, box.width, box.height);
      points.forEach((p) => {
        p.x = instant ? targetX(p) : box.margin + p.x;
        p.y = instant ? targetY(p) : SCATTER_MARGIN + p.y;
      });
      const width = box.width + box.margin * 2;
      const height = box.height + SCATTER_MARGIN * 2;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.left = `${-box.margin}px`;
      size = Math.max(1.8, parseFloat(getComputedStyle(heading).fontSize) / 20);
      heading.dataset.cloud = points.length ? "ready" : "off";
    };

    const draw = (now: number) => {
      if (!box.width) return;
      const width = box.width + box.margin * 2;
      const height = box.height + SCATTER_MARGIN * 2;
      const beam = instant ? Infinity : box.margin + ((now - scanStart) / SCAN_MS) * box.width;
      if (!announced && beam > width + 40) {
        announced = true;
        signal(NAME_DONE);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const origin = canvas.getBoundingClientRect();
      cursor.x = pointer.x - origin.left;
      cursor.y = pointer.y - origin.top;

      for (const p of points) {
        if (!instant && scanStart === Infinity) continue;
        const tx = targetX(p);
        if (tx <= beam) {
          const shimmer = reduced ? 0 : 0.35 * Math.sin(now / 520 + p.phase);
          let ax = (tx + shimmer - p.x) * SPRING;
          let ay = (targetY(p) - p.y) * SPRING;
          const dx = p.x - cursor.x;
          const dy = p.y - cursor.y;
          const d = Math.hypot(dx, dy);
          if (d < CURSOR_RADIUS && d > 0.01) {
            const force = (1 - d / CURSOR_RADIUS) * CURSOR_PUSH;
            ax += (dx / d) * force;
            ay += (dy / d) * force;
          }
          p.vx = (p.vx + ax) * DAMPING;
          p.vy = (p.vy + ay) * DAMPING;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          p.x += (Math.random() - 0.5) * 0.8;
          p.y += (Math.random() - 0.5) * 0.8;
        }
        const alpha = tx <= beam ? 0.82 + 0.18 * Math.sin(now / 340 + p.phase * 3) : 0.35;
        const s = size * p.scale;
        // A faint dark halo under each point keeps it crisp over bright snow;
        // the halos overlap and stack into the dark backing behind the letters.
        context.fillStyle = HALO_STYLE;
        context.fillRect(p.x - 0.75, p.y - 0.75, s + 1.5, s + 1.5);
        context.fillStyle = (p.warm ? WARM_STYLES : WHITE_STYLES)[Math.round(alpha * ALPHA_LEVELS)];
        context.fillRect(p.x, p.y, s, s);
      }

      if (beam > box.margin && beam < box.margin + box.width) {
        const gradient = context.createLinearGradient(beam - 40, 0, beam, 0);
        gradient.addColorStop(0, "rgba(242,154,74,0)");
        gradient.addColorStop(1, "rgba(242,154,74,0.55)");
        context.fillStyle = gradient;
        context.fillRect(beam - 40, SCATTER_MARGIN * 0.6, 40, height - SCATTER_MARGIN * 1.2);
      }
    };

    const loop = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(loop);
      const settled = announced && now - lastActive > IDLE_AFTER_MS;
      if (now - lastDraw < (settled ? IDLE_FRAME_MS : ACTIVE_FRAME_MS) - 2) return;
      lastDraw = now;
      draw(now);
    };

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      lastActive = performance.now();
    };
    const onLeave = () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
    };

    // Resample on every size change and redraw at once: resizing the canvas
    // wipes it, and waiting for the next frame would show it empty.
    let observed = false;
    const observer = new ResizeObserver(() => {
      if (!observed) {
        observed = true; // the first callback reports the initial size
        return;
      }
      layout(true);
      lastActive = performance.now();
      draw(performance.now());
    });

    const stopSkip = onSkip(() => {
      if (instant) return;
      instant = true;
      announced = true;
      points.forEach((p) => ((p.x = targetX(p)), (p.y = targetY(p)), (p.vx = 0), (p.vy = 0)));
    });
    const stopWait = instant
      ? () => {}
      : after(COLUMN_DONE, () => {
          scanStart = performance.now();
        }, COLUMN_FALLBACK_MS);

    document.fonts.ready.then(() => {
      if (disposed) return;
      layout(false);
      observer.observe(heading);
      if (reduced) draw(performance.now());
      else frame = requestAnimationFrame(loop);
    });
    if (!reduced) {
      window.addEventListener("pointermove", onMove);
      document.addEventListener("pointerleave", onLeave);
    }
    return () => {
      disposed = true;
      stopSkip();
      stopWait();
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [text]);

  return (
    <h1 ref={headingRef} className={`${className ?? ""} ${styles.cloud}`} data-cloud="pending">
      {text}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </h1>
  );
}
