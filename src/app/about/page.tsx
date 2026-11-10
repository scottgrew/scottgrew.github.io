import { Page } from "@/components/Page";
import { SocialLink } from "@/components/SocialLink";
import { USCMark } from "@/components/USCMark";
import { about, home } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";
import styles from "./about.module.css";

export const metadata = buildMetadata(about.title, about.body[0], "/about/");

export default function AboutPage() {
  return (
    <Page title={about.title} transitionName="title-about">
      <div className={styles.affiliation}>
        <USCMark height={52} />
        <p>
          <span>University of Southern California</span>
          <span>Viterbi School of Engineering</span>
        </p>
      </div>
      {about.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <ul className={styles.links}>
        {home.links.map((link) => (
          <li key={link.href}>
            <SocialLink link={link} arrow />
          </li>
        ))}
      </ul>
    </Page>
  );
}
