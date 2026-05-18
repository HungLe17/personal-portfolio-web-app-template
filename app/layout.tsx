import type { Metadata } from "next";
import "./globals.css";
import { LiquidBackground } from "@/components/liquid-background";
import { Header } from "@/components/header";
import { BackToTop } from "@/components/back-to-top";

export const metadata: Metadata = {
  title: "Portfolio | Liquid Glass",
  description: "Premium full-stack portfolio CMS with glass UI, projects, posts, and admin editing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LiquidBackground />
        <div className="grain" aria-hidden="true" />
        <Header />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
