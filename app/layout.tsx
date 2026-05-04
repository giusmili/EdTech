import type { Metadata } from "next";
import { Playfair_Display, Poppins, Space_Grotesk } from "next/font/google";
import './globals.css';
import MoleculeBackground from '@/src/MoleculeBackground';

function getMetadataBase() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (explicitUrl) {
    return new URL(explicitUrl);
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (vercelUrl) {
    return new URL(`https://${vercelUrl}`);
  }

  return new URL("http://localhost:3000");
}

const metadataBase = getMetadataBase();
const title = "La Grande Classe";
const description =
  "Plateforme d'apprentissage adaptative avec parcours editorialisés, mémorisation espacée et suivi de progression.";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase,
  title,
  description,
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: title,
    title,
    description,
    url: "/",
    images: [
      {
        url: "/assets/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "La Grande Classe, plateforme d'apprentissage adaptative.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/opengraph-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/favicon/icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/favicon/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/favicon/icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/favicon/icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/favicon/icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/favicon/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/favicon/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon/icon-32x32.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${poppins.className} ${poppins.variable} ${playfair.variable} ${spaceGrotesk.variable}`}
      >
        <MoleculeBackground />
        {children}
      </body>
    </html>
  );
}
