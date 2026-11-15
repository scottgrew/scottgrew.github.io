import { Arrowheads, Edge, Group, Node } from "./parts";
import styles from "./Diagram.module.css";

// Throughline's loop: each frame the filter predicts every track, the
// Hungarian algorithm matches the new boxes to them, and the three outcomes
// update the tracks, which feed the next frame (the accent loop).
const ID = "dg-throughline";
const ARROW = `${ID}-arrow`;
const ARROW_ACCENT = `${ID}-arrow-accent`;

export function ThroughlineDiagram({ label }: { label: string }) {
  return (
    <div className={styles.scroll}>
      <svg viewBox="0 0 690 652" className={`${styles.svg} ${styles.wide}`} role="img" aria-label={label}>
        <Arrowheads id={ID} />

        <Node x={320} y={0} w={220} lines={["Waymo LiDAR scans", "and detector boxes"]} />
        <Edge d="M 320 58 L 320 108" marker={ARROW} />

        <Group x={8} y={82} w={624} h={346} label="every frame" />
        <Node x={320} y={110} w={250} lines={["Extended Kalman filter", "move each known object", "by its speed and turn rate"]} />
        <Edge d="M 320 186 L 320 210" marker={ARROW} />
        <Node x={320} y={212} w={250} lines={["Hungarian algorithm", "match boxes to objects,", "far-apart pairs thrown out"]} />

        <Edge d="M 270 288 C 270 312, 112 306, 112 330" marker={ARROW} />
        <Edge d="M 320 288 L 320 330" marker={ARROW} />
        <Edge d="M 370 288 C 370 312, 528 306, 528 330" marker={ARROW} />
        <Node x={112} y={332} w={190} lines={["Matched", "update with the new box"]} />
        <Node x={320} y={332} w={190} lines={["Box with no match", "start a new track"]} />
        <Node x={528} y={332} w={190} lines={["Object with no match", "coast, drop after", "five misses"]} />

        <Edge d="M 112 390 C 112 440, 270 430, 270 468" marker={ARROW} />
        <Edge d="M 320 390 L 320 468" marker={ARROW} />
        <Edge d="M 528 408 C 528 445, 370 430, 370 468" marker={ARROW} />
        <Node x={320} y={470} w={220} lines={["Tracks", "ID, position,", "speed, turn rate"]} />

        {/* The tracks are what the filter predicts from on the next frame. */}
        <Edge d="M 430 508 L 662 508 L 662 148 L 447 148" marker={ARROW_ACCENT} accent />
        <text x={676} y={328} textAnchor="middle" transform="rotate(90 676 328)" className={styles.loopLabel}>
          next frame
        </text>

        <Edge d="M 290 546 C 290 568, 210 566, 210 588" marker={ARROW} />
        <Edge d="M 350 546 C 350 568, 440 566, 440 588" marker={ARROW} />
        <Node x={210} y={590} w={170} lines={["Live 3D view"]} />
        <Node x={440} y={590} w={200} lines={["Scored by Waymo's", "tracking metrics"]} />
      </svg>
    </div>
  );
}
