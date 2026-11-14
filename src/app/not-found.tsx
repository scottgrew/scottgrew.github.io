import Link from "next/link";
import { Page } from "@/components/Page";
import styles from "./not-found.module.css";

// The classifier's verdict on an unknown URL: a softmax over the pages that
// exist, which leaves almost nothing for this one. The three values sum to 1.
const DISTRIBUTION = [
  { label: "/throughline", p: 0.553 },
  { label: "/motionnet", p: 0.444 },
  { label: "this page", p: 0.003 },
];

export default function NotFound() {
  return (
    <Page title="404" lede="Out of distribution.">
      <figure className={styles.chart}>
        <figcaption>p(page | url)</figcaption>
        {DISTRIBUTION.map((row) => (
          <div key={row.label} className={styles.row}>
            <span className={styles.label}>{row.label}</span>
            <span className={styles.track}>
              <span className={styles.bar} style={{ width: `${row.p * 100}%` }} />
            </span>
            <span className={styles.value}>{row.p.toFixed(3)}</span>
          </div>
        ))}
      </figure>
      <Link href="/" className={styles.home}>
        Back to home
      </Link>
    </Page>
  );
}
