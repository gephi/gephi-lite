import { PartitionColor } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { map } from "lodash";
import { FC, useEffect, useRef, useState } from "react";
import AnimateHeight from "react-animate-height";
import { useTranslation } from "react-i18next";

import { ItemType } from "../../../core/types";
import ColorPicker from "../../ColorPicker";

const COLLAPSED_HEIGHT = 200;

export const ColorPartitionEditor: FC<{
  itemType: ItemType;
  color: PartitionColor;
  setColor: (newColor: PartitionColor) => void;
}> = ({ itemType, color, setColor }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(true);

  const checkIfButtonNeeded = () => {
    if (rootRef.current && contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setShouldShowButton(contentHeight > COLLAPSED_HEIGHT);
    }
  };

  useEffect(() => {
    checkIfButtonNeeded();
  }, [color]);

  useEffect(() => {
    const handleResize = () => checkIfButtonNeeded();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="mt-1">
      <AnimateHeight
        height={!shouldShowButton || expanded ? "auto" : COLLAPSED_HEIGHT}
        className="position-relative"
        duration={400}
        ref={rootRef}
      >
        <div className={cx(shouldShowButton && "pb-5")} ref={contentRef}>
          {map(color.colorPalette, (c, value) => (
            <div
              key={value}
              className="d-inline-block w-50 d-inline-flex align-items-baseline flex-nowrap"
              title={value}
            >
              <ColorPicker
                color={c}
                onChange={(v) =>
                  setColor({
                    ...color,
                    colorPalette: {
                      ...color.colorPalette,
                      [value]: v,
                    },
                  })
                }
              />
              <label className="form-check-label small ms-1 flex-grow-1 flex-shrink-1 text-ellipsis">{value}</label>
            </div>
          ))}

          <div className="d-flex align-items-baseline mt-1">
            <ColorPicker color={color.missingColor} onChange={(v) => setColor({ ...color, missingColor: v })} />
            <label className="form-check-label small ms-1">
              {t("appearance.color.default_value", { items: t(`graph.model.${itemType}`) })}
            </label>
          </div>
        </div>

        {!expanded && shouldShowButton && <div className="filler-fade-out position-absolute bottom-0" />}

        {shouldShowButton && (
          <div className="w-100 bottom-0 position-absolute text-center">
            <button className="gl-btn gl-btn-outline w-100" onClick={() => setExpanded(!expanded)}>
              {expanded ? <> {t("common.show_less")}</> : <> {t("common.show_more")}</>}
            </button>
          </div>
        )}
      </AnimateHeight>
    </div>
  );
};
