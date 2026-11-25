A C++20 program that learns a strategy for Rhode Island Hold'em, a two-player poker game used in game-theory research, with Monte Carlo counterfactual regret minimization.

## Results

Exploitability, the chips per hand a perfect opponent wins against the strategy (0 means it cannot be beaten): 0.094 ± 0.001, under 1% of the minimum bet of 10 chips.

Averaged over 5 seeds, each about 5½ minutes of training (409.6M iterations) on 16 threads. The game has 6,632,705 deal nodes.

## Method

![Diagram of how showdown fits together](/media/diagrams/showdown.svg)

- **Card grouping** merges hands that play identically. The grouping training uses may also merge a few hands that play differently in the full game.
- **Training** is Monte Carlo CFR: self-play that shifts toward actions it regrets not taking, on lock-free tables shared by all threads.
- **Best response** finds the strongest counter-strategy in one pass over the game tree; its winnings are the exploitability.
