import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function volumeDialDeg(value: number) {
  return value * 270 - 135;
}

function valueFromAngle(deg: number) {
  return clamp01((deg + 135) / 270);
}

function angleFromPointer(clientX: number, clientY: number, rect: DOMRect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rad = Math.atan2(clientX - cx, cy - clientY);
  return (rad * 180) / Math.PI;
}

export type VolumeKnobTone = "master" | "booth" | "cue";

export function VolumeKnob({
  label,
  value,
  onChange,
  ariaLabel,
  tone = "master",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  tone?: VolumeKnobTone;
}) {
  const dialRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const percent = Math.round(value * 100);

  const setFromPointer = (clientX: number, clientY: number) => {
    const dial = dialRef.current;
    if (!dial) return;
    const rect = dial.getBoundingClientRect();
    onChange(valueFromAngle(angleFromPointer(clientX, clientY, rect)));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dial = dialRef.current;
    if (!dial) return;
    draggingRef.current = true;
    dial.setPointerCapture(event.pointerId);
    inputRef.current?.focus({ preventScroll: true });
    setFromPointer(event.clientX, event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    setFromPointer(event.clientX, event.clientY);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={`mixer-vol-knob mixer-vol-knob--${tone}`}>
      <span className="mixer-vol-knob-label">{label}</span>
      <div
        ref={dialRef}
        className="mixer-vol-knob-dial"
        style={{ "--vol-rot": `${volumeDialDeg(value)}deg` } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="mixer-vol-knob-face" aria-hidden="true">
          <span className="mixer-vol-knob-tick" />
        </span>
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}%`}
          className="mixer-vol-knob-input"
          onChange={(event) => onChange(Number(event.target.value) / 100)}
        />
      </div>
      <span className="mixer-vol-knob-value" aria-hidden="true">
        {percent}%
      </span>
    </div>
  );
}
