/// <reference types="vite/client" />

declare const __BASE_PATH__: string;
declare const __IS_PREVIEW__: string;

declare module 'vanta/dist/vanta.fog.min' {
  interface VantaFogOptions {
    el: HTMLElement;
    THREE: typeof import('three');
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    highlightColor?: number;
    midtoneColor?: number;
    lowlightColor?: number;
    baseColor?: number;
    blurFactor?: number;
    speed?: number;
    zoom?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundAlpha?: number;
  }

  interface VantaFogEffect {
    destroy: () => void;
    setOptions: (options: Partial<VantaFogOptions>) => void;
  }

  export default function FOG(options: VantaFogOptions): VantaFogEffect;
}
