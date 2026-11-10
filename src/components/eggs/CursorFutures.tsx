"use client";

import { useEffect, useRef } from "react";
import { predict, start, update, type Estimate } from "./cursorFilter";
import styles from "./eggs.module.css";

// Easter egg on the MotionNet page: click the six paths and your cursor gets
// six possible futures, the way MotionNet gives six paths for a car. A
// Kalman filter estimates the cursor's velocity, and its turn rate comes
// from how the heading changes between scans. Five futures turn at that
// rate and at offsets either side; the sixth slows to a stop. Each is weighted by
// how well it fits the motion, and the likeliest is drawn solid.
// This illustrates MotionNet's output; it is not the model.

const SCAN_S = 0.05;
const HORIZON_S = 1;
const TURN_OFFSETS = [-4, -2, 0, 2, 4]; // rad/s either side of the observed turn
const TURN_SPREAD = 2.5;
const STOP_SPEED = 150; // px/s at which stopping is as likely as going on
const MIN_SPEED = 30;
const IDLE_OFF_MS = 6000;

type Future = { points: [number, number][]; p: number };

function futures(x: number, y: number, heading: number, speed: number, turn: number): Future[] {
  const weights = TURN_OFFSETS.map((o) => Math.exp(-(o * o) / (2 * TURN_SPREAD * TURN_SPREAD)));
  weights.push(0.6 * Math.exp(-speed / STOP_SPEED));
  const total = weights.reduce((s, w) => s + w, 0);
  return weights.map((w, k) => {
    const stopping = k === TURN_OFFSETS.length;
    const omega = stopping ? turn : turn + TURN_OFFSETS[k];
    let [px, py, h, v] = [x, y, heading, speed];
    const points: [number, number][] = [[px, py]];
    for (let t = 0; t < HORIZON_S; t += SCAN_S) {
      if (stopping) v = Math.max(0, v - (speed / HORIZON_S) * SCAN_S);
      h += omega * SCAN_S;
      px += v * Math.cos(h) * SCAN_S;
      py += v * Math.sin(h) * SCAN_S;
      points.push([px, py]);
    }
    return { points, p: w / total };
  });
}

export function FuturesOverlay({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let estimate: Estimate | null = null;
    let cursor: [number, number] | null = null;
    let moved = false;
    let heading = 0;
    let turn = 0;
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
      cursor = [event.clientX, event.clientY];
      moved = true;
      lastMove = performance.now();
    };

    const scan = () => {
      if (estimate) estimate = predict(estimate, SCAN_S);
      if (moved && cursor) estimate = estimate ? update(estimate, cursor[0], cursor[1]) : start(cursor[0], cursor[1]);
      moved = false;
      if (!estimate) return;
      const [, , vx, vy] = estimate.mean;
      if (Math.hypot(vx, vy) < MIN_SPEED) return;
      const next = Math.atan2(vy, vx);
      const change = Math.atan2(Math.sin(next - heading), Math.cos(next - heading));
      turn = 0.8 * turn + 0.2 * (change / SCAN_S);
      heading = next;
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      // After a hidden tab the scans resume from now; replaying every missed
      // one would stall the first frame back.
      if (now - lastScan > 1000) lastScan = now - SCAN_S * 1000;
      while (now - lastScan >= SCAN_S * 1000) {
        lastScan += SCAN_S * 1000;
        scan();
      }
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (now - lastMove > IDLE_OFF_MS) onDone();
      if (!estimate) return;
      const [x, y, vx, vy] = estimate.mean;
      const speed = Math.hypot(vx, vy);
      if (speed < MIN_SPEED) return;
      const all = futures(x, y, heading, speed, Math.max(-6, Math.min(6, turn)));
      const best = all.reduce((a, b) => (b.p > a.p ? b : a));
      for (const f of all) {
        context.strokeStyle = f === best ? "#f29a4a" : "#ffffff";
        context.globalAlpha = f === best ? 1 : 0.15 + 0.7 * f.p;
        context.lineWidth = f === best ? 1.5 : 1;
        context.beginPath();
        f.points.forEach(([px, py], i) => (i ? context.lineTo(px, py) : context.moveTo(px, py)));
        context.stroke();
        const [ex, ey] = f.points[f.points.length - 1];
        context.fillStyle = context.strokeStyle;
        context.fillRect(ex - 2, ey - 2, 4, 4);
      }
      context.globalAlpha = 1;
      context.fillStyle = "#f29a4a";
      context.font = "11px ui-monospace, monospace";
      context.fillText(`6 futures · ${Math.round(best.p * 100)}%`, x + 14, y - 12);
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

  return <canvas ref={canvasRef} className={styles.trackerCanvas} aria-hidden="true" data-egg="futures" />;
}
