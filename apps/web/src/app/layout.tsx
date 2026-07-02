import type { Metadata } from "next";
import { Cinzel, Original_Surfer, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

// Display / headings / logo — elegant Roman serif.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Relaxed accent face for select labels / flourishes.
const surfer = Original_Surfer({
  variable: "--font-surfer",
  subsets: ["latin"],
  weight: ["400"],
});

// Body / UI — highly readable sans.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Wardrobe — Design your outfits",
  description:
    "A minimal, self-hosted wardrobe manager and drag-and-drop outfit designer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Dark mode is the default theme (no `.light` class present).
    <html
      lang="en"
      className={`${cinzel.variable} ${surfer.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
