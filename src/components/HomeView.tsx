"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { home, navItems } from "@/content/site";
import { SGMark } from "@/components/SGMark";
import { LinkButton } from "@/components/LinkButton";
import { SkipConnection } from "@/components/SkipConnection";
import styles from "./HomeView.module.css";

function readReturning(): boolean {
  if (typeof window === "undefined") return false;
  const fromClose = sessionStorage.getItem("home-return") === "1";
  if (fromClose) sessionStorage.removeItem("home-return");
  return fromClose;
}

export function HomeView() {
  const [isReturning] = useState(() => readReturning());
  const columnRef = useRef<HTMLDivElement>(null);
  const upperLineRef = useRef<HTMLDivElement>(null);
  const lowerLineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReturning) {
      document.documentElement.dataset.homeReady = "return";
      return;
    }

    const onReady = () => {
      document.documentElement.dataset.homeReady = "in";
    };

    window.addEventListener("background-ready", onReady);
    if (document.querySelector('[data-load-done="true"]')) {
      onReady();
    }
    return () => window.removeEventListener("background-ready", onReady);
  }, [isReturning]);

  const rootClass = [
    styles.home,
    isReturning ? styles.returnIn : styles.animateIn,
  ].join(" ");

  return (
    <main className={rootClass}>
      <div ref={columnRef} className={styles.column}>
        <SkipConnection
          columnRef={columnRef}
          upperLineRef={upperLineRef}
          lowerLineRef={lowerLineRef}
          contentRef={contentRef}
        />
        <div className={styles.markWrap}>
          <SGMark size={88} className="homeMark" />
        </div>
        <div ref={upperLineRef} className={`${styles.line} ${styles.line1}`} />
        <div ref={contentRef} className={styles.contentBox}>
          <h1 className={styles.title}>{home.name}</h1>
          <p className={styles.taglines}>
            {home.tagline1}
            <br />
            {home.tagline2}
          </p>
        </div>
        <div ref={lowerLineRef} className={`${styles.line} ${styles.line2}`} />
        <nav className={styles.navRow} aria-label="Projects">
          {navItems.map((item) => (
            <LinkButton key={item.href} href={item.href}>
              {item.label}
            </LinkButton>
          ))}
        </nav>
        <footer className={styles.footer}>
          <div className={styles.socials}>
            {home.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.textLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
