import { useEffect, useRef } from "react";
import { radioMp3Station } from "../../lib/radio-mp3-station";

type RadioLiveStageProps = {
  className?: string;
};

export function RadioLiveStage({ className }: RadioLiveStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const el = radioMp3Station.element;
    el.className = className ? `radio-mp3-el ${className}` : "radio-mp3-el";
    host.appendChild(el);
    return () => {
      if (el.parentElement === host) host.removeChild(el);
    };
  }, [className]);

  return <div ref={hostRef} className="radio-mp3-host" />;
}
