"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/content/site";
import styles from "./Shortcuts.module.css";

// 1 to 5 open the pages in nav order, Esc goes home, ? shows the list.
// Keys typed into a field, or with a modifier held, are left alone.
export function Shortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < navItems.length) {
        setOpen(false);
        router.push(navItems[index].href);
      } else if (event.key === "Escape") {
        setOpen(false);
        router.push("/");
      } else if (event.key === "?") {
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!open) return null;
  return (
    <div className={styles.panel} role="dialog" aria-label="Keyboard shortcuts">
      <ul>
        {navItems.map((item, i) => (
          <li key={item.href}>
            <kbd>{i + 1}</kbd> {item.label}
          </li>
        ))}
        <li>
          <kbd>Esc</kbd> Home
        </li>
        <li>
          <kbd>?</kbd> Close
        </li>
      </ul>
    </div>
  );
}
