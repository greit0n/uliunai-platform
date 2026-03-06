import * as THREE from 'three';
import FOG from 'vanta/dist/vanta.fog.min';

import type { CSSProperties } from 'react';
import type { VantaFogEffect } from 'vanta/dist/vanta.fog.min';

/**
 * Realistic volumetric fog background using Vanta.js and Three.js.
 * Renders a WebGL fog effect sized to its container.
 * @component
 * @param props.className - Optional CSS classes for the container
 * @param props.style - Optional inline styles
 * @returns {JSX.Element} An absolutely positioned fog background layer
 */
export default function VantaFog({
  className = '',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaFogEffect | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    effectRef.current = FOG({
      el: containerRef.current,
      THREE: THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      highlightColor: 0x8b0000,
      midtoneColor: 0x1a0000,
      lowlightColor: 0x000000,
      baseColor: 0x050000,
      blurFactor: 0.6,
      speed: 1.5,
      zoom: 0.8,
    });

    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
