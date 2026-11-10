import { Page } from "@/components/Page";
import { cv } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";
import styles from "./cv.module.css";

export const metadata = buildMetadata(cv.title, "Scott Grew's resume.", "/cv/");

export default function CvPage() {
  return (
    <Page title={cv.title} transitionName="title-cv">
      <a className={styles.download} href={cv.pdf} download="Scott Grew - Resume.pdf">
        Download PDF ↓
      </a>
      <figure className={styles.sheet}>
        {/* A rendering of the PDF's one page; the PDF is the download above. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cv.image} alt="Scott Grew's resume: education, projects, technical skills, leadership and awards." />
      </figure>
    </Page>
  );
}
