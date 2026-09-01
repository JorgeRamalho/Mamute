import { useCallback, useEffect, useMemo, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { bindCamelotStage } from "../../lib/camelot-stage";
import {
  CAMELOT_BY_CODE,
  CAMELOT_CLOCKWISE_HOURS,
  camelotRelation,
  getCamelotKey,
  neighborCamelot,
  parseCamelot,
} from "../../lib/musical-key";
import type { CamelotLetter } from "../../types/harmony";

const SPHERE_R = 148;
const D_LON = 30;
const D_LAT = 28;
const LAT_BANDS_B = [22, 50, 76] as const;
const LAT_BANDS_A = [-22, -50, -76] as const;

function panelSize(latDeg: number): { width: number; height: number } {
  const lat = (latDeg * Math.PI) / 180;
  const width = 2 * SPHERE_R * Math.cos(lat) * Math.tan((D_LON * Math.PI) / 360);
  const height = SPHERE_R * ((D_LAT * Math.PI) / 180);
  return {
    width: Math.max(8, width),
    height: Math.max(10, height),
  };
}

function sectorState(code: string, selected: string): "selected" | "related" | "idle" {
  const relation = camelotRelation(selected, code);
  switch (relation) {
    case "perfect":
      return "selected";
    case "relative":
    case "neighbor":
      return "related";
    case "diagonal":
    case "shift":
      return "idle";
    default: {
      const _never: never = relation;
      return _never;
    }
  }
}

interface SpherePanel {
  code: string;
  hour: number;
  letter: CamelotLetter;
  lon: number;
  lat: number;
  radio: boolean;
  color: string;
  label: string;
  namePt: string;
  nameIntl: string;
  width: number;
  height: number;
}

function buildPanels(): SpherePanel[] {
  const bands: { letter: CamelotLetter; lats: readonly number[] }[] = [
    { letter: "B", lats: LAT_BANDS_B },
    { letter: "A", lats: LAT_BANDS_A },
  ];
  const panels: SpherePanel[] = [];
  for (const hour of CAMELOT_CLOCKWISE_HOURS) {
    const lon = (hour % 12) * D_LON;
    for (const band of bands) {
      const key = CAMELOT_BY_CODE[`${hour}${band.letter}`];
      if (!key) continue;
      band.lats.forEach((lat, index) => {
        const size = panelSize(lat);
        panels.push({
          code: key.code,
          hour,
          letter: band.letter,
          lon,
          lat,
          radio: index === 0,
          color: key.color,
          label: key.code,
          namePt: key.namePt,
          nameIntl: key.nameIntl,
          width: size.width,
          height: size.height,
        });
      });
    }
  }
  return panels;
}

interface CamelotWheelProps {
  selected: string;
  onSelect: (code: string) => void;
}

export function CamelotWheel({ selected, onSelect }: CamelotWheelProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const active = getCamelotKey(selected) ?? CAMELOT_BY_CODE["8A"]!;
  const panels = useMemo(() => buildPanels(), []);

  useEffect(() => {
    const root = sceneRef.current;
    if (!root) return;
    return bindCamelotStage(root);
  }, []);

  const onWheelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const parsed = parseCamelot(selected);
      if (!parsed) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const next = neighborCamelot(selected, 1);
        if (next) onSelect(next);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const next = neighborCamelot(selected, -1);
        if (next) onSelect(next);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        onSelect(`${parsed.hour}B`);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        onSelect(`${parsed.hour}A`);
      }
    },
    [onSelect, selected],
  );

  return (
    <div
      ref={sceneRef}
      className="camelot-scene"
      data-hour={String(active.hour)}
      data-letter={active.letter}
      style={{ "--key-color": active.color } as CSSProperties}
    >
      <div className="camelot-chassis">
        <p className="camelot-telemetry">
          <span>Holo-deck</span>
          <span>Camelot OS</span>
          <span>Vector lock</span>
        </p>

        <div
          className="camelot-gyro"
          role="radiogroup"
          aria-label="Esfera Camelot de tons maiores e menores"
          tabIndex={0}
          onKeyDown={onWheelKeyDown}
        >
          <span className="camelot-halo" aria-hidden="true" />
          <span className="camelot-orbit camelot-orbit-outer" aria-hidden="true" />
          <span className="camelot-orbit camelot-orbit-mid" aria-hidden="true" />
          <span className="camelot-orbit camelot-orbit-inner" aria-hidden="true" />
          <span className="camelot-floor" aria-hidden="true" />
          <span className="camelot-sphere-nucleus" aria-hidden="true" />

          <div className="camelot-space">
            <div className="camelot-sphere">
              <span className="camelot-equator" aria-hidden="true" />
              {panels.map((panel) => {
                const state = sectorState(panel.code, selected);
                const panelStyle = {
                  "--panel-color": panel.color,
                  "--lon": `${panel.lon}deg`,
                  "--lat": `${panel.lat}deg`,
                  "--pw": `${panel.width.toFixed(2)}px`,
                  "--ph": `${panel.height.toFixed(2)}px`,
                } as CSSProperties;

                if (!panel.radio) {
                  return (
                    <span
                      key={`${panel.code}-${panel.lat}`}
                      className="camelot-panel"
                      data-ring={panel.letter}
                      data-state={state}
                      data-radio="false"
                      aria-hidden="true"
                      style={panelStyle}
                      onClick={() => onSelect(panel.code)}
                    />
                  );
                }

                return (
                  <button
                    key={`${panel.code}-${panel.lat}`}
                    type="button"
                    className="camelot-panel"
                    data-ring={panel.letter}
                    data-state={state}
                    data-radio="true"
                    role="radio"
                    aria-checked={state === "selected"}
                    aria-label={`${panel.code} · ${panel.namePt} (${panel.nameIntl})`}
                    tabIndex={-1}
                    style={panelStyle}
                    onClick={() => onSelect(panel.code)}
                  >
                    <span>{panel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="camelot-sphere-shade" aria-hidden="true" />
          <div className="camelot-core-badge" aria-hidden="true">
            <strong>{active.code}</strong>
            <span>{active.mode}</span>
          </div>
        </div>
      </div>

      <p className="camelot-wheel-legend">
        <span data-ring="B">B · maior · hemisfério norte</span>
        <span data-ring="A">A · menor · hemisfério sul</span>
        <span>Esfera 3D · setas navegam</span>
      </p>
    </div>
  );
}
