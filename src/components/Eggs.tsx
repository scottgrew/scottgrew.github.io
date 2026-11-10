"use client";

import { useEffect, useRef } from "react";
import styles from "./Eggs.module.css";

// The model summary printed to the developer console, for whoever opens it.
const SUMMARY = `Portfolio(
  (0): Throughline(lidar boxes → tracks, 2–4 ms per frame)
  (1): MotionNet(1 s of history → 6 paths × 8 s)
  (2): Showdown(self-play → 0.094 chips per hand exploitable)
)
try ↑ ↑ ↓ ↓ ← → ← → B A`;

// Easter eggs that need the browser: a faint dot grid that lights up around
// the cursor like an activation map (desktop pointers only, home page only),
// and the console summary above.
export function Eggs({ active }: { active: boolean }) {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(`%c${SUMMARY}`, "font-family: monospace; color: #f29a4a; line-height: 1.5");
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !active) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let frame = 0;
    let idle = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        field.style.setProperty("--x", `${event.clientX}px`);
        field.style.setProperty("--y", `${event.clientY}px`);
        field.dataset.lit = "true";
      });
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        field.dataset.lit = "false";
      }, 900);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      field.dataset.lit = "false";
    };
  }, [active]);

  return <div ref={fieldRef} className={styles.field} data-lit="false" aria-hidden="true" />;
}
