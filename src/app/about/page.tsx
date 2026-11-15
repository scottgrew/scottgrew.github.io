import { Page } from "@/components/Page";
import { USCMark } from "@/components/USCMark";
import { about } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";
import styles from "./about.module.css";

export const metadata = buildMetadata(about.title, about.body[0], "/about/");

export default function AboutPage() {
  return (
    <Page title={about.title} transitionName="title-about">
      <div className={styles.intro}>
        {/* Static export: images are unoptimized, and the file is pre-sized to 256px. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.portrait}
          src={about.portrait.src}
          alt={about.portrait.alt}
          width={144}
          height={144}
          draggable={false}
          decoding="async"
        />
        <div className={styles.affiliation}>
          <USCMark height={52} />
          <p>
            <span>University of Southern California</span>
            <span>Viterbi School of Engineering</span>
          </p>
        </div>
      </div>
      {about.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </Page>
  );
}
