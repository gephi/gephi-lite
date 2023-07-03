import { FC, useCallback, useEffect, useState } from "react";
import { GraphCaptionProps } from ".";
import { Size } from "../../core/appearance/types";
import { shortenNumber } from "../GraphFilters/utils";
import { useSigmaAtom, useVisualGetters } from "../../core/context/dataContexts";

const NodeSizeCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    nodesSize: Size;
    range?: { min: number; max: number };
  }
> = ({ minimal, nodesSize, range }) => {
  const sigma = useSigmaAtom();
  // update nodeSize Size to camera updates from Sigma
  const { getNodeSize } = useVisualGetters();

  const [nodeSizeState, setNodeSizeState] = useState<
    | {
        minValue: number;
        minRadius: number;
        maxValue: number;
        maxRadius: number;
      }
    | undefined
  >(undefined);

  const refreshState = useCallback(() => {
    if (!sigma || !nodesSize.field || !range || !getNodeSize || !range) return null;

    setNodeSizeState({
      minValue: range.min,
      minRadius: sigma.scaleSize(getNodeSize({ [nodesSize.field]: range.min })),
      maxValue: range.max,
      maxRadius: sigma.scaleSize(getNodeSize({ [nodesSize.field]: range.max })),
    });
  }, [getNodeSize, sigma, nodesSize.field, range]);

  // Refresh caption when metric changes:
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Refresh caption on camera update:
  useEffect(() => {
    sigma.getCamera().addListener("updated", refreshState);
    return () => {
      sigma.getCamera().removeListener("updated", refreshState);
    };
  }, [sigma, refreshState]);

  if (nodesSize.field) {
    return (
      <div className="graph-caption-item">
        <h4 className="fs-6">{nodesSize.field}:</h4>
        {nodeSizeState && (
          <div className="node-sizes">
            <div>
              <div className="circle-wrapper">
                <div
                  className="dotted-circle"
                  style={{ width: nodeSizeState?.minRadius * 2, height: nodeSizeState?.minRadius * 2 }}
                />
              </div>
              <div className="caption text-center">{shortenNumber(nodeSizeState?.minValue)}</div>
            </div>
            <div className="ms-2">
              <div className="circle-wrapper">
                <div
                  className="dotted-circle"
                  style={{ width: nodeSizeState?.maxRadius * 2, height: nodeSizeState?.maxRadius * 2 }}
                />
              </div>
              <div className="caption text-center">{shortenNumber(nodeSizeState?.maxValue)}</div>
            </div>
          </div>
        )}
      </div>
    );
  } else return null;
};

export default NodeSizeCaption;
