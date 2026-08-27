import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PLATFORMS } from "../../data/platforms";

export function DigitalVisor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clock, setClock] = useState(() => new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(0, 232, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < width; x += 1) {
        const wave =
          Math.sin((x + frame) * 0.035) * 12 + Math.sin((x + frame) * 0.09) * 6;
        const y = height / 2 + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 45, 149, 0.55)";
      ctx.beginPath();
      for (let x = 0; x < width; x += 1) {
        const wave = Math.cos((x + frame * 1.4) * 0.05) * 8;
        ctx.lineTo(x, height / 2 + wave);
      }
      ctx.stroke();
      frame += 1;
      raf = requestAnimationFrame(draw);
    };

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
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
    <aside className="visor" aria-label="Visor digital Harako">
      <div className="visor-bezel">
        <span>HARAKO OS 1.0</span>
        <span>SIGNAL LOCK</span>
        <span>{clock} UTC</span>
      </div>
      <div className="visor-screen">
        <div className="visor-metrics">
          <div className="metric">
            <small>DECK A</small>
            <strong>124.00</strong>
          </div>
          <div className="metric">
            <small>DECK B</small>
            <strong>128.00</strong>
          </div>
          <div className="metric">
            <small>KEY</small>
            <strong>8A / 9A</strong>
          </div>
          <div className="metric">
            <small>HEADROOM</small>
            <strong>-6.0 dB</strong>
          </div>
        </div>
        <div className="tech-orbit">
          {PLATFORMS.map((platform) => (
            <span
              className="tech-chip"
              key={platform.id}
              style={{ "--chip": platform.accent } as CSSProperties}
            >
              {platform.name}
            </span>
          ))}
          {["Web Audio", "CSS3", "Canvas HUD", "CDJ Sim", "Playwright"].map((tech) => (
            <span className="tech-chip" key={tech}>
              {tech}
            </span>
          ))}
        </div>
        <canvas ref={canvasRef} className="visor-canvas" aria-hidden="true" />
      </div>
    </aside>
  );
}
