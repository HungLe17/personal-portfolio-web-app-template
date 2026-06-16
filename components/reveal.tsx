"use client";

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  dataGlassDisabled?: boolean;
  id?: string;
};

export function Reveal({ as = "div", children, className, dataGlassDisabled, id }: RevealProps) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.revealed = "true";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      className: ["reveal", className].filter(Boolean).join(" "),
      "data-glass-disabled": dataGlassDisabled ? "true" : undefined,
      id,
      ref: elementRef
    },
    children
  );
}
