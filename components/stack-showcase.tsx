"use client";

import { EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { applyAppearance, readAppearance, type AppearancePreferences } from "@/lib/appearance";

const stackItems = [
  { label: "Framework", value: "Next.js", detail: "App Router" },
  { label: "Auth + Data", value: "Supabase", detail: "Postgres CMS" },
  { label: "Interface", value: "Tailwind", detail: "Liquid glass system" },
  { label: "Editor", value: "Tiptap", detail: "Rich articles" }
];

export function StackShowcase() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const preferences = readAppearance();
    setVisible(preferences.stackShowcase !== "hide");

    function onAppearance(event: Event) {
      const next = (event as CustomEvent<AppearancePreferences>).detail;
      setVisible(next.stackShowcase !== "hide");
    }

    window.addEventListener("portfolio:appearance", onAppearance);
    return () => window.removeEventListener("portfolio:appearance", onAppearance);
  }, []);

  function hideShowcase() {
    const preferences = { ...readAppearance(), stackShowcase: "hide" as const };
    applyAppearance(preferences);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="stack-showcase" aria-label="Portfolio technology stack and aesthetic system">
      <button className="stack-hide-button" type="button" onClick={hideShowcase} aria-label="Hide stack showcase">
        <EyeOff aria-hidden="true" size={16} />
        <span>Hide</span>
      </button>
      <div className="stack-orb" aria-hidden="true">
        <span />
        <i />
        <b />
      </div>
      <div className="stack-showcase-heading">
        <p className="eyebrow">Stack and aesthetic</p>
        <h2>Full-stack portfolio CMS with liquid glass UI.</h2>
      </div>
      <div className="stack-grid">
        {stackItems.map((item) => (
          <div className="stack-chip" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>
      <div className="aesthetic-strip" aria-hidden="true">
        <span>Transparent surfaces</span>
        <span>Shader refraction</span>
        <span>Responsive CMS</span>
      </div>
    </div>
  );
}
