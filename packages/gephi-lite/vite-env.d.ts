/// <reference types="vite/client" />

declare global {
  interface Window {
    GEPHI_LITE_PROJECT_ID?: string;
  }

  namespace JSX {
    interface IntrinsicElements {
      "dataviz-tool-header": any;
    }
  }
}

export { };
