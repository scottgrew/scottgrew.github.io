export type SiteLink = { label: string; href: string };

export type DemoMedia = { src: string; alt: string; caption: string };

export type SectionItem = { title: string; body: string };

export type SectionTable = {
  caption?: string;
  head: string[];
  rows: string[][];
};

export type ProjectSection = {
  heading: string;
  paragraphs?: string[];
  trailingParagraphs?: string[];
  items?: SectionItem[];
  table?: SectionTable;
  commands?: string[];
  after?: string;
};

export type Project = {
  slug: string;
  title: string;
  stack: string;
  summary: string;
  demo?: DemoMedia;
  sections: ProjectSection[];
  links: SiteLink[];
};

export const home = {
  name: "Scott Grew",
  tagline1: "MS Computer Science · USC",
  tagline2: "Tracking · Motion prediction · Game solving",
  links: [
    { label: "GitHub", href: "https://github.com/Scott-Grew" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/scottgrew",
    },
  ] as SiteLink[],
};

export const about = {
  title: "About",
  paragraphs: [
    "I'm a master's student in computer science at USC, graduating in May 2028. Before USC I took post-baccalaureate computer science and mathematics coursework at Orange Coast College, with a 4.0.",
    "At Orange Coast I was a founding board member of the Micromouse club, where I ran lab sessions on maze-solving algorithms (flood fill, A*, Dijkstra, D* Lite) and prototyped time-of-flight distance sensing on Arduino. My team of four won first place at HackOC 2025 with a calculus tutor that reads handwritten work from a photo and flags the first step that does not follow.",
    "The three projects here are personal projects. Each one is scored by an outside measure: Waymo's evaluator for the first two, and an exact best response against a published strategy for the third.",
  ],
  links: home.links,
};

export const projects: Project[] = [
  {
    slug: "throughline",
    title: "Throughline",
    stack: "C++ · Eigen · Docker",
    summary:
      "A live C++ tracker for road users in Waymo lidar data. It takes a detector's boxes as each scan arrives, keeps one ID per object through missed scans, and forecasts each object's path three seconds ahead.",
    demo: {
      src: "/media/throughline-turn.gif",
      alt: "Tracked cars as blue boxes moving through a turn, each with a forecast line ahead of it",
      caption:
        "Blue boxes are tracked cars. The line in front of each one is where the tracker expects it to go.",
    },
    sections: [
      {
        heading: "The problem",
        paragraphs: [
          "A self-driving car's detector reports a set of boxes every 100 milliseconds. The boxes carry no identity: a car seen now and the same car a tenth of a second ago are unrelated until something links them. The detector also misses objects and reports some that are not there.",
          "A tracker has to link boxes into objects, keep an object's identity while it is briefly hidden, and finish each update before the next scan arrives.",
        ],
      },
      {
        heading: "Decisions",
        items: [
          {
            title: "Real detector output, not labels.",
            body: "The input is CasA's published detections on Waymo's validation set, about 51 boxes per frame against 19 labelled objects. With no score cutoff, the tracker followed steady false boxes and vehicle accuracy was 0.00 to 0.46 across the three clips. Dropping boxes that score under 0.5, and pedestrian boxes under 0.7, raised it to 0.30 to 0.72.",
          },
          {
            title: "When to believe a box.",
            body: "A new object is reported after three matched scans in a row, and a confirmed object is dropped after five missed scans, half a second. Waiting gives up a fraction of a second of warning; reporting at once would chase noise.",
          },
          {
            title: "Motion and matching.",
            body: "Each object runs an extended Kalman filter over position, heading, speed and turn rate. New boxes are matched to the predictions with the Hungarian algorithm, and pairs too far apart statistically are never matched. The filter's measurement noise is the detector's own error against the labels, measured on each clip.",
          },
        ],
      },
      {
        heading: "Results",
        paragraphs: [
          "Waymo's own scoring code, at its LEVEL_2 difficulty. MOTA is the standard tracking score, where 1.0 means no mistakes.",
        ],
        table: {
          head: ["Clip", "Cars", "Pedestrians"],
          rows: [
            ["Fast road, 63 km/h", "0.30", "0.22"],
            ["Crawling through a junction", "0.54", "0.57"],
            ["Slow turn, 21 km/h", "0.72", "0.34"],
          ],
          caption:
            "Most lost points on the fast road are misses: the detector does not see distant cars that the labels contain.",
        },
        trailingParagraphs: [
          "A frame takes 2 to 4 milliseconds from read to published at the median, and under 8 milliseconds at the 99th percentile. Scans arrive every 100 milliseconds.",
        ],
      },
      {
        heading: "What broke",
        items: [
          {
            title: "Preparing a clip took over four minutes.",
            body: "Timing each step showed 190 of the 250 seconds went to one data conversion over the whole lidar table. Rewriting it brought preparation to 37 seconds with every laser included, and memory while tracking fell from 276 MB to about 30 MB.",
          },
          {
            title: "A recording that passed every check and showed nothing.",
            body: "The recording decoded cleanly through two independent readers, and the viewer drew an empty grid. Every message named a coordinate frame that nothing ever declared. Publishing the transform from the world frame to the car on every frame fixed it. Only looking at the picture found it.",
          },
          {
            title: "A filter that was too unsure of itself.",
            body: "The consistency test kept failing: the filter claimed more uncertainty than it had. Its process noise was applied equally on both map axes, when a car's acceleration acts along its heading. Building the noise along the heading brought the test statistic to 5.04 against an expected 5.0.",
          },
        ],
      },
      {
        heading: "Tests",
        paragraphs: [
          "The filter is checked against a simulated truth, its Jacobian against finite differences, and the matching against brute force.",
        ],
      },
      {
        heading: "Run it",
        commands: ["make test", "make stage", "make live", "make official"],
        after:
          "Waymo's data cannot be redistributed, so running the clips needs a Waymo Open Dataset account.",
      },
    ],
    links: [
      {
        label: "Code on GitHub",
        href: "https://github.com/Scott-Grew/ThroughLine-LiDar_Tracker",
      },
    ],
  },
  {
    slug: "motionnet",
    title: "MotionNet",
    stack: "Python · PyTorch · Docker",
    summary:
      "A transformer that predicts where cars, cyclists and pedestrians will move over the next eight seconds, from one second of recorded driving.",
    sections: [
      {
        heading: "The problem",
        paragraphs: [
          "From one second of each road user's past, the lane lines, the traffic lights and the traffic nearby, predict the next eight seconds.",
          "A car approaching a junction may turn or go straight. A single prediction would average the two into a path no one drives, so the model gives six possible paths, each with a confidence.",
        ],
      },
      {
        heading: "Decisions",
        items: [
          {
            title: "Typical destinations first.",
            body: "The endpoints of the training paths are clustered into 54 typical destinations for each type of road user, from straight and far to a hard right. The model adjusts each one into a full path and scores how likely it is. At prediction time the 54 are ranked, near-duplicates are dropped, and the six most likely are kept.",
          },
          {
            title: "Everything in the road user's own frame.",
            body: "Before the transformer sees anything, each road user's history, its 47 nearest neighbours and the 256 nearest pieces of map are expressed relative to that road user.",
          },
          {
            title: "Scored only by Waymo.",
            body: "Every reported number comes from Waymo's evaluation server. The training monitor steers runs and is never reported.",
          },
        ],
      },
      {
        heading: "Results",
        paragraphs: [
          "Average distance in metres between the recorded path and the closest of the six predictions. Lower is better.",
        ],
        table: {
          head: ["", "3 s", "5 s", "8 s"],
          rows: [
            ["Cars, validation", "0.35", "0.74", "1.44"],
            ["Cars, test", "0.35", "0.74", "1.43"],
            ["Cars, constant speed", "2.33", "5.47", "10.98"],
            ["Pedestrians, validation", "0.19", "0.37", "0.65"],
            ["Pedestrians, test", "0.19", "0.37", "0.65"],
            ["Pedestrians, constant speed", "0.47", "0.89", "1.55"],
            ["Cyclists, validation", "0.38", "0.71", "1.26"],
            ["Cyclists, test", "0.37", "0.71", "1.28"],
            ["Cyclists, constant speed", "1.14", "2.26", "4.17"],
          ],
          caption:
            "Validation: 44,097 scenes. Test: 44,920 scenes, graded by the server only. Constant speed: a control that holds each road user's speed and heading.",
        },
        trailingParagraphs: [
          "12 million parameters, trained on a quarter of the training split (122,352 scenes) for 20 epochs on a free Kaggle GPU. Not comparable to the public leaderboard.",
        ],
      },
      {
        heading: "What broke",
        items: [
          {
            title: "A confidence head that ignored the scene.",
            body: "An early version gave every scene the same confidences, the frequency of each destination in the training data. Each query's scene-dependent part was small next to its fixed destination part, and a single linear layer could not separate them. A two-layer head did.",
          },
          {
            title: "Data loading that starved the GPU.",
            body: "A 30-minute check on Kaggle read fewer than 10,000 of the 122,352 scene files. Reading each file in one call brought a full pass over the file list to under eight minutes.",
          },
          {
            title: "An archive the server refused.",
            body: "Waymo's server rejected a valid submission. The macOS archiver had added a hidden metadata file beside the predictions. Rebuilding the archive without it was accepted.",
          },
        ],
      },
      {
        heading: "Run it",
        commands: ["make test", "make stage", "make train", "make live"],
        after:
          "Reproducing the table needs a Waymo Open Motion Dataset account; make stage converts Waymo's files into this project's format.",
      },
    ],
    links: [
      {
        label: "Code on GitHub",
        href: "https://github.com/Scott-Grew/MotionNet-avPrediction",
      },
    ],
  },
  {
    slug: "showdown",
    title: "Showdown",
    stack: "C++20",
    summary:
      "A solver for Rhode Island Hold'em, a two-player poker game used as an AI benchmark, scored against the strategy Gilpin and Sandholm published in 2007.",
    sections: [
      {
        heading: "The problem",
        paragraphs: [
          "In poker each player sees their own card but not the opponent's. A strong strategy is one that a perfect opponent, who knows it completely, still cannot beat by much.",
          "That margin is exploitability: the chips per hand the best possible counter-strategy wins against it. Zero is perfect.",
        ],
      },
      {
        heading: "Decisions",
        items: [
          {
            title: "Self-play on lock-free tables.",
            body: "Training is Monte Carlo counterfactual regret minimisation: self-play that shifts toward the actions it regrets not taking. Sixteen threads update shared regret tables with atomic operations and no locks, and training runs 10 times faster than on one thread. The price is that two runs no longer match bit for bit; the spread between them is about 1 percent.",
          },
          {
            title: "A finer card grouping.",
            body: "Gilpin and Sandholm's grouping of equivalent hands is rebuilt exactly, but in the full game it merges some hands that play differently. Training uses a finer grouping instead: 13, 325 and 7,969 groups across the three rounds.",
          },
          {
            title: "An exact score.",
            body: "The best response is computed exactly in one pass over the game, so exploitability is a calculation, not an estimate from sampled hands.",
          },
        ],
      },
      {
        heading: "Results",
        table: {
          head: ["Strategy", "Exploitability (chips per hand)"],
          rows: [
            ["Gilpin and Sandholm, 2007", "0.805"],
            ["Showdown", "0.094 ± 0.001"],
          ],
          caption:
            "Showdown: 5 seeds, 409.6 million iterations, 332 ± 20 seconds of training each on a 16-thread laptop. The published figure is this project's measurement of their strategy file.",
        },
        trailingParagraphs: [
          "The game matches the paper's exact sizes: 6,632,705 deal nodes, 91,224,226 linear-program rows, and 1,237,238 after their grouping.",
        ],
      },
      {
        heading: "What broke",
        items: [
          {
            title: "Tests that silently merged.",
            body: "A square bracket in a test's name made the test runner fold every later test into one entry, so failures could hide. The test command now checks how many tests it discovered.",
          },
          {
            title: "A check that could not fail.",
            body: "Payoffs are built so the two players' winnings always sum to zero, so a zero-sum test passes whatever the bug. The check that matters compares each payoff with the chips each player put in.",
          },
        ],
      },
      {
        heading: "Tests",
        paragraphs: [
          "Tests check fixed outside answers: the paper's sizes, the known value of Kuhn poker (−1/18), and independent reference code. The suite runs clean under AddressSanitizer, UndefinedBehaviorSanitizer and ThreadSanitizer, and CI builds it with Clang on macOS and GCC on Ubuntu.",
        ],
      },
      {
        heading: "Run it",
        commands: [
          "make test",
          "make bench",
          "make headline",
          ".build/release/cfr_play run.bin",
        ],
        after:
          "make headline reproduces the results table in about 30 minutes. cfr_play lets you play against the trained strategy.",
      },
    ],
    links: [
      {
        label: "Code on GitHub",
        href: "https://github.com/Scott-Grew/Showdown-Rhode-Island-Solver",
      },
    ],
  },
];

export const projectOrder = projects.map((p) => p.slug);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const navItems = [
  { label: "THROUGHLINE", href: "/throughline/" },
  { label: "MOTIONNET", href: "/motionnet/" },
  { label: "SHOWDOWN", href: "/showdown/" },
  { label: "ABOUT", href: "/about/" },
] as const;
