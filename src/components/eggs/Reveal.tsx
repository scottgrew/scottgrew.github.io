"use client";

import { useState } from "react";
import styles from "./eggs.module.css";

// Shows a small panel under a project drawing while it is hovered (or after
// a tap, on touch screens). Used by the MotionNet and Showdown eggs.
export function Reveal({ label, panel, children }: { label: string; panel: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.revealWrap} onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
      <button type="button" className={styles.trigger} aria-label={label} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {children}
      </button>
      {open ? <figure className={styles.panel}>{panel}</figure> : null}
    </div>
  );
}
