A C++20 program that learns a strategy for Rhode Island Hold'em, a two-player
poker game used in research, and scores it against the strategy Gilpin and
Sandholm published (J. ACM 2007).

## Results

Chips a perfect opponent wins per hand (exploitability; lower is better, 0 is
perfect):

| Strategy | Exploitability |
|---|---|
| Gilpin and Sandholm | 0.805 |
| This project | 0.094 ± 0.001 |

Averaged over 5 seeds, each about 5½ minutes of training (409.6M iterations)
on a 16-thread laptop. Training runs 10× faster on 16 threads than on one.

The game reproduces the paper's sizes exactly: 6,632,705 deal nodes and
91,224,226 sequence-form LP rows.

## Method

![Diagram of how showdown fits together](/media/diagrams/showdown.svg)

- **Card grouping** merges hands that play identically. The authors' released
  grouping also merges some hands that play differently in the full game, so
  training uses a finer one.
- **Training** is Monte Carlo CFR: self-play that shifts toward actions it
  regrets not taking, on lock-free shared tables.
- **Best response** finds the strongest counter-strategy exactly, in one pass.
