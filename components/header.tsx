"use client";

import Link from "next/link";
import { Moon, Settings, Shield, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/#work", label: "Work", state: "is-work" },
  { href: "/#posts", label: "Posts", state: "is-posts" },
  { href: "/#contact", label: "Contact", state: "is-contact" }
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [navEngaged, setNavEngaged] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeState, setActiveState] = useState("is-work");
  const sectionMap = useMemo(() => new Map(navItems.map((item) => [item.href.replace("/#", ""), item.state])), []);

  useEffect(() => {
    let lastY = window.scrollY;
    let distanceSinceToggle = 0;
    let ticking = false;

    function update() {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      const nearTop = currentY < 80;

      setCompact(currentY > 24);

      if (nearTop) {
        distanceSinceToggle = 0;
        setHidden(false);
      } else if (delta < -1) {
        distanceSinceToggle = Math.min(distanceSinceToggle, 0) + delta;
        if (distanceSinceToggle <= -10) {
          setHidden(false);
          distanceSinceToggle = 0;
        }
      } else if (delta > 1) {
        distanceSinceToggle = Math.max(distanceSinceToggle, 0) + delta;
        if (distanceSinceToggle >= 34) {
          setHidden(true);
          distanceSinceToggle = 0;
        }
      }

      lastY = currentY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setHidden(false);
    const hashState = sectionMap.get(window.location.hash.replace("#", ""));
    if (hashState) setActiveState(hashState);
  }, [pathname, sectionMap]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("portfolio-theme") === "light" ? "light" : "dark";
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("portfolio-theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

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
  }, [sectionMap]);

  const headerClass = [
    "site-header glass-panel",
    hidden && !navEngaged ? "header-hidden" : "",
    compact ? "header-compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header
      className={headerClass}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setNavEngaged(false);
      }}
      onFocus={() => setNavEngaged(true)}
      onMouseEnter={() => setNavEngaged(true)}
      onMouseLeave={() => setNavEngaged(false)}
    >
      <Link className="brand" href="/" aria-label="Back to home">
        <span className="brand-mark">P</span>
        <span>Portfolio</span>
      </Link>
      <nav className={`main-nav ${activeState}`} aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link
            className={activeState === item.state ? "active" : ""}
            href={item.href}
            key={item.href}
            onFocus={() => setActiveState(item.state)}
            onMouseEnter={() => {
              setActiveState(item.state);
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
          type="button"
          aria-expanded={settingsOpen}
          aria-label="Open site settings"
        >
          <Settings aria-hidden="true" size={19} />
        </button>
        <Link className="icon-button" href="/admin" aria-label="Open admin">
          <Shield aria-hidden="true" size={19} />
        </Link>
        {settingsOpen ? (
          <div className="settings-popover glass-panel">
            <div>
              <p className="eyebrow">Settings</p>
              <strong>Appearance</strong>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} type="button">
              {theme === "dark" ? <Moon aria-hidden="true" size={17} /> : <Sun aria-hidden="true" size={17} />}
              <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
