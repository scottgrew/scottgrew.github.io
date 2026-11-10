import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export const alt = "Scott Grew";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const bgPath = path.join(process.cwd(), "public/media/background.jpg");
  const bg = await readFile(bgPath);
  const bgData = `data:image/jpeg;base64,${bg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#1b1f22",
        }}
      >
        <img
          src={bgData}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.45,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "1px solid #ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: "8px",
            }}
          >
            SG
          </div>
          <p
            style={{
              margin: "32px 0 12px",
              color: "#ffffff",
              fontSize: 42,
              fontWeight: 600,
              letterSpacing: "12px",
            }}
          >
            SCOTT GREW
          </p>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.85)",
              fontSize: 22,
            }}
          >
            MS Computer Science · USC
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
