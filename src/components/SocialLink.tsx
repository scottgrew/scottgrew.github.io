import Link from "next/link";
import type { SiteLink } from "@/content/site";

// One rule for the GitHub / LinkedIn / Contact links everywhere: external
// links open in a new tab (with an ↗ when `arrow` is set), site pages don't.
export function SocialLink({ link, arrow = false, className }: { link: SiteLink; arrow?: boolean; className?: string }) {
  if (!link.href.startsWith("http")) {
    return (
      <Link href={link.href} className={className}>
        {link.label}
      </Link>
    );
  }
  return (
    <a href={link.href} rel="noopener noreferrer" target="_blank" className={className}>
      {link.label}
      {arrow ? " ↗" : ""}
    </a>
  );
}
