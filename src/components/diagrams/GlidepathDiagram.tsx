import { Arrowheads, Edge, Group, Node } from "./parts";
import styles from "./Diagram.module.css";

// Glidepath's loop: the simulated sensors feed the two filters, their
// estimate drives guidance and the autopilot, and the autopilot's commands
// fly the JSBSim aircraft, whose sensors feed the next cycle (the accent loop).
const ID = "dg-glidepath";
const ARROW = `${ID}-arrow`;
const ARROW_ACCENT = `${ID}-arrow-accent`;

export function GlidepathDiagram({ label }: { label: string }) {
  return (
    <div className={styles.scroll}>
      <svg viewBox="0 0 690 672" className={`${styles.svg} ${styles.wide}`} role="img" aria-label={label}>
        <Arrowheads id={ID} />

        <Node x={320} y={0} w={220} lines={["JSBSim Cessna 172", "steps the aircraft at 120 Hz"]} />
        <Edge d="M 320 58 L 320 106" marker={ARROW} />
        <Node x={320} y={108} w={260} lines={["Simulated sensors", "IMU, GNSS, barometer,", "magnetometer, pitot, radar"]} />

        <Group x={8} y={206} w={624} h={454} label="every 40 Hz cycle" />
        <Edge d="M 270 184 C 270 214, 190 212, 190 238" marker={ARROW} />
        <Edge d="M 370 184 C 370 214, 450 212, 450 238" marker={ARROW} />
        <Node x={190} y={240} w={180} lines={["Attitude filter", "Mahony, complementary"]} />
        <Node x={450} y={240} w={180} lines={["Navigation filter", "linear Kalman filter"]} />
        {/* The navigation filter rotates the accelerometer by the attitude. */}
        <Edge d="M 280 269 L 358 269" marker={ARROW} />

        <Edge d="M 190 298 C 190 320, 280 316, 280 338" marker={ARROW} />
        <Edge d="M 450 298 C 450 320, 360 316, 360 338" marker={ARROW} />
        <Node x={320} y={340} w={240} lines={["Estimate", "position, attitude,", "speed, height"]} />
        <Edge d="M 320 416 L 320 448" marker={ARROW} />
        <Node x={320} y={450} w={250} lines={["Guidance and landing", "approach, flare, de-crab,", "takeoff"]} />
        <Edge d="M 320 526 L 320 558" marker={ARROW} />
        <Node x={320} y={560} w={250} lines={["Autopilot", "PID loops to elevator,", "aileron, rudder, throttle"]} />

        {/* The commands fly the aircraft, whose sensors feed the next cycle. */}
        <Edge d="M 445 598 L 662 598 L 662 29 L 432 29" marker={ARROW_ACCENT} accent />
        <text x={676} y={314} textAnchor="middle" transform="rotate(90 676 314)" className={styles.loopLabel}>
          commands
        </text>
      </svg>
    </div>
  );
}
