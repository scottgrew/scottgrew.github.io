"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./eggs.module.css";

// A project drawing that starts a cursor easter egg on click; any click
// anywhere stops it. The click that stops it is ignored as a start, so
// clicking the drawing again does not immediately restart it.
const RESTART_GUARD_MS = 400;

export function ClickEgg({
  name,
  overlay: Overlay,
  children,
}: {
  name: string;
  overlay: React.ComponentType<{ onDone: () => void }>;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  const stoppedAt = useRef(0);
  const stop = useCallback(() => {
    stoppedAt.current = performance.now();
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    window.addEventListener("pointerdown", stop);
    return () => window.removeEventListener("pointerdown", stop);
  }, [active, stop]);

  return (
    <>
      <div
        className={styles.trigger}
        aria-hidden="true"
        data-egg-trigger={name}
        onClick={() => {
          if (performance.now() - stoppedAt.current > RESTART_GUARD_MS) setActive(true);
        }}
      >
        {children}
      </div>
      {active ? <Overlay onDone={stop} /> : null}
    </>
  );
}
