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

export const metadata: Metadata = {
  title: {
    default: "Learn 2 Earn",
    template: "%s | Learn 2 Earn",
  },
  description: "A supportive path to stability and growth. Master life skills, earn rewards.",
  applicationName: "Learn 2 Earn",
  authors: [{ name: "Learn 2 Earn" }],
  creator: "Learn 2 Earn",
  publisher: "Learn 2 Earn",
  metadataBase: new URL("https://learn2earn.app"),
  openGraph: {
    type: "website",
    siteName: "Learn 2 Earn",
    title: "Learn 2 Earn",
    description: "A supportive path to stability and growth. Master life skills, earn rewards.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn 2 Earn",
    description: "A supportive path to stability and growth. Master life skills, earn rewards.",
  },
  robots: {
    index: true,
    follow: true,
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
