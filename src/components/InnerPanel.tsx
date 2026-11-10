"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./InnerPanel.module.css";

type InnerPanelProps = {
  title: string;
  children: React.ReactNode;
  links?: React.ReactNode;
  footer?: React.ReactNode;
};

export function InnerPanel({ title, children, links, footer }: InnerPanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      panelRef.current?.classList.remove(styles.panel);
      return;
    }
    panelRef.current?.classList.add(styles.panelEnter);
  }, []);

  const goHome = () => {
    sessionStorage.setItem("home-return", "1");
  };

  return (
    <div className={styles.pageShell}>
      <article ref={panelRef} className={styles.panel}>
        <Link
          href="/"
          className={styles.close}
          aria-label="Back to home"
          onClick={goHome}
        >
          ×
        </Link>
        <h2 className={styles.heading}>{title}</h2>
        <div className={styles.body}>{children}</div>
        {links ? <div className={styles.links}>{links}</div> : null}
        {footer}
      </article>
    </div>
  );
}
