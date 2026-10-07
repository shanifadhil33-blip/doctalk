/** Movement past this distance is a scroll, not a tap. */
export const pressSlopPx = 8;

export function pointerMoved(
  start: { x: number; y: number } | null,
  point: { clientX: number; clientY: number },
): boolean {
  if (!start) return false;
  const dx = point.clientX - start.x;
  const dy = point.clientY - start.y;
  return dx * dx + dy * dy > pressSlopPx * pressSlopPx;
}

/** A scroll that starts on a card must not open it. */
export function blockScrollClick(
  start: { x: number; y: number } | null,
  event: { clientX: number; clientY: number; preventDefault: () => void },
): boolean {
  if (!pointerMoved(start, event)) return false;
  event.preventDefault();
  return true;
}
