export function bindUpHandler(handler: () => void): () => void {
  const mouseUpHandler = handler;
  const touchUpHandler = (e: TouchEvent) => {
    if (!e.touches.length) mouseUpHandler();
  };

  window.addEventListener("mouseup", mouseUpHandler);
  window.addEventListener("touchend", touchUpHandler);

  return () => {
    window.removeEventListener("mouseup", mouseUpHandler);
    window.removeEventListener("touchend", touchUpHandler);
  };
}
