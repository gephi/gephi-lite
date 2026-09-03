import { FC, useEffect } from "react";

import { config } from "../config";

const SCRIPT_ID = "feedback-widget-js";

/**
 * Loads https://github.com/JeanGarf/feedback-widget-js once, if a public key is configured (see
 * config.feedbackWidget). No-op otherwise, so the widget stays silently disabled until a key is
 * registered against feedback-service.
 *
 * data-auto-button="false" keeps the widget from injecting its own floating button: the panel is
 * only ever opened programmatically, from the "Signaler un problème auto" menu entry (see
 * openFeedbackWidget below and its usage in Header.tsx), so every trigger of that action shares
 * this single code path.
 */
export const FeedbackWidget: FC = () => {
  useEffect(() => {
    if (!config.feedbackWidget.key || document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = config.feedbackWidget.scriptUrl;
    script.dataset.app = "gephi-lite";
    script.dataset.key = config.feedbackWidget.key;
    script.dataset.version = config.version.raw;
    script.dataset.endpoint = config.feedbackWidget.endpoint;
    script.dataset.autoButton = "false";
    document.body.appendChild(script);
  }, []);

  return null;
};

export function openFeedbackWidget(): void {
  if (!window.Feedback) {
    console.warn("Feedback widget is not loaded (missing VITE_FEEDBACK_KEY?).");
    return;
  }
  window.Feedback.open();
}
