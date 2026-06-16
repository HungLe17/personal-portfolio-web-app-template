"use client";

import Link from "next/link";
import { Settings, Shield } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppearanceSettings } from "@/components/appearance-settings";
import {
  applyAppearance,
  defaultAppearance,
  readAppearance,
  resolveTheme,
  type AppearancePreferences
} from "@/lib/appearance";

const navItems = [
  { href: "/#top", label: "Home", state: "is-home" },
  { href: "/#work", label: "Work", state: "is-work" },
  { href: "/#posts", label: "Posts", state: "is-posts" },
  { href: "/#contact", label: "Contact", state: "is-contact" }
];
const sectionMap = new Map(navItems.map((item) => [item.href.replace("/#", ""), item.state]));

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<AppearancePreferences>(defaultAppearance);
  const [activeState, setActiveState] = useState("is-home");
  const headerRef = useRef<HTMLElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const hiddenRef = useRef(false);
  const compactRef = useRef(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let distanceSinceToggle = 0;
    let ticking = false;
    let frame = 0;

    function updateHidden(next: boolean) {
      if (hiddenRef.current === next) return;
      hiddenRef.current = next;
      setHidden(next);
    }

    function updateCompact(next: boolean) {
      if (compactRef.current === next) return;
      compactRef.current = next;
      setCompact(next);
    }

    function update() {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      const nearTop = currentY < 120;
      const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      headerRef.current?.style.setProperty("--page-progress", String(Math.min(1, currentY / scrollRange)));

      updateCompact(currentY > 24);

      if (nearTop) {
        distanceSinceToggle = 0;
        updateHidden(false);
      } else if (delta < -1) {
        distanceSinceToggle = Math.min(distanceSinceToggle, 0) + delta;
        if (distanceSinceToggle <= -10) {
          updateHidden(false);
          distanceSinceToggle = 0;
        }
      } else if (delta > 1) {
        distanceSinceToggle = Math.max(distanceSinceToggle, 0) + delta;
        if (currentY > 260 && distanceSinceToggle >= 200) {
          updateHidden(true);
          distanceSinceToggle = 0;
        }
      }

      lastY = currentY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        frame = requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    hiddenRef.current = false;
    setHidden(false);
    const hashState = sectionMap.get(window.location.hash.replace("#", ""));
    if (hashState) setActiveState(hashState);
  }, [pathname]);

  useEffect(() => {
    const savedPreferences = readAppearance();
    setPreferences(savedPreferences);
    applyAppearance(savedPreferences);

    function onAppearance(event: Event) {
      setPreferences((event as CustomEvent<AppearancePreferences>).detail);
    }

    window.addEventListener("portfolio:appearance", onAppearance);
    return () => window.removeEventListener("portfolio:appearance", onAppearance);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    function onSystemThemeChange() {
      if (preferences.theme === "system") {
        document.documentElement.dataset.theme = resolveTheme("system");
      }
    }
    media.addEventListener("change", onSystemThemeChange);
    return () => media.removeEventListener("change", onSystemThemeChange);
  }, [preferences.theme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          const nextState = sectionMap.get(visibleEntry.target.id);
          if (nextState) setActiveState(nextState);
        }
      },
      { rootMargin: "-35% 0px -52% 0px", threshold: [0.08, 0.2, 0.4] }
    );

    sectionMap.forEach((_state, id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const headerClass = [
    "site-header glass-panel",
    hidden && !settingsOpen ? "header-hidden" : "",
    compact ? "header-compact" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const activeNavIndex = Math.max(0, navItems.findIndex((item) => item.state === activeState));

  return (
    <>
      <header
        className={headerClass}
        ref={headerRef}
        data-glass-priority="3"
      >
        <Link className="brand" href="/" aria-label="Back to home">
          <span className="brand-mark">P</span>
          <span>Portfolio</span>
        </Link>
        <nav
          className={`main-nav segmented-slider segments-4 ${activeState}`}
          style={
            {
              "--segment-count": navItems.length,
              "--segment-index": activeNavIndex
            } as CSSProperties
          }
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <Link
              className={activeState === item.state ? "active" : ""}
              href={item.href}
              key={item.href}
              onClick={() => setActiveState(item.state)}
              onMouseEnter={() => {
                router.prefetch("/");
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className="icon-button"
            onClick={() => setSettingsOpen((open) => !open)}
            ref={settingsButtonRef}
            type="button"
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            aria-label="Open site settings"
          >
            <Settings aria-hidden="true" size={19} />
          </button>
          <Link className="icon-button" href="/admin" aria-label="Open admin">
            <Shield aria-hidden="true" size={19} />
          </Link>
        </div>
        <span className="header-progress" aria-hidden="true" />
      </header>
      <AppearanceSettings
        anchorRef={settingsButtonRef}
        open={settingsOpen}
        onClose={closeSettings}
        preferences={preferences}
        onChange={setPreferences}
      />
    </>
  );
}
