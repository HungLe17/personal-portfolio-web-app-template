"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  applyAppearance,
  type AppearancePreferences,
  type GlassDensityPreference,
  type MotionPreference,
  type RefractionPreference,
  type StackShowcasePreference,
  type ThemePreference
} from "@/lib/appearance";

type AppearanceSettingsProps = {
  anchorRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  preferences: AppearancePreferences;
  onChange: (preferences: AppearancePreferences) => void;
};

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));

  return (
    <fieldset className="settings-field">
      <legend>{label}</legend>
      <div
        className={`settings-segmented segmented-slider segments-${options.length}`}
        style={
          {
            "--segment-count": options.length,
            "--segment-index": activeIndex
          } as CSSProperties
        }
      >
        {options.map((option) => (
          <button
            className={option.value === value ? "is-active" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function AppearanceSettings({
  anchorRef,
  open,
  onClose,
  preferences,
  onChange
}: AppearanceSettingsProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 84, right: 20 });
  const positionRef = useRef(position);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor || window.innerWidth <= 620) {
        const next = { top: 0, right: 0 };
        if (positionRef.current.top !== next.top || positionRef.current.right !== next.right) {
          positionRef.current = next;
          setPosition(next);
        }
        return;
      }
      const next = {
        top: Math.max(12, Math.min(anchor.bottom + 12, window.innerHeight - (panelRef.current?.offsetHeight ?? 440) - 12)),
        right: Math.max(16, window.innerWidth - anchor.right)
      };
      if (positionRef.current.top !== next.top || positionRef.current.right !== next.right) {
        positionRef.current = next;
        setPosition(next);
      }
    }

    let frame = 0;
    function schedulePositionUpdate() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updatePosition();
      });
    }

    updatePosition();
    window.addEventListener("resize", schedulePositionUpdate, { passive: true });
    window.addEventListener("scroll", schedulePositionUpdate, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate);
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      if (document.contains(anchorRef.current)) anchorRef.current?.focus();
    };
  }, [anchorRef, onClose, open]);

  if (!open) return null;

  function update(next: Partial<AppearancePreferences>) {
    const value = { ...preferences, ...next };
    onChange(value);
    applyAppearance(value);
  }

  return createPortal(
    <div
      className="settings-popover glass-panel"
      ref={panelRef}
      style={{ top: position.top, right: position.right }}
      tabIndex={-1}
      role="dialog"
      aria-label="Appearance settings"
    >
      <div className="settings-heading">
        <div>
          <p className="eyebrow">Display</p>
          <strong>Appearance</strong>
        </div>
        <button className="settings-close" onClick={onClose} type="button" aria-label="Close settings">
          Close
        </button>
      </div>

      <SegmentedControl<ThemePreference>
        label="Theme"
        value={preferences.theme}
        options={[
          { label: "System", value: "system" },
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" }
        ]}
        onChange={(theme) => update({ theme })}
      />
      <SegmentedControl<MotionPreference>
        label="Motion"
        value={preferences.motion}
        options={[
          { label: "Full", value: "full" },
          { label: "Reduced", value: "reduced" }
        ]}
        onChange={(motion) => update({ motion })}
      />
      <SegmentedControl<RefractionPreference>
        label="Refraction"
        value={preferences.refraction}
        options={[
          { label: "High", value: "high" },
          { label: "Balanced", value: "balanced" },
          { label: "Off", value: "off" }
        ]}
        onChange={(refraction) => update({ refraction })}
      />
      <SegmentedControl<GlassDensityPreference>
        label="Glass density"
        value={preferences.glassDensity}
        options={[
          { label: "Clear", value: "clear" },
          { label: "Balanced", value: "balanced" },
          { label: "Solid", value: "solid" }
        ]}
        onChange={(glassDensity) => update({ glassDensity })}
      />
      <SegmentedControl<StackShowcasePreference>
        label="Stack showcase"
        value={preferences.stackShowcase}
        options={[
          { label: "Show", value: "show" },
          { label: "Hide", value: "hide" }
        ]}
        onChange={(stackShowcase) => update({ stackShowcase })}
      />
    </div>,
    document.body
  );
}
