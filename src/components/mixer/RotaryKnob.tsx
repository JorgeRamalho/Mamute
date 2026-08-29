import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number) {
  return (value - min) / (max - min);
}

function dialDeg(norm: number) {
  return norm * 270 - 135;
}

function valueFromAngle(deg: number, min: number, max: number) {
  const norm = clamp((deg + 135) / 270, 0, 1);
  return min + norm * (max - min);
}

function snapValue(value: number, min: number, max: number, step: number) {
  const steps = Math.round((clamp(value, min, max) - min) / step);
  return clamp(min + steps * step, min, max);
}

function angleFromPointer(clientX: number, clientY: number, rect: DOMRect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rad = Math.atan2(clientX - cx, cy - clientY);
  return (rad * 180) / Math.PI;
}

export function RotaryKnob({
  label,
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  formatValue,
  toneClass = "",
  disabled = false,
  hideLabel = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  formatValue: (value: number) => string;
  toneClass?: string;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  const dialRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const norm = normalize(value, min, max);
  const display = formatValue(value);
  const sliderValue = Math.round(norm * 100);

  const setFromPointer = (clientX: number, clientY: number) => {
    if (disabled) return;
    const dial = dialRef.current;
    if (!dial) return;
    const rect = dial.getBoundingClientRect();
    const next = snapValue(valueFromAngle(angleFromPointer(clientX, clientY, rect), min, max), min, max, step);
    onChange(next);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
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
    <div
      className={`mixer-vol-knob${toneClass ? ` ${toneClass}` : ""}${disabled ? " is-disabled" : ""}`}
    >
      {hideLabel ? null : <span className="mixer-vol-knob-label">{label}</span>}
      <div
        ref={dialRef}
        className="mixer-vol-knob-dial"
        style={{ "--vol-rot": `${dialDeg(norm)}deg` } as CSSProperties}
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
          value={sliderValue}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={display}
          className="mixer-vol-knob-input"
          onChange={(event) => {
            const nextNorm = Number(event.target.value) / 100;
            onChange(snapValue(min + nextNorm * (max - min), min, max, step));
          }}
        />
      </div>
      <span className="mixer-vol-knob-value" aria-hidden="true">
        {display}
      </span>
    </div>
  );
}
