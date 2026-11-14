// The site's words live here, except each project page's write-up, which is
// that project's README (minus build steps) in src/content/readmes/<slug>.md.
// Each summary is the page's search and link-preview description.

export type SiteLink = { label: string; href: string };

export type Project = {
  slug: string;
  title: string;
  demo?: { src: string; width: number; height: number; label: string; caption: string };
  summary: string;
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
    summary: "A self-driving car's lidar sweeps the street about ten times a second, and each sweep comes back as a new set of boxes: a car here, a person there. Nothing says which box in this sweep is which box from the last one.",
    code: `${github}/ThroughLine-LiDar_Tracker`,
  },
  {
    slug: "motionnet",
    title: "MotionNet",
    demo: {
      src: "/media/motionnet.mp4",
      width: 836,
      height: 636,
      label: "A busy intersection from above, with orange paths curving ahead of the cars MotionNet is predicting",
      caption: "Orange boxes are the cars MotionNet is predicting, and the orange lines are its possible paths for each. The white box is the self-driving car.",
    },
    summary: "MotionNet watches one second of a real street scene and predicts where every car, cyclist and pedestrian will be over the next eight seconds.",
    code: `${github}/MotionNet-avPrediction`,
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
