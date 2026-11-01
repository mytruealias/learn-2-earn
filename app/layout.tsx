import type { Metadata } from "next";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { Inter, Share_Tech_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import LearnerShell from "./components/learner/LearnerShell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech-mono",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  ...marketingMetadata(
    "Learn2Earn — supported learning and program oversight",
    "/",
  ),
  alternates: undefined,
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${shareTechMono.variable} ${rajdhani.variable}`}
    >
      <body>
        <LearnerShell>{children}</LearnerShell>
      </body>
    </html>
  );
}
