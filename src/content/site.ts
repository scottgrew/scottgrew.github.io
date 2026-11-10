// Every word on the site lives here, written for someone who has never
// opened the repositories. The GitHub link on each page is where an engineer
// goes for depth. Every number matches the project records.

export type SiteLink = { label: string; href: string };

export type Project = {
  slug: string;
  title: string;
  demo?: { src: string; width: number; height: number; label: string; caption: string };
  body: string[];
  code: string;
};

const github = "https://github.com/scottgrew";

export const home = {
  name: "Scott Grew",
  subtitle: "Computer science at USC",
  links: [
    { label: "GitHub", href: github },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/scottgrew" },
    { label: "Contact", href: "/contact/" },
  ] satisfies SiteLink[],
};

// The contact form posts to Web3Forms, which forwards each message to
// Scott's inbox. The access key is send-only and reaches the browser by
// design, but it is kept out of the repository: builds read it from
// NEXT_PUBLIC_WEB3FORMS_KEY (.env.local on Scott's Mac, a GitHub Actions
// secret for the published site). Without it the form says it isn't
// connected instead of pretending to send.
export const contact = {
  title: "Contact",
  description: "Contact Scott Grew.",
  endpoint: "https://api.web3forms.com/submit",
  accessKey: process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "",
};

export const about = {
  title: "About",
  body: [
    "I'm Scott, a master's student in computer science at USC. Everything here I built on my own time. When I'm not at a keyboard, I'm usually in the mountains.",
  ],
};

export const projects: Project[] = [
  {
    slug: "throughline",
    title: "Throughline",
    demo: {
      src: "/media/throughline-turn.mp4",
      width: 960,
      height: 518,
      label: "Tracked cars shown as blue boxes moving through a turn, each with a line ahead of it showing where it is expected to go",
      caption: "Blue boxes are tracked cars. The line in front of each one is where the tracker expects it to go.",
    },
    body: [
      "A self-driving car's lidar sweeps the street about ten times a second, and each sweep comes back as a new set of boxes: a car here, a person there. Nothing says which box in this sweep is which box from the last one.",
      "Throughline links them, so each car and pedestrian keeps one identity as it moves, even while it's hidden behind something for a moment. It also predicts where each one is going over the next three seconds.",
      "The boxes come from a real detector, which misses things and sees things that aren't there. Letting everything through had the tracker chasing ghosts, so I measured how often the detector was right and set a separate confidence bar for cars and for pedestrians. That took Waymo's tracking score from near zero to as high as 0.72.",
    ],
    code: `${github}/ThroughLine-LiDar_Tracker`,
  },
  {
    slug: "motionnet",
    title: "MotionNet",
    body: [
      "MotionNet watches one second of a real street scene and predicts where every car, cyclist and pedestrian will be over the next eight seconds.",
      "A car at a junction might turn or go straight, and averaging the two gives a path through the curb. So instead of one guess, it gives six possible paths and how likely each one is.",
      "Graded by Waymo's own server on about 45,000 scenes it had never seen, its predictions for cars were off by about 1.4 meters after eight seconds. Assuming everyone keeps going straight at the same speed is off by 11.",
    ],
    code: `${github}/MotionNet-avPrediction`,
  },
  {
    slug: "showdown",
    title: "Showdown",
    body: [
      "Showdown taught itself a small two-player poker game that AI researchers use as a test, by playing against itself hundreds of millions of times.",
      "In poker you can't see the other player's cards, so a good strategy has to hold up even against an opponent who knows exactly how you play. I measure that directly: how much a perfect opponent could win per hand.",
      "Against the strategy published in 2007, a perfect opponent wins 0.805 chips a hand. Against Showdown it wins 0.094.",
    ],
    code: `${github}/Showdown-Rhode-Island-Solver`,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const cv = {
  title: "CV",
  pdf: "/cv/scott-grew-resume.pdf",
  image: "/cv/resume.png",
};

export const navItems: SiteLink[] = [
  ...projects.map((p) => ({ label: p.title, href: `/${p.slug}/` })),
  { label: "About", href: "/about/" },
  { label: "CV", href: "/cv/" },
];

// The view-transition name a nav button shares with its page's title.
export function titleTransition(href: string) {
  return `title-${href.replaceAll("/", "")}`;
}
