import type { Metadata } from "next";
import { Inter, Share_Tech_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

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

const ROOT_DESCRIPTION =
  "Learn2Earn is a Texas nonprofit helping people experiencing homelessness build life skills, complete recovery-focused learning, and earn small verified cash incentives, in partnership with cities, shelters, and local case workers.";

export const metadata: Metadata = {
  title: {
    default: "Learn2Earn, A Hand Up, Not a Handout",
    template: "%s | Learn2Earn",
  },
  description: ROOT_DESCRIPTION,
  applicationName: "Learn2Earn",
  authors: [{ name: "Learn2Earn" }],
  creator: "Learn2Earn",
  publisher: "Learn2Earn",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://learn2earn-usa.com",
  ),
  keywords: [
    "homelessness",
    "nonprofit",
    "Texas nonprofit",
    "life skills",
    "addiction recovery",
    "workforce readiness",
    "case worker tools",
    "incentive-based learning",
    "shelter partnership",
  ],
  openGraph: {
    type: "website",
    siteName: "Learn2Earn",
    title: "Learn2Earn, A Hand Up, Not a Handout",
    description: ROOT_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn2Earn, A Hand Up, Not a Handout",
    description: ROOT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${shareTechMono.variable} ${rajdhani.variable}`}>
      <body>
        {children}
        <NavBar />
      </body>
    </html>
  );
}
