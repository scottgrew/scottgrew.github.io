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
const IDLE_AFTER_MS = 1200;

// Each point's target is stored as a fraction of the heading's box, so a
// resize only rescales the targets: no resampling, no jump.
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

// Draws the heading's text into a canvas the size of the heading and keeps
// a point for every filled cell of a grid over it.
function samplePoints(heading: HTMLElement, text: string, width: number, height: number): Point[] {
  const style = getComputedStyle(heading);
  const fontSize = parseFloat(style.fontSize);
  const spacing = parseFloat(style.letterSpacing) || 0;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  context.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  context.textBaseline = "middle";
  context.fillStyle = "#fff";

  const letters = [...(style.textTransform === "uppercase" ? text.toUpperCase() : text)];
  const widths = letters.map((ch) => context.measureText(ch).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * (letters.length - 1);
  let x = (width - total) / 2;
  letters.forEach((ch, i) => {
    context.fillText(ch, x, height / 2);
    x += widths[i] + spacing;
  });

  const step = Math.max(2, Math.round(fontSize / 24));
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const points: Point[] = [];
  for (let py = 0; py < canvas.height; py += step) {
    for (let px = 0; px < canvas.width; px += step) {
      if (data[(py * canvas.width + px) * 4 + 3] < 128) continue;
      points.push({
        nx: (px + (Math.random() - 0.5) * step * 0.6) / width,
        ny: (py + (Math.random() - 0.5) * step * 0.6) / height,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2,
        warm: Math.random() < 0.06,
        scale: 0.75 + Math.random() * 0.6,
      });
    }
  }
  return points;
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
    const cursor = { x: -1e4, y: -1e4 };

    const targetX = (p: Point) => box.margin + p.nx * box.width;
    const targetY = (p: Point) => SCATTER_MARGIN + p.ny * box.height;

    // Sizes the canvas around the heading. The first call samples the
    // letters; later calls only rescale every point with the box.
    const layout = () => {
      const rect = heading.getBoundingClientRect();
      const room = Math.min(rect.left, window.innerWidth - rect.right) - 4;
      const next = { width: rect.width, height: rect.height, margin: Math.max(0, Math.min(SCATTER_MARGIN, room)) };
      if (!points.length) {
        points = samplePoints(heading, text, next.width, next.height);
        points.forEach((p) => {
          p.x = instant ? next.margin + p.nx * next.width : next.margin + p.x;
          p.y = instant ? SCATTER_MARGIN + p.ny * next.height : SCATTER_MARGIN + p.y;
        });
      } else if (box.width && box.height) {
        const sx = next.width / box.width;
        const sy = next.height / box.height;
        points.forEach((p) => {
          p.x = next.margin + (p.x - box.margin) * sx;
          p.y = SCATTER_MARGIN + (p.y - SCATTER_MARGIN) * sy;
        });
      }
      box = next;
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
      const width = box.width + box.margin * 2;
      const height = box.height + SCATTER_MARGIN * 2;
      const beam = instant ? Infinity : box.margin + ((now - scanStart) / SCAN_MS) * box.width;
      if (!announced && beam > width + 40) {
        announced = true;
        signal(NAME_DONE);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

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
        // A faint dark halo under each point keeps it crisp over bright snow.
        context.fillStyle = "rgba(10,12,15,0.5)";
        context.fillRect(p.x - 0.75, p.y - 0.75, s + 1.5, s + 1.5);
        context.fillStyle = p.warm ? `rgba(242,154,74,${alpha})` : `rgba(255,255,255,${alpha})`;
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
      if (settled && now - lastDraw < IDLE_FRAME_MS - 2) return;
      lastDraw = now;
      draw(now);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursor.x = event.clientX - rect.left;
      cursor.y = event.clientY - rect.top;
      lastActive = performance.now();
    };
    const onLeave = () => {
      cursor.x = -1e4;
      cursor.y = -1e4;
    };

    // Rescale on every size change, in the same frame: no debounce, no blink.
    const observer = new ResizeObserver(() => {
      if (!points.length) return;
      layout();
      lastActive = performance.now();
      if (reduced) draw(performance.now());
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
      layout();
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
