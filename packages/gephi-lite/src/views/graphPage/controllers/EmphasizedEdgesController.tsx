import { useSigma } from "@react-sigma/core";
import { FC, useEffect } from "react";
import { getPixelRatio } from "sigma/utils";

import { useSelection, useSigmaState } from "../../../core/context/dataContexts";
import { GephiLiteSigma } from "../../../core/graph/types";
import { getEmphasizedEdges } from "../../../core/sigma/utils";

/**
 * Sigma draws every edge under every node. To let the emphasized edges (typically the selected ones)
 * cross over the nodes they pass by, they are drawn once more on a canvas set right above the nodes,
 * from the border of their source to the border of their target (so that their own extremities stay
 * clear). The labels remain above that canvas.
 */
export const EmphasizedEdgesController: FC = () => {
  const sigma: GephiLiteSigma = useSigma();
  const selection = useSelection();
  const { emphasizedNodes, emphasizedEdges, hoveredNode } = useSigmaState();

  useEffect(() => {
    const graph = sigma.getGraph();
    const nodesCanvas = sigma.getCanvases().nodes;
    const canvas = document.createElement("canvas");
    canvas.className = "sigma-emphasized-edges";
    Object.assign(canvas.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    nodesCanvas.after(canvas);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = sigma.getDimensions();
      const pixelRatio = getPixelRatio();
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(pixelRatio, pixelRatio);

      const emphasized = getEmphasizedEdges({ graph, selection, hoveredNode, emphasizedNodes, emphasizedEdges });
      emphasized.forEach((edge) => {
        const display = sigma.getEdgeDisplayData(edge);
        if (!display || display.hidden || !graph.hasEdge(edge)) return;
        const source = sigma.getNodeDisplayData(graph.source(edge));
        const target = sigma.getNodeDisplayData(graph.target(edge));
        if (!source || !target || source.hidden || target.hidden) return;

        const from = sigma.framedGraphToViewport(source);
        const to = sigma.framedGraphToViewport(target);
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const fromRadius = sigma.scaleSize(source.size);
        const toRadius = sigma.scaleSize(target.size);
        // Nothing to draw when the nodes overlap:
        if (distance <= fromRadius + toRadius) return;

        const dx = (to.x - from.x) / distance;
        const dy = (to.y - from.y) / distance;
        ctx.beginPath();
        ctx.moveTo(from.x + dx * fromRadius, from.y + dy * fromRadius);
        ctx.lineTo(to.x - dx * toRadius, to.y - dy * toRadius);
        ctx.strokeStyle = display.color;
        ctx.lineWidth = Math.max(sigma.scaleSize(display.size), 0.5);
        ctx.stroke();
      });
    };

    sigma.on("afterRender", draw);
    sigma.scheduleRender();

    return () => {
      sigma.off("afterRender", draw);
      canvas.remove();
    };
  }, [sigma, selection, hoveredNode, emphasizedNodes, emphasizedEdges]);

  return null;
};
