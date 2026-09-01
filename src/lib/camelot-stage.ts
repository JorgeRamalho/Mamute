const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

function facing(root: HTMLElement, cx: number, cy: number): { yaw: string; pitch: string; glintX: string; glintY: string } {
  const hour = Number.parseInt(root.dataset.hour ?? "8", 10);
  const letter = root.dataset.letter === "B" ? "B" : "A";
  const wrapped = Number.isFinite(hour) ? hour : 8;
  const faceYaw = -((wrapped % 12) * 30);
  const facePitch = letter === "B" ? -26 : 24;
  return {
    yaw: `${(faceYaw + cx * 34).toFixed(2)}deg`,
    pitch: `${(facePitch + cy * -18).toFixed(2)}deg`,
    glintX: `${(38 + cx * 36).toFixed(1)}%`,
    glintY: `${(28 + cy * 32).toFixed(1)}%`,
  };
}

function paint(root: HTMLElement, cx: number, cy: number) {
  const pose = facing(root, cx, cy);
  root.style.setProperty("--sphere-y", pose.yaw);
  root.style.setProperty("--sphere-x", pose.pitch);
  root.style.setProperty("--glint-x", pose.glintX);
  root.style.setProperty("--glint-y", pose.glintY);
}

/** Giroscópio da esfera Camelot: enfrenta o tom e segue o ponteiro. */
export function bindCamelotStage(root: HTMLElement): () => void {
  const reduce = window.matchMedia(REDUCE_MOTION);
  const fine = window.matchMedia(FINE_POINTER);

  let frame = 0;
  let running = false;
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;

  const tick = () => {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    paint(root, cx, cy);
    const settled = Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002;
    if (settled) {
      running = false;
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const ensureTick = () => {
    if (running) return;
    running = true;
    frame = requestAnimationFrame(tick);
  };

  const onMove = (event: PointerEvent) => {
    if (reduce.matches || !fine.matches) return;
    const rect = root.getBoundingClientRect();
    tx = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    ty = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    ensureTick();
  };

  const onLeave = () => {
    tx = 0;
    ty = 0;
    ensureTick();
  };

  const observer = new MutationObserver(() => {
    paint(root, cx, cy);
  });
  observer.observe(root, { attributes: true, attributeFilter: ["data-hour", "data-letter"] });

  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerleave", onLeave);
  paint(root, 0, 0);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
  };
}
