import { useSigma } from "@react-sigma/core";
import { FC, useCallback, useEffect, useRef } from "react";
import { getPixelRatio } from "sigma/utils";

export const GridController: FC<{ size: number; opacity: number }> = ({ size, opacity }) => {
  const sigma = useSigma();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { angle, ratio } = sigma.getCamera().getState();
    const center = sigma.framedGraphToViewport({ x: 0.5, y: 0.5 });
    const { width, height } = sigma.getDimensions();
    const stageSize = Math.sqrt(width ** 2 + height ** 2) / 2;
    const gridSize = size / ratio;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.translate(-center.x, -center.y);

    ctx.translate(center.x, center.y);

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = "#000";

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
  }, [size, opacity, sigma]);

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

  return <canvas ref={canvasRef} className="position-absolute inset-0" />;
};
