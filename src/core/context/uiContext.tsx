import { createContext } from "react";

/**
 * Type definition of the context
 */
export interface UIContextType {
  portalTarget: HTMLDivElement;
}

export const emptyUIContext: UIContextType = {
  portalTarget: document.createElement("div"),
};

/**
 * UI context
 */
export const UIContext = createContext<UIContextType>(emptyUIContext);
