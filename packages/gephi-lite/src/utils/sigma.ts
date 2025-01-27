import Graph from "graphology";
import { Dimensions } from "graphology-layout/conversion";
import Sigma from "sigma";
import { Settings } from "sigma/settings";
import { CameraState } from "sigma/types";

import { wait } from "./promises";

type LightAttributes = { [key: string]: unknown };

export async function getGraphSnapshot(
  graph: Graph,
  settings: Partial<Settings<LightAttributes, LightAttributes, LightAttributes>>,
  {
    width,
    height,
    ratio,
    backgroundColor,
    cameraState,
  }: Dimensions & { ratio: number; backgroundColor: string; cameraState?: Partial<CameraState> },
): Promise<Blob> {
  const pixelRatio = window.devicePixelRatio || 1;

  const div = document.createElement("DIV");
  div.style.width = `${width * ratio}px`;
  div.style.height = `${height * ratio}px`;
  div.style.position = "absolute";
  div.style.right = "101%";
  div.style.bottom = "101%";
  div.style.background = backgroundColor;
  document.body.append(div);

  // Instantiate sigma:
  const renderer = new Sigma(graph, div, settings);

  if (cameraState) renderer.getCamera().setState(cameraState);

  await wait(0);

  // Capture sigma rendering:
  const canvas = document.createElement("CANVAS") as HTMLCanvasElement;
  canvas.setAttribute("width", width * pixelRatio + "");
  canvas.setAttribute("height", height * pixelRatio + "");
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  // This weird casting allows accessing "private" sigma properties:
  const elements = (renderer as unknown as { elements: Record<string, HTMLCanvasElement> }).elements;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width * ratio * pixelRatio, height * ratio * pixelRatio);
  [elements.edges, elements.edgeLabels, elements.nodes, elements.labels].forEach((canvas) =>
    ctx.drawImage(
      canvas,
      0,
      0,
      width * ratio * pixelRatio,
      height * ratio * pixelRatio,
      0,
      0,
      width * pixelRatio,
      height * pixelRatio,
    ),
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject("Cannot generate sigma screenshot");
    }, "image/png");
  });

  renderer.kill();
  div.remove();

  return blob;
}
