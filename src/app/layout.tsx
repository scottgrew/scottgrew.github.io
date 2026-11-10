import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Background } from "@/components/Background";
import { buildMetadata } from "@/lib/metadata";
import { home } from "@/content/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = buildMetadata(
  "Scott Grew",
  `${home.tagline1}. ${home.tagline2}`,
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'"
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <Background />
        {children}
      </body>
    </html>
  );
}
