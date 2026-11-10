"use client";

import Link from "next/link";
import { InnerPanel } from "@/components/InnerPanel";
import styles from "./not-found.module.css";

const bars = [
  { label: "/throughline", value: 0.412 },
  { label: "/motionnet", value: 0.331 },
  { label: "/showdown", value: 0.254 },
  { label: "this page", value: 0.003 },
];

export default function NotFound() {
  return (
    <InnerPanel title="404">
      <p>Out of distribution.</p>
      <p className={styles.chartTitle}>p(page | url)</p>
      <div className={styles.chart} role="img" aria-label="URL distribution chart">
        {bars.map((bar) => (
          <div key={bar.label} className={styles.row}>
            <span className={styles.label}>{bar.label}</span>
            <div className={styles.track}>
              <div
                className={styles.bar}
                style={{ width: `${bar.value * 100}%` }}
              />
            </div>
            <span className={`${styles.value} mono`}>{bar.value.toFixed(3)}</span>
          </div>
        ))}
      </div>
      <Link href="/" className={styles.homeLink}>
        Back to home
      </Link>
    </InnerPanel>
  );
}
