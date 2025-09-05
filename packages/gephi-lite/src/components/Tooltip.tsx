import { ReactNode, forwardRef, useEffect, useRef, useState } from "react";
import TetherComponent from "react-tether";
import Tether from "tether";

import Transition from "./Transition";

export type TooltipAPI = { close: () => void; open: () => void; isOpened: () => boolean };

const Tooltip = forwardRef<
  TooltipAPI,
  {
    children: [ReactNode, ReactNode];
    hoverable?: boolean;
    closeOnClickContent?: boolean;
    targetClassName?: string;
  } & Partial<
    Pick<
      Tether.ITetherOptions,
      "attachment" | "constraints" | "offset" | "targetAttachment" | "targetOffset" | "targetModifier"
    >
  >
>(({ children: [target, content], targetClassName, hoverable, closeOnClickContent, ...tether }, ref) => {
  const lastCloseOnClickTime = useRef<number>(-Infinity);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState<null | "click" | "hover">(null);

  const targetWrapper = useRef<HTMLDivElement>(null);
  const tooltipWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered) {
      if (!showTooltip && Date.now() - lastCloseOnClickTime.current >= 100) setShowTooltip("hover");
      return;
    }

    if (showTooltip === "hover") {
      const id = setTimeout(() => {
        setShowTooltip(null);
      }, 100);
      return () => {
        clearTimeout(id);
      };
    }
  }, [isHovered, showTooltip]);

  useEffect(() => {
    const value = {
      close: () => setShowTooltip(null),
      open: () => setShowTooltip("click"),
      isOpened: () => !!showTooltip,
    };
    if (typeof ref === "function") ref(value);
    else if (ref) ref.current = value;
  }, [ref, showTooltip]);

  // Handle interactions:
  useEffect(() => {
    if (!showTooltip) return;

    const handleClickBody = (e: MouseEvent) => {
      if (!tooltipWrapper.current || !targetWrapper.current) return;

      const node = e.target as Node;
      if (
        (showTooltip && closeOnClickContent) ||
        (!tooltipWrapper.current.contains(node) && !targetWrapper.current.contains(node))
      ) {
        lastCloseOnClickTime.current = Date.now();
        setShowTooltip(null);
        setIsHovered(false);
      }
    };

    setTimeout(() => {
      document.body.addEventListener("click", handleClickBody);
    }, 0);
    return () => {
      document.body.removeEventListener("click", handleClickBody);
    };
  }, [closeOnClickContent, showTooltip]);

  return (
    <TetherComponent
      className="over-modal"
      attachment="top right"
      targetAttachment="bottom right"
      constraints={[{ to: "window", attachment: "together", pin: true }]}
      {...tether}
      renderTarget={(ref) => (
        <div
          ref={ref}
          onClick={(e) => {
            e.preventDefault();
            setShowTooltip("click");
          }}
          onMouseEnter={() => hoverable && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={targetClassName}
        >
          <div ref={targetWrapper}>{target}</div>
        </div>
      )}
      renderElement={(ref) => (
        <Transition
          ref={ref}
          show={showTooltip}
          mountTransition="fade-in 0.2s forwards"
          unmountTransition="fade-out 0.2s forwards"
          onMouseEnter={() => hoverable && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div ref={tooltipWrapper}>{content}</div>
        </Transition>
      )}
    />
  );
});

export default Tooltip;
