import { Reveal } from "./Reveal";
import styles from "./eggs.module.css";

// Easter egg on the Showdown page: hover the game tree to see the solver
// learn. Exploitability against training iterations from one real 8-thread
// run (cfr runs/rih_409M.log), on log-log axes, with the strategy Gilpin and
// Sandholm published in 2007 as the dashed line it crosses.
const RUN: [number, number][] = [
  [1.6e6, 5.4523], [3.2e6, 3.5938], [6.4e6, 2.1704], [1.28e7, 1.2765], [2.56e7, 0.7562],
  [5.12e7, 0.4364], [1.024e8, 0.2631], [2.048e8, 0.161], [4.096e8, 0.1022],
];
const PUBLISHED = 0.805;
const [W, H, L, R, T, B] = [260, 150, 34, 10, 12, 24];
const xOf = (i: number) => L + ((Math.log10(i) - Math.log10(1.6e6)) / (Math.log10(4.096e8) - Math.log10(1.6e6))) * (W - L - R);
const yOf = (e: number) => T + ((Math.log10(6) - Math.log10(e)) / (Math.log10(6) - Math.log10(0.08))) * (H - T - B);

export function ConvergenceCurve({ children }: { children: React.ReactNode }) {
  const d = RUN.map(([i, e], k) => `${k ? "L" : "M"} ${xOf(i).toFixed(1)} ${yOf(e).toFixed(1)}`).join(" ");
  const panel = (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Exploitability falling from 5.45 to 0.10 chips per hand over 409.6 million iterations, crossing the published 0.805">
        <line x1={L} y1={yOf(PUBLISHED)} x2={W - R} y2={yOf(PUBLISHED)} className={styles.reference} />
        <text x={W - R} y={yOf(PUBLISHED) - 4} textAnchor="end" className={styles.axis}>published 0.805</text>
        <path d={d} className={styles.line} />
        {RUN.map(([i, e]) => (
          <circle key={i} cx={xOf(i)} cy={yOf(e)} r={2} className={styles.dot} />
        ))}
        <text x={L - 4} y={yOf(5.4523) + 3} textAnchor="end" className={styles.axis}>5.45</text>
        <text x={L - 4} y={yOf(0.1022) + 3} textAnchor="end" className={styles.axis}>0.10</text>
        <text x={L} y={H - 6} className={styles.axis}>1.6M</text>
        <text x={W - R} y={H - 6} textAnchor="end" className={styles.axis}>410M iterations</text>
      </svg>
      <figcaption>Chips a perfect opponent wins per hand, one training run</figcaption>
    </>
  );
  return <Reveal label="Show how the solver converged" panel={panel}>{children}</Reveal>;
}
