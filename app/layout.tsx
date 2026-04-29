import type { Metadata } from "next";
import { Playfair_Display, Poppins, Space_Grotesk } from "next/font/google";
import './globals.css';

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
  title: "La Grande Classe",
  description: "Parcours d'apprentissage editorialise dans une interface Next.js.",
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
        {children}
      </body>
    </html>
  );
}
