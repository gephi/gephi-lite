import { useSigma } from "@react-sigma/core";
import { nodeExtent } from "graphology-metrics/graph";
import { mean } from "lodash";
import { FC, useCallback, useEffect, useRef } from "react";
import { getPixelRatio } from "sigma/utils";

const T = 0.05;
const MIN_GRID_SIZE = 50;

export const GridController: FC<{ size: number; opacity: number; color: string }> = ({ size, opacity, color }) => {
  const sigma = useSigma();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const slowedSizeRef = useRef(size);
  const slowedOpacityRef = useRef(opacity);

  const updateSlowInputs = useCallback(() => {
    const newSlowedSize = size * T + slowedSizeRef.current * (1 - T);
    const newSlowedOpacity = opacity * T + slowedOpacityRef.current * (1 - T);

    if (Math.abs((newSlowedSize - size) / size) >= 0.01) {
      slowedSizeRef.current = newSlowedSize;
      slowedOpacityRef.current = newSlowedOpacity;
      return true;
    } else {
      slowedSizeRef.current = size;
      slowedOpacityRef.current = opacity;
      return false;
    }
  }, [size, opacity]);

  const draw = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    const redraw = updateSlowInputs();

    const slowedSize = slowedSizeRef.current;
    const slowedOpacity = slowedOpacityRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { angle } = sigma.getCamera().getState();
    const { x, y } = nodeExtent(sigma.getGraph(), ["x", "y"]);
    const center = sigma.graphToViewport({ x: mean(x), y: mean(y) });
    let { width, height } = sigma.getDimensions();
    const pixelRatio = getPixelRatio();

    width *= pixelRatio;
    height *= pixelRatio;
    center.x *= pixelRatio;
    center.y *= pixelRatio;

    const stageSize = Math.sqrt(width ** 2 + height ** 2) / 2;
    const gridSize = slowedSize * sigma.getGraphToViewportRatio();

    const finalOpacity =
      gridSize > MIN_GRID_SIZE ? slowedOpacity : (slowedOpacity * (gridSize - MIN_GRID_SIZE / 2)) / (MIN_GRID_SIZE / 2);

    ctx.clearRect(0, 0, width, height);
    if (finalOpacity <= 0) return;

    ctx.save();

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.translate(-center.x, -center.y);

    ctx.translate(center.x, center.y);

    ctx.translate(
      gridSize * Math.round((width / 2 - center.x) / gridSize),
      gridSize * Math.round((height / 2 - center.y) / gridSize),
    );

    ctx.globalAlpha = finalOpacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;

    for (let x = gridSize / 2; x <= stageSize; x += gridSize) {
      for (let r = -1; r <= 1; r += 2) {
        ctx.beginPath();
        ctx.moveTo(x * r, -stageSize);
        ctx.lineTo(x * r, stageSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-stageSize, x * r);
        ctx.lineTo(stageSize, x * r);
        ctx.stroke();
      }
    }

    ctx.restore();

    if (redraw) {
      timeoutRef.current = window.setTimeout(draw, 30);
    }
  }, [color, sigma, updateSlowInputs]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = sigma.getDimensions();
    const pixelRatio = getPixelRatio();
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.setAttribute("width", width * pixelRatio + "px");
    canvas.setAttribute("height", height * pixelRatio + "px");
  }, [sigma]);

  useEffect(() => {
    if (!sigma) return;

    resize();
    draw();
    sigma.on("resize", resize);
    sigma.on("afterRender", draw);
    return () => {
      sigma.off("resize", resize);
      sigma.off("afterRender", draw);
    };
  }, [sigma, resize, draw]);

  return <canvas ref={canvasRef} className="position-absolute inset-0 graph-layout-grid" />;
};
