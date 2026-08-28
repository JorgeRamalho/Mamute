import { visorBeatPhase } from "./visor-motion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

/** Inclinação, brilho e pulso de beat no visor 3D do hero. */
export function bindVisorStage(root: HTMLElement): () => void {
  const reduce = window.matchMedia(REDUCE_MOTION);
  const fine = window.matchMedia(FINE_POINTER);

  let frame = 0;
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;

  const tick = (now: number) => {
    cx += (tx - cx) * 0.09;
    cy += (ty - cy) * 0.09;
    const pulse = 0.42 + 0.58 * Math.abs(Math.sin(visorBeatPhase(now) * Math.PI));
    const restX = reduce.matches ? 0 : 3;
    const restY = 0;
    root.style.setProperty("--tilt-x", `${(restX + cy * -6).toFixed(2)}deg`);
    root.style.setProperty("--tilt-y", `${(restY + cx * 7).toFixed(2)}deg`);
    root.style.setProperty("--parallax-x", `${(cx * 10).toFixed(2)}px`);
    root.style.setProperty("--parallax-y", `${(cy * 8).toFixed(2)}px`);
    root.style.setProperty("--glint-x", `${(46 + cx * 42).toFixed(1)}%`);
    root.style.setProperty("--glint-y", `${(22 + cy * 38).toFixed(1)}%`);
    root.style.setProperty("--beat-pulse", pulse.toFixed(3));
    frame = requestAnimationFrame(tick);
  };

  const onMove = (event: PointerEvent) => {
    if (reduce.matches || !fine.matches) return;
    const rect = root.getBoundingClientRect();
    tx = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    ty = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
  };

  const onLeave = () => {
    tx = 0;
    ty = 0;
  };

  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerleave", onLeave);
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
  };
}
