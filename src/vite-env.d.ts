/// <reference types="vite/client" />
/// <reference types="@esri/calcite-components/types/react" />

declare global {
  interface Window {
    calciteConfig?: {
      assetsUrl?: string;
    };
  }
}

export {};
