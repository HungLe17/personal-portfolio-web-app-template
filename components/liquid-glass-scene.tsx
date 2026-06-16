"use client";

import { useEffect, useRef } from "react";
import { readAppearance, type AppearancePreferences } from "@/lib/appearance";

const MAX_PANELS = 24;

export function LiquidGlassScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    async function mount() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const THREE = await import("three");
      if (disposed) return;

      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      let preferences = readAppearance();
      const fallback = coarsePointer || reducedMotion || deviceMemory <= 4;
      if (fallback) {
        document.documentElement.dataset.webglGlass = "fallback";
        return;
      }

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          premultipliedAlpha: true
        });
      } catch {
        document.documentElement.dataset.webglGlass = "fallback";
        return;
      }

      const qualityCap = deviceMemory >= 8 ? 2 : 1.75;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualityCap));
      renderer.setClearColor(0x000000, 0);
      document.documentElement.dataset.webglGlass = "active";

      const rects = Array.from({ length: MAX_PANELS }, () => new THREE.Vector4());
      const radii = new Float32Array(MAX_PANELS);
      const priorities = new Float32Array(MAX_PANELS);
      const uniforms = {
        uResolution: { value: new THREE.Vector2() },
        uPointer: { value: new THREE.Vector2(-1000, -1000) },
        uTime: { value: 0 },
        uScrollVelocity: { value: 0 },
        uPanelCount: { value: 0 },
        uRects: { value: rects },
        uRadii: { value: radii },
        uPriorities: { value: priorities },
        uTheme: { value: 0 },
        uIntensity: { value: 0.72 },
        uDensity: { value: 0.62 },
        uPointerPresence: { value: 0 }
      };

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms,
        vertexShader: `
          void main() {
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          #define MAX_PANELS ${MAX_PANELS}

          uniform vec2 uResolution;
          uniform vec2 uPointer;
          uniform float uTime;
          uniform float uScrollVelocity;
          uniform int uPanelCount;
          uniform vec4 uRects[MAX_PANELS];
          uniform float uRadii[MAX_PANELS];
          uniform float uPriorities[MAX_PANELS];
          uniform float uTheme;
          uniform float uIntensity;
          uniform float uDensity;
          uniform float uPointerPresence;

          float roundedBox(vec2 point, vec2 halfSize, float radius) {
            vec2 q = abs(point) - halfSize + radius;
            return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
          }

          float noiseField(vec2 uv, float time) {
            float a = sin(uv.x * 5.4 + uv.y * 2.1 + time * 0.13);
            float b = sin((uv.y - uv.x * 0.28) * 8.2 - time * 0.11);
            float c = cos(length(uv - vec2(0.72, 0.24)) * 11.0 + time * 0.08);
            float d = sin((uv.x + uv.y) * 15.0 + time * 0.055) * 0.35;
            return (a + b + c + d) / 3.35;
          }

          float hash21(vec2 point) {
            point = fract(point * vec2(123.34, 456.21));
            point += dot(point, point + 45.32);
            return fract(point.x * point.y);
          }

          float flowFilaments(vec2 uv, float time) {
            vec2 warped = uv;
            warped.x += sin(uv.y * 3.8 - time * 0.11) * 0.045;
            warped.y += sin(uv.x * 4.5 + time * 0.09) * 0.04;
            float first = abs(sin((warped.x * 1.15 + warped.y * 0.72) * 10.0 - time * 0.18));
            float second = abs(sin((warped.x * 0.55 - warped.y * 1.2) * 12.0 + time * 0.12));
            float fine = abs(sin((warped.x + warped.y) * 22.0 - time * 0.07));
            return pow(1.0 - first, 18.0) * 0.62 +
              pow(1.0 - second, 24.0) * 0.42 +
              pow(1.0 - fine, 34.0) * 0.18;
          }

          float particleField(vec2 uv, float time) {
            vec2 gridUv = uv * vec2(18.0, 11.0);
            vec2 cell = floor(gridUv);
            vec2 local = fract(gridUv) - 0.5;
            float randomValue = hash21(cell);
            vec2 drift = vec2(
              sin(time * (0.08 + randomValue * 0.08) + randomValue * 6.2831),
              cos(time * (0.06 + randomValue * 0.06) + randomValue * 4.7)
            ) * 0.17;
            float point = smoothstep(0.055, 0.0, length(local - drift));
            float twinkle = 0.45 + 0.55 * sin(time * 0.7 + randomValue * 18.0);
            return point * step(0.81, randomValue) * twinkle;
          }

          vec3 backgroundAt(vec2 uv, float time) {
            float field = noiseField(uv, time);
            vec2 driftOne = vec2(0.74 + sin(time * 0.07) * 0.08, 0.2 + cos(time * 0.06) * 0.06);
            vec2 driftTwo = vec2(0.16 + cos(time * 0.05) * 0.08, 0.74 + sin(time * 0.08) * 0.07);
            float glow = exp(-3.2 * length(uv - driftOne));
            float glowTwo = exp(-3.7 * length(uv - driftTwo));
            float arc = exp(-22.0 * abs(length((uv - vec2(0.54, 0.44)) * vec2(1.0, 0.72)) - 0.42));
            float filaments = flowFilaments(uv, time);
            float particles = particleField(uv, time);
            float darkValue = 0.012 + field * 0.018 + glow * 0.13 + glowTwo * 0.06 +
              arc * 0.035 + filaments * 0.055 + particles * 0.22;
            float lightValue = 0.88 + field * 0.035 + glow * 0.08 - glowTwo * 0.035 +
              arc * 0.03 - filaments * 0.025 - particles * 0.09;
            return vec3(mix(darkValue, lightValue, uTheme));
          }

          void main() {
            vec2 frag = gl_FragCoord.xy;
            vec2 uv = frag / uResolution;
            vec2 pointerUv = uPointer / max(uResolution, vec2(1.0));
            float pointerDistance = length((uv - pointerUv) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0));
            float pointerAura = exp(-pointerDistance * pointerDistance * 9.0) * uPointerPresence;
            vec2 pointerVector = normalize(uv - pointerUv + vec2(0.0001));
            float lens = pointerAura * (1.0 - smoothstep(0.0, 0.42, pointerDistance));
            vec2 parallax = (pointerUv - vec2(0.5)) * 0.024 * uPointerPresence;
            parallax.y += clamp(uScrollVelocity * 0.000018, -0.018, 0.018);
            vec3 farLayer = backgroundAt(uv + parallax * 0.35, uTime * 0.82);
            vec3 nearLayer = backgroundAt(uv - parallax + pointerVector * lens * 0.0025 * uIntensity, uTime);
            vec3 color = mix(farLayer, nearLayer, 0.72);
            float horizon = exp(-pow((uv.y - 0.56 + sin(uv.x * 4.0 + uTime * 0.08) * 0.045) * 7.0, 2.0));
            color += vec3(pointerAura * mix(0.012, 0.008, uTheme));
            color += vec3(horizon * mix(0.032, -0.018, uTheme));
            float alpha = 0.76;

            for (int index = 0; index < MAX_PANELS; index++) {
              if (index >= uPanelCount) break;
              vec4 rect = uRects[index];
              vec2 center = rect.xy + rect.zw * 0.5;
              float distanceToPanel = roundedBox(frag - center, rect.zw * 0.5, uRadii[index]);
              float inside = smoothstep(2.0, -2.0, distanceToPanel);
              if (inside <= 0.001) continue;

              vec2 pointerDelta = (frag - uPointer) / max(uResolution.y, 1.0);
              float pointerRadius = length(pointerDelta);
              float pointerFalloff = exp(-pointerRadius * pointerRadius * 14.0) * uPointerPresence;
              vec2 normal = normalize(pointerDelta + vec2(0.0001));
              float lensCore = pointerFalloff * (1.0 - smoothstep(0.02, 0.34, pointerRadius));
              float lensRim = exp(-pow((pointerRadius - 0.24) * 11.0, 2.0)) * uPointerPresence;
              float velocityBend = clamp(uScrollVelocity * 0.0008, -0.02, 0.02);
              vec2 displacement = normal * (lensCore * 0.006 - lensRim * 0.0015) * uIntensity;
              displacement.y += velocityBend * uIntensity;

              vec3 refracted = backgroundAt(uv + displacement, uTime + 1.7);
              float edge = exp(-abs(distanceToPanel) * 0.105);
              float sheen = pow(max(dot(normalize(vec2(0.7, 1.0)), normalize(frag - center + vec2(0.1))), 0.0), 7.0);
              float priority = 0.78 + uPriorities[index] * 0.08;
              float glassMix = mix(0.2, 0.94, uDensity);
              vec3 edgeLight = vec3(edge * mix(0.22, 0.13, uDensity) + sheen * 0.06 + lensRim * 0.02);
              color = mix(color, refracted + edgeLight, inside * priority * glassMix);
              alpha = max(alpha, inside * mix(0.22, 0.96, uDensity));
            }

            gl_FragColor = vec4(color, alpha);
          }
        `
      });

      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      let panels: HTMLElement[] = [];
      let visiblePanels = new Set<HTMLElement>();
      let frame = 0;
      let lastTime = performance.now();
      let lastScrollY = window.scrollY;
      let scrollVelocity = 0;
      let pointerX = -1000;
      let pointerY = -1000;
      let targetPointerX = -1000;
      let targetPointerY = -1000;
      let pointerPresence = 0;
      let targetPointerPresence = 0;
      let needsPanelRefresh = true;

      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const element = entry.target as HTMLElement;
            if (entry.isIntersecting) visiblePanels.add(element);
            else visiblePanels.delete(element);
          });
          needsPanelRefresh = true;
        },
        { rootMargin: "120px" }
      );

      const resizeObserver = new ResizeObserver(() => {
        needsPanelRefresh = true;
      });

      function registerPanels() {
        intersectionObserver.disconnect();
        resizeObserver.disconnect();
        panels = Array.from(document.querySelectorAll<HTMLElement>(".glass-panel:not([data-glass-disabled])"));
        panels.forEach((panel) => {
          intersectionObserver.observe(panel);
          resizeObserver.observe(panel);
        });
        needsPanelRefresh = true;
      }

      let mutationFrame = 0;
      const mutationObserver = new MutationObserver((mutations) => {
        const affectsGlassPanels = mutations.some((mutation) =>
          [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)].some(
            (node) =>
              node instanceof HTMLElement &&
              (node.matches(".glass-panel") || Boolean(node.querySelector(".glass-panel")))
          )
        );
        if (!affectsGlassPanels || mutationFrame) return;
        mutationFrame = requestAnimationFrame(() => {
          mutationFrame = 0;
          registerPanels();
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      registerPanels();

      function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
        needsPanelRefresh = true;
      }

      function refreshPanelUniforms() {
        const scaleX = renderer.domElement.width / window.innerWidth;
        const scaleY = renderer.domElement.height / window.innerHeight;
        const sorted = Array.from(visiblePanels)
          .map((panel) => ({
            panel,
            priority: Number(panel.dataset.glassPriority || 1),
            bounds: panel.getBoundingClientRect()
          }))
          .filter(({ bounds }) => bounds.width > 2 && bounds.height > 2)
          .sort((a, b) => b.priority - a.priority || b.bounds.width * b.bounds.height - a.bounds.width * a.bounds.height)
          .slice(0, MAX_PANELS);

        sorted.forEach(({ panel, bounds, priority }, index) => {
          rects[index].set(
            bounds.left * scaleX,
            (window.innerHeight - bounds.bottom) * scaleY,
            bounds.width * scaleX,
            bounds.height * scaleY
          );
          const computedRadius = Number.parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 24;
          radii[index] = Math.min(computedRadius * Math.min(scaleX, scaleY), Math.min(rects[index].z, rects[index].w) * 0.5);
          priorities[index] = Math.max(0, Math.min(priority, 3));
        });
        uniforms.uPanelCount.value = sorted.length;
        needsPanelRefresh = false;
      }

      function onPointerMove(event: PointerEvent) {
        const scaleX = renderer.domElement.width / window.innerWidth;
        const scaleY = renderer.domElement.height / window.innerHeight;
        targetPointerX = event.clientX * scaleX;
        targetPointerY = (window.innerHeight - event.clientY) * scaleY;
        targetPointerPresence = 1;
      }

      function onPointerLeave() {
        targetPointerPresence = 0;
      }

      function onScroll() {
        const current = window.scrollY;
        scrollVelocity += current - lastScrollY;
        lastScrollY = current;
        needsPanelRefresh = true;
      }

      function onAppearance(event: Event) {
        preferences = (event as CustomEvent<AppearancePreferences>).detail;
        uniforms.uTheme.value = document.documentElement.dataset.theme === "light" ? 1 : 0;
        uniforms.uIntensity.value = preferences.refraction === "high" ? 1 : preferences.refraction === "balanced" ? 0.68 : 0;
        uniforms.uDensity.value =
          preferences.glassDensity === "solid" ? 1 : preferences.glassDensity === "clear" ? 0.015 : 0.62;
      }

      function render(time: number) {
        frame = requestAnimationFrame(render);
        if (document.hidden) return;

        const delta = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;
        pointerX += (targetPointerX - pointerX) * Math.min(1, delta * 9);
        pointerY += (targetPointerY - pointerY) * Math.min(1, delta * 9);
        pointerPresence += (targetPointerPresence - pointerPresence) * Math.min(1, delta * 12);
        scrollVelocity *= Math.pow(0.015, delta);

        uniforms.uPointer.value.set(pointerX, pointerY);
        uniforms.uPointerPresence.value = pointerPresence;
        uniforms.uScrollVelocity.value = scrollVelocity;
        uniforms.uTime.value = preferences.motion === "reduced" ? 0 : time / 1000;
        uniforms.uTheme.value = document.documentElement.dataset.theme === "light" ? 1 : 0;
        if (needsPanelRefresh) refreshPanelUniforms();
        renderer.render(scene, camera);
      }

      resize();
      onAppearance(new CustomEvent("portfolio:appearance", { detail: preferences }));
      window.addEventListener("resize", resize, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("blur", onPointerLeave);
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("portfolio:appearance", onAppearance);
      renderer.domElement.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        document.documentElement.dataset.webglGlass = "fallback";
        cancelAnimationFrame(frame);
        cancelAnimationFrame(mutationFrame);
      });
      frame = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(frame);
        mutationObserver.disconnect();
        intersectionObserver.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("blur", onPointerLeave);
        document.documentElement.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("portfolio:appearance", onAppearance);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        delete document.documentElement.dataset.webglGlass;
      };
    }

    mount();
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas className="liquid-glass-canvas" ref={canvasRef} aria-hidden="true" />;
}
