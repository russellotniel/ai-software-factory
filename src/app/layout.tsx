import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicEnvScript } from "next-runtime-env";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIM Registration Portal — XLSmart",
  description:
    "Kominfo-compliant prepaid SIM registration. Encrypted at rest, audit-logged on every state change.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <PublicEnvScript />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
