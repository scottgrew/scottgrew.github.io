"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewTransition, useEffect, useRef, useState } from "react";
import { home, navItems, titleTransition } from "@/content/site";
import { Eggs } from "./Eggs";
import { InfoLine } from "./InfoLine";
import { Shortcuts } from "./Shortcuts";
import { NameCloud } from "./NameCloud";
import { SGMark } from "./SGMark";
import { SkipConnection } from "./SkipConnection";
import styles from "./SiteFrame.module.css";

// How long the first-load entrance runs before its class is dropped, so the
// stagger plays once per visit and never again on later navigations.
const INTRO_MS = 1800;

// "/throughline/" and "/throughline" are the same page.
function normalize(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
}

function Nav({ current, compact }: { current: string; compact: boolean }) {
  return (
    <ViewTransition name="site-nav">
      <nav aria-label="Main" className={compact ? styles.navCompact : styles.nav}>
        {navItems.map((item) => {
          const active = normalize(item.href) === current;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={styles.navLabel}
                style={active ? undefined : { viewTransitionName: titleTransition(item.href) }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </ViewTransition>
  );
}

function Mark({ size, xor = false }: { size: number; xor?: boolean }) {
  return (
    <ViewTransition name="site-mark">
      <Link href="/" className={styles.markLink} aria-label="Scott Grew, home">
        <SGMark size={size} xor={xor} />
      </Link>
    </ViewTransition>
  );
}

function HomeColumn({ current }: { current: string }) {
  const columnRef = useRef<HTMLDivElement>(null);
  const upperRef = useRef<HTMLDivElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={columnRef} className={styles.column}>
      <SkipConnection column={columnRef} upper={upperRef} lower={lowerRef} box={boxRef} />
      <div className={`${styles.step} ${styles.s1}`}>
        <Mark size={88} />
      </div>
      <div ref={upperRef} className={`${styles.line} ${styles.step} ${styles.s2}`} />
      <div ref={boxRef} className={`${styles.box} ${styles.step} ${styles.s3}`}>
        <ViewTransition name="site-name">
          <NameCloud text={home.name} className={styles.name} />
        </ViewTransition>
        <p className={styles.subtitle}>{home.subtitle}</p>
      </div>
      <div ref={lowerRef} className={`${styles.line} ${styles.step} ${styles.s4}`} />
      <div className={`${styles.step} ${styles.s5}`}>
        <Nav current={current} compact={false} />
      </div>
      <ul className={`${styles.socials} ${styles.step} ${styles.s6}`}>
        {home.links.map((link) => (
          <li key={link.href}>
            <a href={link.href} rel="noopener noreferrer" target="_blank">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopBar({ current }: { current: string }) {
  return (
    <div className={styles.bar}>
      <div className={styles.brand}>
        <Mark size={40} xor />
        <ViewTransition name="site-name">
          <Link href="/" className={styles.barName}>
            {home.name}
          </Link>
        </ViewTransition>
      </div>
      <Nav current={current} compact />
    </div>
  );
}

// The frame persists across every page. On the home page it is the centred
// Dimension column; anywhere else it is a slim bar along the top, and the
// shared view-transition names make the mark, the name and the nav glide
// between the two layouts instead of cutting.
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const current = normalize(usePathname());
  const isHome = current === "/";
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <div className={styles.shade} data-view={isHome ? "home" : "page"} aria-hidden="true" />
      <Eggs active={isHome} />
      <Shortcuts />
      {isHome ? <InfoLine /> : null}
      <header
        className={`${styles.frame} ${isHome ? styles.homeFrame : styles.barFrame} ${
          intro ? styles.intro : ""
        }`}
        data-view={isHome ? "home" : "page"}
      >
        {isHome ? <HomeColumn current={current} /> : <TopBar current={current} />}
      </header>
      <ViewTransition name="page-content">
        <div key={current} className={`${styles.content} ${intro ? styles.introContent : ""}`}>
          {children}
        </div>
      </ViewTransition>
    </>
  );
}
