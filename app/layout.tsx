import type { Metadata } from "next";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { Inter } from "next/font/google";
import "./globals.css";
import ConnectionNotice from "./components/reliability/ConnectionNotice";
import ClientTelemetry from "./components/reliability/ClientTelemetry";
import LearnerShell from "./components/learner/LearnerShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      className={inter.variable}
    >
      <body>
        <ConnectionNotice />
        <ClientTelemetry enabled={process.env.OPERATIONAL_TELEMETRY_ENABLED === "true"} />
        <LearnerShell>{children}</LearnerShell>
      </body>
    </html>
  );
}
