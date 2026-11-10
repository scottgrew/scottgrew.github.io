"use client";

import { useEffect } from "react";

// The model summary printed to the developer console, for whoever opens it.
const SUMMARY = `Portfolio(
  (0): Throughline(lidar boxes → tracks, 2–4 ms per frame)
  (1): MotionNet(1 s of history → 6 paths × 8 s)
  (2): Showdown(self-play → 0.094 chips per hand exploitable)
)
try ↑ ↑ ↓ ↓ ← → ← → B A`;

export function ConsoleSummary() {
  useEffect(() => {
    console.log(`%c${SUMMARY}`, "font-family: monospace; color: #f29a4a; line-height: 1.5");
  }, []);
  return null;
}
