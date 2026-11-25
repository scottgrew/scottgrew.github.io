import { Arrowheads, Edge, Group, Node } from "./parts";
import styles from "./Diagram.module.css";

// Showdown's loop: each self-play iteration samples a game, updates the
// regrets, and regret matching sets the strategy the next iteration plays
// (the accent loop). The average strategy is scored by a best response.
const ID = "dg-showdown";
const ARROW = `${ID}-arrow`;
const ARROW_ACCENT = `${ID}-arrow-accent`;

export function ShowdownDiagram({ label }: { label: string }) {
  return (
    <div className={styles.scroll}>
      <svg viewBox="0 0 690 772" className={`${styles.svg} ${styles.wide}`} role="img" aria-label={label}>
        <Arrowheads id={ID} />

        <Node x={320} y={0} w={240} lines={["Rhode Island Hold'em", "two players, three rounds"]} />
        <Edge d="M 320 58 L 320 106" marker={ARROW} />
        <Node x={320} y={108} w={220} lines={["Card grouping", "merges hands that", "play identically"]} />
        <Edge d="M 320 184 L 320 238" marker={ARROW} />

        <Group x={8} y={206} w={624} h={244} label="self-play" />
        <Node x={320} y={240} w={250} lines={["Monte Carlo CFR", "sample a game, update", "each action's regret"]} />
        <Edge d="M 320 316 L 320 348" marker={ARROW} />
        <Node x={320} y={350} w={250} lines={["Regret matching", "play each action in", "proportion to its regret"]} />

        {/* The strategy from the regrets plays the next sampled game. */}
        <Edge d="M 445 388 L 662 388 L 662 278 L 447 278" marker={ARROW_ACCENT} accent />
        <text x={676} y={333} textAnchor="middle" transform="rotate(90 676 333)" className={styles.loopLabel}>
          next game
        </text>

        <Edge d="M 320 426 L 320 478" marker={ARROW} />
        <Node x={320} y={480} w={230} lines={["Average strategy", "over every iteration"]} />
        <Edge d="M 320 538 L 320 570" marker={ARROW} />
        <Node x={320} y={572} w={250} lines={["Best response", "the strongest counter,", "one pass over the tree"]} />
        <Edge d="M 320 648 L 320 680" marker={ARROW} />
        <Node x={320} y={682} w={250} lines={["Exploitability", "what a perfect opponent", "wins per hand"]} />
      </svg>
    </div>
  );
}
