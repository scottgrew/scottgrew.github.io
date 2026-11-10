"use client";

import { useEffect, useRef, useState } from "react";
import { ellipse, predict, start, update, type Estimate } from "./cursorFilter";
import styles from "./eggs.module.css";

// Easter egg on the Throughline page: hover the radar and the tracker's own
// filter tracks your cursor. It "scans" ten times a second, as the lidar
// does; a scan with no cursor movement is a miss. As in the tracker, a track
// is confirmed after 3 hits and dropped after 5 misses in a row, and it draws
// its 2σ uncertainty ellipse and a 1.5 s forecast.

const SCAN_S = 0.1;
const HITS_TO_CONFIRM = 3;
const MISSES_TO_DELETE = 5;
const FORECAST_S = 1.5;
const IDLE_OFF_MS = 5000;

type Track = { id: number; estimate: Estimate; hits: number; misses: number };

function Overlay({ onIdle }: { onIdle: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let track: Track | null = null;
    let nextId = 1;
    let cursor: { x: number; y: number } | null = null;
    let moved = false;
    let lastScan = performance.now();
    let lastMove = performance.now();
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onMove = (event: PointerEvent) => {
      cursor = { x: event.clientX, y: event.clientY };
      moved = true;
      lastMove = performance.now();
    };

    const scan = () => {
      if (track) track.estimate = predict(track.estimate, SCAN_S);
      if (moved && cursor) {
        if (!track) track = { id: nextId++, estimate: start(cursor.x, cursor.y), hits: 1, misses: 0 };
        else {
          track.estimate = update(track.estimate, cursor.x, cursor.y);
          track.hits += 1;
          track.misses = 0;
        }
      } else if (track) {
        track.misses += 1;
        if (track.misses >= MISSES_TO_DELETE || track.hits < HITS_TO_CONFIRM) track = null;
      }
      moved = false;
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (!track) return;
      const shown = predict(track.estimate, (now - lastScan) / 1000);
      const [x, y, yaw, v] = shown.mean;
      const solid = track.hits >= HITS_TO_CONFIRM && track.misses === 0;
      context.strokeStyle = "#f29a4a";
      context.fillStyle = "#f29a4a";
      context.lineWidth = 1;
      const { rx, ry, angle } = ellipse(shown);
      context.globalAlpha = 0.6;
      context.setLineDash(solid ? [] : [4, 3]);
      context.beginPath();
      context.ellipse(x, y, Math.max(rx, 2), Math.max(ry, 2), angle, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 0.85;
      context.setLineDash([2, 4]);
      context.beginPath();
      context.moveTo(x, y);
      let ahead = shown;
      for (let t = 0; t < FORECAST_S; t += SCAN_S) {
        ahead = predict(ahead, SCAN_S);
        context.lineTo(ahead.mean[0], ahead.mean[1]);
      }
      context.stroke();
      context.globalAlpha = 1;
      context.setLineDash(solid ? [] : [4, 3]);
      context.save();
      context.translate(x, y);
      context.rotate(yaw);
      context.strokeRect(-11, -6, 22, 12);
      context.restore();
      context.font = "11px ui-monospace, monospace";
      const state = track.hits < HITS_TO_CONFIRM ? "tentative" : track.misses ? `coasting ${track.misses}/${MISSES_TO_DELETE}` : `${Math.round(v)} px/s`;
      context.fillText(`ID ${track.id} · ${state}`, x + 16, y - 12);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      while (now - lastScan >= SCAN_S * 1000) {
        lastScan += SCAN_S * 1000;
        scan();
      }
      draw(now);
      if (!track && now - lastMove > IDLE_OFF_MS) onIdle();
    };
    frame = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [onIdle]);

  return <canvas ref={canvasRef} className={styles.trackerCanvas} aria-hidden="true" data-egg="tracker" />;
}

export function CursorTracker({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  return (
    <>
      <button type="button" className={styles.trigger} aria-label="Track my cursor with Throughline's filter" onPointerEnter={() => setActive(true)} onClick={() => setActive(true)}>
        {children}
      </button>
      {active ? <Overlay onIdle={() => setActive(false)} /> : null}
    </>
  );
}
