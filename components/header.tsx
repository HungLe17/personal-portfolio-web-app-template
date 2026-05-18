"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
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
        <Link className="icon-button" href="/admin" aria-label="Open admin">
          <Settings aria-hidden="true" size={19} />
        </Link>
      </div>
    </header>
  );
}
