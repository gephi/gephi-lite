import { FC, useCallback, useEffect, useState } from "react";
import { GraphCaptionProps, RangeExtends } from ".";
import { Size } from "../../core/appearance/types";
import { shortenNumber } from "../GraphFilters/utils";
import { useSigmaAtom, useVisualGetters } from "../../core/context/dataContexts";

const NodesSizeCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    nodesSize: Size;
    extend?: RangeExtends;
  }
> = ({ minimal, nodesSize, extend }) => {
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
    if (!sigma || !nodesSize.field || !extend || !getNodeSize || !extend) return null;

    setNodeSizeState({
      minValue: extend.min,
      minRadius: sigma.scaleSize(getNodeSize({ [nodesSize.field]: extend.min })),
      maxValue: extend.max,
      maxRadius: sigma.scaleSize(getNodeSize({ [nodesSize.field]: extend.max })),
    });
  }, [getNodeSize, sigma, nodesSize.field, extend]);

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
        <h4 className="fs-6">{nodesSize.field}</h4>
        {nodeSizeState && (
          <div className="node-sizes">
            <div className="node-size">
              <div className="circle-wrapper">
                <div
                  className="dotted-circle"
                  style={{ width: nodeSizeState?.minRadius * 2, height: nodeSizeState?.minRadius * 2 }}
                />
              </div>
              <div className="caption text-center">{shortenNumber(nodeSizeState?.minValue)}</div>
            </div>
            <div className="node-size">
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

export default NodesSizeCaption;
