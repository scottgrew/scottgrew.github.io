"use client";

import { useEffect, useState } from "react";
import styles from "./InfoLine.module.css";

// Scott's local time in the corner of the home page. It is rendered only
// after mount, so the static HTML never carries a stale time.
const FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
});

export function InfoLine() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(FORMAT.format(new Date()));
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 20_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  return time ? <p className={styles.line}>Los Angeles · {time}</p> : null;
}
