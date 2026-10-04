import { useReadAtom } from "@ouestware/atoms";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { selectionHistoryAtom } from "../core/selection/history";
import { NavigateBackIcon, NavigateForwardIcon } from "./common-icons";

/**
 * Back and forward through the nodes and edges visited in this tab, next to the Graph/Data tabs.
 *
 * They do exactly what the browser's own back and forward do - they call them - rather than
 * driving the selection history directly: that history mirrors the browser's, and one way of
 * navigating it is plenty (see the back-button guard in core/Initialize). They only exist because
 * reaching "forward" on Android means digging into the browser's menu.
 *
 * Mobile only: on wider screens the browser shows its own buttons right above the page.
 */
const SelectionNavigationButton: FC<{
  direction: "back" | "forward";
}> = ({ direction }) => {
  const { t } = useTranslation();
  const { visited, cursor } = useReadAtom(selectionHistoryAtom);
  const isBack = direction === "back";
  // Nothing to go back (or forward) to: the button disappears entirely rather than sitting there
  // greyed out. It also means these buttons only ever move within the visited selections - the
  // back one never reaches the "leaving the application" step.
  if (isBack ? cursor <= 0 : cursor >= visited.length - 1) return null;

  const label = t(isBack ? "selection.navigate_back" : "selection.navigate_forward");

  return (
    <button
      type="button"
      className="gl-btn gl-btn-icon d-sm-none"
      title={label}
      aria-label={label}
      onClick={() => (isBack ? window.history.back() : window.history.forward())}
    >
      {isBack ? <NavigateBackIcon /> : <NavigateForwardIcon />}
    </button>
  );
};

export const SelectionBackButton: FC = () => <SelectionNavigationButton direction="back" />;
export const SelectionForwardButton: FC = () => <SelectionNavigationButton direction="forward" />;
