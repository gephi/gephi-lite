/// <reference types="vite/client" />
import type { DetailedHTMLProps, HTMLAttributes } from "react";

import type { ToolHeaderElement } from "./src/core/toolHeader";

declare global {
  interface Window {
    GEPHI_LITE_PROJECT_ID?: string;
  }

  namespace JSX {
    interface IntrinsicElements {
      "dataviz-tool-header": DetailedHTMLProps<HTMLAttributes<ToolHeaderElement>, ToolHeaderElement>;
    }
  }
}

export {};
