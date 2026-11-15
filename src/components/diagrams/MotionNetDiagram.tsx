import { Arrowheads, Edge, Group, Node } from "./parts";
import styles from "./Diagram.module.css";

// MotionNet: the scene, seen from each road user, goes through the encoder;
// the decoder refines one path per anchor; the output (in the accent) is the
// six ranked paths.
const ID = "dg-motionnet";
const ARROW = `${ID}-arrow`;

export function MotionNetDiagram({ label }: { label: string }) {
  return (
    <div className={styles.scroll}>
      <svg viewBox="0 0 640 378" className={`${styles.svg} ${styles.wide}`} role="img" aria-label={label}>
        <Arrowheads id={ID} />

        <Node x={320} y={0} w={180} lines={["Waymo scenes"]} />
        <Edge d="M 290 40 C 290 62, 190 60, 190 82" marker={ARROW} />
        <Edge d="M 350 40 C 350 66, 450 66, 450 91" marker={ARROW} />

        <Node x={190} y={84} w={220} lines={["Each road user's view", "in its own frame"]} />
        <Node x={450} y={93} w={200} lines={["54 typical destinations"]} />

        <Group x={80} y={180} w={480} h={92} label="transformer" />
        <Edge d="M 190 142 L 190 208" marker={ARROW} />
        <Edge d="M 450 133 L 450 208" marker={ARROW} />
        <Node x={190} y={210} w={160} lines={["Encoder"]} />
        <Node x={450} y={210} w={160} lines={["Decoder"]} />
        <Edge d="M 270 230 L 368 230" marker={ARROW} />

        <Edge d="M 450 250 L 450 314" marker={ARROW} />
        <Node x={450} y={316} w={200} lines={["Six ranked", "8-second paths"]} accent />
      </svg>
    </div>
  );
}
