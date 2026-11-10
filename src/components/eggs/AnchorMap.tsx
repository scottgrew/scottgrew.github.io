import { Reveal } from "./Reveal";
import styles from "./eggs.module.css";

// Easter egg on the MotionNet page: hover the six paths to see where they
// come from, the 54 typical destinations fitted for cars by k-means over the
// endpoints of every recorded 8-second path in the training data
// (training_anchors_54_8s.npz). Metres in the car's own frame: x ahead,
// y to the left; the car sits at the origin, facing right.
const ANCHORS: [number, number][] = [
  [10, -0.1], [16.7, 0], [3.6, -0.1], [24, -0.1], [31.4, 0.1], [39.4, 0], [47.6, 0.1], [56.4, 0.1], [65.4, 0.2],
  [75, 0.4], [85, 0.1], [95.4, 0.5], [119.4, 0.1], [107.1, 0.1], [11, -11.3], [20.9, 11.9], [132, 0.2], [145.8, -0.1],
  [6.8, 11.6], [11.5, -24.1], [21.9, -14.2], [160.6, -0.3], [36.5, 15.1], [33.1, 50.4], [23.9, -30.5], [37.4, 34],
  [19, 40.2], [12.3, 25.6], [26.8, 25.7], [12.5, -40.2], [23.1, -49.6], [36.3, -15.6], [53.3, 18.7], [34, 68.2],
  [54.1, -17.7], [16.1, 57.7], [179.8, -0.5], [41.2, -37.7], [20.9, -65.5], [56.7, 41.9], [55.9, 64.4], [77.4, -15.3],
  [78.9, 19.6], [108, 16.3], [-21.4, 16.3], [104, -16.9], [45.6, -64.2], [133.4, -21.2], [72.3, -47], [84.6, 47.3],
  [139.4, 18.7], [-9.9, 44.9], [211.3, 0.3], [253.1, 3],
];
const [W, H, PAD] = [260, 150, 12];
const SCALE = (W - 2 * PAD) / (253.1 + 21.4);
const px = (x: number) => PAD + (x + 21.4) * SCALE;
const py = (y: number) => H / 2 - y * SCALE;

export function AnchorMap({ children }: { children: React.ReactNode }) {
  const panel = (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="54 typical destinations for cars, spread ahead, left and right of the car">
        {ANCHORS.map(([x, y]) => (
          <line key={`l${x},${y}`} x1={px(0)} y1={py(0)} x2={px(x)} y2={py(y)} className={styles.faint} />
        ))}
        {ANCHORS.map(([x, y]) => (
          <circle key={`d${x},${y}`} cx={px(x)} cy={py(y)} r={2} className={styles.dot} />
        ))}
        <rect x={px(0) - 4} y={py(0) - 2.5} width={8} height={5} className={styles.car} />
      </svg>
      <figcaption>54 typical destinations for cars, fitted from training paths</figcaption>
    </>
  );
  return <Reveal label="Show the 54 destinations behind the six paths" panel={panel}>{children}</Reveal>;
}
