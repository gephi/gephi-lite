import { FC, ReactNode, useEffect, useRef, useState } from "react";
import TetherComponent from "react-tether";
import Tether from "tether";

const Tooltip: FC<
  {
    children: [ReactNode, ReactNode];
    hoverable?: boolean;
    closeOnClickContent?: boolean;
  } & Partial<
    Pick<
      Tether.ITetherOptions,
      "attachment" | "constraints" | "offset" | "targetAttachment" | "targetOffset" | "targetModifier"
    >
  >
> = ({ children: [target, content], hoverable, closeOnClickContent, ...tether }) => {
  const [showTooltip, setShowTooltip] = useState<null | "click" | "hover">(null);

  const targetWrapper = useRef<HTMLDivElement>(null);
  const tooltipWrapper = useRef<HTMLDivElement>(null);

  // Handle interactions:
  useEffect(() => {
    if (!showTooltip) return;

    const handleMove = (e: MouseEvent) => {
      if (!tooltipWrapper.current || !targetWrapper.current) return;

      const node = e.target as Node;
      if (showTooltip === "hover" && !tooltipWrapper.current.contains(node) && !targetWrapper.current.contains(node)) {
        setShowTooltip(null);
      }
    };
    const handleClickBody = (e: MouseEvent) => {
      if (!tooltipWrapper.current || !targetWrapper.current) return;

      const node = e.target as Node;
      if (
        (showTooltip && closeOnClickContent) ||
        (!tooltipWrapper.current.contains(node) && !targetWrapper.current.contains(node))
      ) {
        setShowTooltip(null);
      }
    };

    setTimeout(() => {
      document.body.addEventListener("mousemove", handleMove);
      document.body.addEventListener("click", handleClickBody);
    }, 0);
    return () => {
      document.body.removeEventListener("mousemove", handleMove);
      document.body.removeEventListener("click", handleClickBody);
    };
  }, [closeOnClickContent, showTooltip]);

  return (
    <TetherComponent
      className="over-modal"
      attachment="top right"
      targetAttachment="bottom right"
      constraints={[{ to: "window", attachment: "together", pin: true }]}
      {...{ ...tether }}
      renderTarget={(ref) => (
        <div
          ref={ref}
          onClick={() => {
            setShowTooltip("click");
          }}
          onMouseEnter={() => {
            if (!showTooltip && hoverable) setShowTooltip("hover");
          }}
        >
          <div ref={targetWrapper}>{target}</div>
        </div>
      )}
      renderElement={(ref) =>
        showTooltip && (
          // We use two divs here to allow having "two refs":
          <div ref={ref}>
            <div ref={tooltipWrapper}>{content}</div>
          </div>
        )
      }
    />
  );
};

export default Tooltip;
