A C++20 program that learns a strategy for Rhode Island Hold'em, a two-player
poker game used in research, and scores it against the strategy Gilpin and
Sandholm published ([J. ACM 2007](https://doi.org/10.1145/1284320.1284324)).

## Results

Chips a perfect opponent wins per hand (exploitability; lower is better, 0 is
perfect):

| Strategy | Exploitability |
|---|---|
| Gilpin and Sandholm | 0.805 |
| This project | 0.094 ± 0.001 |

Ours: 5 seeds, 409.6M iterations, 332 ± 20 s of training on a 16-thread
laptop. Training scales 10× from 1 to 16 threads.

## Method

![Diagram of how showdown fits together](/media/diagrams/showdown.svg)

- **Card grouping** merges hands that play identically.
- **Training** is Monte Carlo CFR: self-play that shifts toward actions it
  regrets not taking, on lock-free shared tables.
- **Best response** finds the strongest counter-strategy exactly, in one pass.
