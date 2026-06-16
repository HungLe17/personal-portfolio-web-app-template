"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const nextVisible = window.scrollY > 520;
        if (nextVisible === visibleRef.current) return;
        visibleRef.current = nextVisible;
        setVisible(nextVisible);
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      className={`back-to-top ${visible ? "is-visible" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
      aria-label="Back to top"
    >
      <ArrowUp aria-hidden="true" size={20} />
    </button>
  );
}
