import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

// Display — classic Roman capitals for the wordmark and page titles.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Editorial serif — italics for taglines, descriptions, refined accents.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// Body / UI — geometric sans with a classic, couture feel.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Wardrobe — The Private Atelier",
  description:
    "A private wardrobe atelier — curate your pieces and compose outfits on an interactive canvas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Light ivory is the default theme (`.dark` switches to the evening palette).
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
