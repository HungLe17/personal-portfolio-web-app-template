"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LiquidGlassScene = dynamic(
  () => import("@/components/liquid-glass-scene").then((module) => module.LiquidGlassScene),
  { ssr: false }
);

export function LiquidBackground() {
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const windowWithIdle = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const unsupported = window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches;
    let idleId: number | undefined;
    let timeoutId = 0;

    function cancelPending() {
      if (idleId !== undefined) windowWithIdle.cancelIdleCallback?.(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
      idleId = undefined;
      timeoutId = 0;
    }

    function syncScene() {
      cancelPending();
      if (unsupported || document.documentElement.dataset.motion === "reduced") {
        setSceneReady(false);
        return;
      }
      idleId = windowWithIdle.requestIdleCallback?.(() => setSceneReady(true), { timeout: 1200 });
      if (idleId === undefined) timeoutId = window.setTimeout(() => setSceneReady(true), 500);
    }

    syncScene();
    window.addEventListener("portfolio:appearance", syncScene);
    return () => {
      cancelPending();
      window.removeEventListener("portfolio:appearance", syncScene);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let target: HTMLElement | null = null;
    let clientX = 0;
    let clientY = 0;

    function ensureGlint(element: HTMLElement) {
      let glint = element.querySelector<HTMLElement>(":scope > .glass-pointer-glint");
      if (!glint) {
        glint = document.createElement("span");
        glint.className = "glass-pointer-glint";
        glint.setAttribute("aria-hidden", "true");
        element.appendChild(glint);
      }
    }

    function setTarget(nextTarget: HTMLElement | null) {
      if (target === nextTarget) return;
      target?.removeAttribute("data-pointer-active");
      target = nextTarget;
      if (target) ensureGlint(target);
      target?.setAttribute("data-pointer-active", "true");
    }

    function clearTarget() {
      cancelAnimationFrame(frame);
      frame = 0;
      setTarget(null);
    }

    function paint() {
      frame = 0;
      if (!target || !document.contains(target)) {
        clearTarget();
        return;
      }
      const bounds = target.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - bounds.left) / Math.max(bounds.width, 1)));
      const y = Math.max(0, Math.min(1, (clientY - bounds.top) / Math.max(bounds.height, 1)));
      target.style.setProperty("--pointer-x", `${x * 100}%`);
      target.style.setProperty("--pointer-y", `${y * 100}%`);
      target.style.setProperty("--pointer-tilt-x", `${(0.5 - y) * 0.8}deg`);
      target.style.setProperty("--pointer-tilt-y", `${(x - 0.5) * 0.8}deg`);
    }

    function onPointerMove(event: PointerEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
      const nextTarget =
        (event.target as Element | null)?.closest<HTMLElement>(".glass-panel, .liquid-button") ?? null;
      setTarget(nextTarget);
      if (!frame) frame = requestAnimationFrame(paint);
    }

    function onPointerOut(event: PointerEvent) {
      const from = (event.target as Element | null)?.closest<HTMLElement>(".glass-panel, .liquid-button");
      const to = (event.relatedTarget as Element | null)?.closest<HTMLElement>(".glass-panel, .liquid-button");
      if (from && from !== to && target === from) clearTarget();
    }

    function onVisibilityChange() {
      if (document.hidden) clearTarget();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut, true);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", clearTarget);
    document.documentElement.addEventListener("pointerleave", clearTarget);
    return () => {
      clearTarget();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", clearTarget);
      document.documentElement.removeEventListener("pointerleave", clearTarget);
    };
  }, []);

  return (
    <div className="liquid-field" aria-hidden="true">
      {sceneReady ? <LiquidGlassScene /> : null}
      <div className="liquid-wash liquid-wash-a" />
      <div className="liquid-wash liquid-wash-b" />
      <div className="liquid-aurora" />
      <div className="liquid-lens liquid-lens-a" />
      <div className="liquid-lens liquid-lens-b" />
      <div className="liquid-ribbon liquid-ribbon-a" />
      <div className="liquid-ribbon liquid-ribbon-b" />
      <div className="liquid-grid" />
      <div className="liquid-wire" />
      <div className="liquid-constellation" />
      <div className="liquid-depth liquid-depth-a" />
      <div className="liquid-depth liquid-depth-b" />
      <div className="liquid-sheen" />
    </div>
  );
}
