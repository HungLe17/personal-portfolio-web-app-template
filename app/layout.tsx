import type { Metadata } from "next";
import "./styles.css";
import { LiquidBackground } from "@/components/liquid-background";
import { Header } from "@/components/header";
import { BackToTop } from "@/components/back-to-top";

export const metadata: Metadata = {
  title: "Personal Portfolio",
  description: "Full-stack portfolio CMS with glass UI, projects, posts, and admin editing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=JSON.parse(localStorage.getItem('portfolio-appearance-v1')||'{}');var t=p.theme||'system';var r=t==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;document.documentElement.dataset.theme=r;document.documentElement.dataset.themePreference=t;document.documentElement.dataset.motion=p.motion||'full';document.documentElement.dataset.refraction=p.refraction||'balanced';document.documentElement.dataset.glassDensity=p.glassDensity||'balanced';document.documentElement.dataset.stackShowcase=p.stackShowcase||'show'}catch(e){}"
          }}
        />
      </head>
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
