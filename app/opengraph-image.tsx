import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "La Grande Classe, plateforme d'apprentissage adaptative.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const logoPath = path.join(process.cwd(), "public", "favicon", "logo-lgc-apprentissage.png");
const logoDataUri = `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #f5f0e8 0%, #dceff1 45%, #8dcfd6 100%)",
          color: "#112a36",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -100,
            width: 520,
            height: 520,
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.28)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: "9999px",
            background: "rgba(17, 42, 54, 0.08)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            <img
              src={logoDataUri}
              alt=""
              width={88}
              height={88}
              style={{ borderRadius: 24 }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2.5 }}>
                LA GRANDE CLASSE
              </div>
              <div style={{ fontSize: 24, opacity: 0.82 }}>
                Plateforme d'apprentissage adaptative
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 860,
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 72,
                lineHeight: 1.02,
                fontWeight: 800,
              }}
            >
              Apprendre mieux.
              <br />
              Progresser durablement.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.3,
                opacity: 0.88,
              }}
            >
              Parcours editorialisés, mémorisation espacée et suivi de progression.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 21,
              fontWeight: 600,
              opacity: 0.85,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "9999px",
                background: "#112a36",
              }}
            />
            Classe virtuelle
          </div>
        </div>
      </div>
    ),
    size,
  );
}
