import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PLATFORMS } from "../../data/platforms";
import { visorBeatPhase, visorWaveFrame } from "../../lib/visor-motion";
import { bindVisorStage } from "../../lib/visor-stage";

const TECH = ["Web Audio", "CSS3", "Canvas HUD", "CDJ Sim", "Playwright"] as const;
const VU_BARS = 12;

export function DigitalVisor() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clock, setClock] = useState(() => new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return bindVisorStage(root);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      const now = performance.now();
      const frame = visorWaveFrame(now);
      const pulse = 0.42 + 0.58 * Math.abs(Math.sin(visorBeatPhase(now) * Math.PI));
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(0, 232, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 6; g += 1) {
        const y = (height / 6) * g;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const cyan = ctx.createLinearGradient(0, 0, width, 0);
      cyan.addColorStop(0, "rgba(0, 232, 255, 0.15)");
      cyan.addColorStop(0.45, `rgba(122, 246, 255, ${0.45 + 0.5 * pulse})`);
      cyan.addColorStop(1, "rgba(139, 124, 255, 0.75)");
      ctx.shadowBlur = 16 * pulse;
      ctx.shadowColor = "rgba(0, 232, 255, 0.75)";
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = 0; x < width; x += 1) {
        const wave =
          Math.sin((x + frame) * 0.035) * 14 + Math.sin((x + frame) * 0.09) * 7;
        const y = height / 2 + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const magenta = ctx.createLinearGradient(0, 0, width, 0);
      magenta.addColorStop(0, "rgba(255, 45, 149, 0.25)");
      magenta.addColorStop(0.55, `rgba(255, 122, 196, ${0.35 + 0.35 * pulse})`);
      magenta.addColorStop(1, "rgba(255, 193, 74, 0.5)");
      ctx.shadowColor = "rgba(255, 45, 149, 0.5)";
      ctx.strokeStyle = magenta;
      ctx.beginPath();
      for (let x = 0; x < width; x += 1) {
        const wave = Math.cos((x + frame * 1.4) * 0.05) * 9;
        const y = height / 2 + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    resize();
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="visor-scene">
      <aside
        ref={rootRef}
        className="visor"
        aria-label="Visor digital Mamute DJPLAYER"
      >
        <div className="visor-space">
          <div className="visor-halo" aria-hidden="true" />
          <div className="visor-ring visor-ring-outer" aria-hidden="true" />
          <div className="visor-ring visor-ring-mid" aria-hidden="true" />
          <div className="visor-ring visor-ring-inner" aria-hidden="true" />

          <div className="visor-chassis">
            <div className="visor-bezel">
              <span>MAMUTE OS 1.0</span>
              <span>SIGNAL LOCK</span>
              <span>{clock} UTC</span>
            </div>
            <div className="visor-screen">
              <div className="visor-metrics">
                <div className="metric" data-depth="1">
                  <small>DECK A</small>
                  <strong>124.00</strong>
                </div>
                <div className="metric" data-depth="2">
                  <small>DECK B</small>
                  <strong>128.00</strong>
                </div>
                <div className="metric" data-depth="3">
                  <small>KEY</small>
                  <strong>8A / 9A</strong>
                </div>
                <div className="metric" data-depth="4">
                  <small>HEADROOM</small>
                  <strong>-6.0 dB</strong>
                </div>
              </div>
              <div className="tech-orbit">
                {PLATFORMS.map((platform, index) => (
                  <span
                    className="tech-chip"
                    key={platform.id}
                    style={
                      {
                        "--chip": platform.accent,
                        "--orbit-i": String(index),
                      } as CSSProperties
                    }
                  >
                    {platform.name}
                  </span>
                ))}
                {TECH.map((tech, index) => (
                  <span
                    className="tech-chip"
                    key={tech}
                    style={{ "--orbit-i": String(index + PLATFORMS.length) } as CSSProperties}
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="visor-hud">
                <canvas ref={canvasRef} className="visor-canvas" aria-hidden="true" />
                <div className="visor-vu" aria-hidden="true">
                  {Array.from({ length: VU_BARS }, (_, index) => (
                    <span key={index} style={{ "--vu-i": String(index) } as CSSProperties} />
                  ))}
                </div>
              </div>
            </div>
            <div className="visor-platters" aria-hidden="true">
              <div className="visor-platter visor-platter-a">
                <span>A</span>
              </div>
              <div className="visor-platter visor-platter-b">
                <span>B</span>
              </div>
            </div>
          </div>

          <div className="visor-floor" aria-hidden="true" />
        </div>
      </aside>
    </div>
  );
}
