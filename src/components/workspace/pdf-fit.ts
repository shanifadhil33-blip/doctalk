/** Width of the PDF page so 100% matches the pane and does not widen the screen. */
export function fittedPageWidth(containerWidth: number, zoomPercent: number): number {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 0;
  const zoom = Number.isFinite(zoomPercent) ? zoomPercent : 100;
  return Math.max(1, Math.round(containerWidth * (zoom / 100)));
}
