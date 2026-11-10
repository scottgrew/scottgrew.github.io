"use client";

import { useEffect, useRef } from "react";
import styles from "./NameCloud.module.css";

// The name as a lidar point cloud. The letters are sampled into a few
// thousand points; on load an orange scan line sweeps across and each point
// locks onto its letter as the beam passes, as if the scanner were resolving
// the word. Afterwards the points shimmer slightly, and the cursor scatters
// the ones near it before they spring back. The real heading text stays in
// the DOM for screen readers and shows as plain text without JavaScript.

const SCATTER_MARGIN = 48; // CSS px the canvas extends past the heading, at most
const SCAN_DELAY_MS = 450;
const SCAN_MS = 1300;
const SPRING = 0.075; // pull toward the letter per frame
const DAMPING = 0.78; // velocity kept per frame
const CURSOR_RADIUS = 56;
const CURSOR_PUSH = 5.5;

type Point = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  warm: boolean;
  scale: number; // 0.75 to 1.35, so the cloud reads as having depth
};

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
      const tx = px + (Math.random() - 0.5) * step * 0.6;
      const ty = py + (Math.random() - 0.5) * step * 0.6;
      points.push({
        tx,
        ty,
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

    let points: Point[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let start = 0;
    let frame = 0;
    let disposed = false;
    const cursor = { x: -1e4, y: -1e4 };

    const layout = () => {
      const rect = heading.getBoundingClientRect();
      const room = Math.min(rect.left, window.innerWidth - rect.right) - 4;
      const margin = Math.max(0, Math.min(SCATTER_MARGIN, room));
      width = rect.width + margin * 2;
      height = rect.height + SCATTER_MARGIN * 2;
      canvas.style.left = `${-margin}px`;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      points = samplePoints(heading, text, width, height);
      if (reduced) points.forEach((p) => ((p.x = p.tx), (p.y = p.ty)));
      heading.dataset.cloud = points.length ? "ready" : "off";
    };

    const draw = (now: number) => {
      if (disposed) return;
      if (!start) start = now;
      const elapsed = now - start;
      const beam = reduced ? Infinity : ((elapsed - SCAN_DELAY_MS) / SCAN_MS) * width;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const size = Math.max(1.8, parseFloat(getComputedStyle(heading).fontSize) / 20);
      for (const p of points) {
        if (p.tx <= beam) {
          const shimmer = reduced ? 0 : 0.35 * Math.sin(now / 520 + p.phase);
          let ax = (p.tx + shimmer - p.x) * SPRING;
          let ay = (p.ty - p.y) * SPRING;
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
        const alpha = p.tx <= beam ? 0.82 + 0.18 * Math.sin(now / 340 + p.phase * 3) : 0.35;
        const s = size * p.scale;
        // A faint dark halo under each point keeps it crisp over bright snow.
        context.fillStyle = "rgba(10,12,15,0.5)";
        context.fillRect(p.x - 0.75, p.y - 0.75, s + 1.5, s + 1.5);
        context.fillStyle = p.warm ? `rgba(242,154,74,${alpha})` : `rgba(255,255,255,${alpha})`;
        context.fillRect(p.x, p.y, s, s);
      }

      if (beam > 0 && beam < width) {
        const gradient = context.createLinearGradient(beam - 40, 0, beam, 0);
        gradient.addColorStop(0, "rgba(242,154,74,0)");
        gradient.addColorStop(1, "rgba(242,154,74,0.55)");
        context.fillStyle = gradient;
        context.fillRect(beam - 40, SCATTER_MARGIN * 0.6, 40, height - SCATTER_MARGIN * 1.2);
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursor.x = event.clientX - rect.left;
      cursor.y = event.clientY - rect.top;
    };
    const onLeave = () => {
      cursor.x = -1e4;
      cursor.y = -1e4;
    };

    let resizeTimer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout();
        if (reduced) draw(performance.now());
      }, 120);
    });

    document.fonts.ready.then(() => {
      if (disposed) return;
      layout();
      observer.observe(heading);
      if (reduced) draw(performance.now());
      else frame = requestAnimationFrame(draw);
    });
    if (!reduced) {
      window.addEventListener("pointermove", onMove);
      document.addEventListener("pointerleave", onLeave);
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearTimeout(resizeTimer);
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
