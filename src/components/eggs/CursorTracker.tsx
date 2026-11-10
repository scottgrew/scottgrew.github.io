"use client";

import { useEffect, useRef } from "react";
import { ellipse, predict, start, update, type Estimate } from "./cursorFilter";
import styles from "./eggs.module.css";

// Easter egg on the Throughline page: click the radar and the tracker's own
// filter tracks your cursor. It "scans" ten times a second, as the lidar
// does; a scan with no cursor movement is a miss. As in the tracker, a track
// is confirmed after 3 hits and dropped after 5 misses in a row, and it draws
// its 2σ uncertainty ellipse and a 0.6 s forecast. ClickEgg starts and stops it.

const SCAN_S = 0.1;
const HITS_TO_CONFIRM = 3;
const MISSES_TO_DELETE = 5;
const FORECAST_S = 0.6;
const FOLLOW_S = 0.15; // the box lags a steady cursor by about speed × FOLLOW_S
const MISSES_TENTATIVE = 2; // a new track survives one quiet scan
const IDLE_OFF_MS = 5000;

type Track = { id: number; estimate: Estimate; hits: number; misses: number };

export function TrackerOverlay({ onDone }: { onDone: () => void }) {
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
    let heading = 0;
    let turn = 0; // rad/s, smoothed over recent scans
    let scanHeading = 0;
    let shown: { id: number; x: number; y: number; time: number } | null = null;

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
        const limit = track.hits < HITS_TO_CONFIRM ? MISSES_TENTATIVE : MISSES_TO_DELETE;
        if (track.misses >= limit) track = null;
      }
      moved = false;
      if (!track) return;
      const [, , svx, svy] = track.estimate.mean;
      if (Math.hypot(svx, svy) < 40) return;
      const next = Math.atan2(svy, svx);
      const change = Math.atan2(Math.sin(next - scanHeading), Math.cos(next - scanHeading));
      turn = Math.max(-5, Math.min(5, 0.75 * turn + 0.25 * (change / SCAN_S)));
      scanHeading = next;
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (!track) return;
      // The filter's estimate, projected to this frame, is the target. The
      // drawn box eases toward it with time constant FOLLOW_S, so it follows
      // behind a moving cursor and catches up when the cursor stops.
      const target = predict(track.estimate, (now - lastScan) / 1000);
      const [tx, ty, vx, vy] = target.mean;
      if (!shown || shown.id !== track.id) shown = { id: track.id, x: tx, y: ty, time: now };
      const ease = 1 - Math.exp(-(now - shown.time) / 1000 / FOLLOW_S);
      shown = { id: track.id, x: shown.x + (tx - shown.x) * ease, y: shown.y + (ty - shown.y) * ease, time: now };
      const { x, y } = shown;
      const v = Math.hypot(vx, vy);
      // The box turns with the motion, and holds its last heading when slow.
      if (v > 40) heading = Math.atan2(vy, vx);
      const solid = track.hits >= HITS_TO_CONFIRM && track.misses === 0;
      context.strokeStyle = "#f29a4a";
      context.fillStyle = "#f29a4a";
      context.lineWidth = 1;
      const { rx, ry, angle } = ellipse(target);
      context.globalAlpha = 0.6;
      context.setLineDash(solid ? [] : [4, 3]);
      context.beginPath();
      context.ellipse(x, y, Math.max(rx, 2), Math.max(ry, 2), angle, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 0.85;
      context.setLineDash([2, 4]);
      context.beginPath();
      // The forecast curves at the cursor's recent turn rate, so it points
      // where the motion is heading rather than only straight ahead.
      context.moveTo(x, y);
      let [fx, fy, fh] = [x, y, heading];
      for (let t = 0; t < FORECAST_S; t += 0.05) {
        fh += turn * 0.05;
        fx += v * Math.cos(fh) * 0.05;
        fy += v * Math.sin(fh) * 0.05;
        context.lineTo(fx, fy);
      }
      context.stroke();
      context.globalAlpha = 1;
      context.setLineDash(solid ? [] : [4, 3]);
      context.save();
      context.translate(x, y);
      context.rotate(heading);
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
      if (!track && now - lastMove > IDLE_OFF_MS) onDone();
    };
    frame = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [onDone]);

  return <canvas ref={canvasRef} className={styles.trackerCanvas} aria-hidden="true" data-egg="tracker" />;
}
