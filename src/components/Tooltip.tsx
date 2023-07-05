import { FC, ReactNode, useEffect, useRef, useState } from "react";
import TetherComponent from "react-tether";

const Tooltip: FC<{
  children: [ReactNode, ReactNode];
}> = ({ children: [target, content] }) => {
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
    const handleClickBody = () => {
      setShowTooltip(null);
    };

    setTimeout(() => {
      document.body.addEventListener("mousemove", handleMove);
      document.body.addEventListener("click", handleClickBody);
    }, 0);
    return () => {
      document.body.removeEventListener("mousemove", handleMove);
      document.body.removeEventListener("click", handleClickBody);
    };
  }, [showTooltip]);

  return (
    <TetherComponent
      className="over-modal"
      attachment="top right"
      targetAttachment="bottom right"
      constraints={[{ to: "scrollparent", attachment: "together", pin: true }]}
      renderTarget={(ref) => (
        <div
          ref={ref}
          onClick={() => {
            setShowTooltip("click");
          }}
          onMouseEnter={() => {
            if (!showTooltip) setShowTooltip("hover");
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
