import { useCallback, useEffect, useRef, useState } from "react";
import type { MixerAction } from "../../types/mixer";
import { createDdj400MapContext, mapDdj400 } from "./ddj-400-map";
import { createMidiActionQueue } from "./midi-coalesce";
import {
  getMidiSnapshot,
  injectMidiBytes,
  restartMidiSession,
  startMidiSession,
  subscribeMidiBytes,
  subscribeMidiStatus,
  type MidiLinkStatus,
} from "./midi-session";
import { parseMidiMessage } from "./parse-message";

const LIVE_MS = 220;

export interface MidiControllerState {
  status: MidiLinkStatus;
  deviceName: string | null;
  ports: string[];
  lastHeard: string | null;
  error: string | null;
  live: boolean;
  connect: () => void;
}

/**
 * Liga a Web MIDI ao `dispatch` da cabine.
 *
 * Nada aqui despacha por byte. Knob e fader entram na fila de
 * `midi-coalesce` e saem uma vez por `requestAnimationFrame`, ao passo que
 * botão sai na hora, porque esperar frame num clique apareceria como input
 * lag. O rótulo do chip acompanha o mesmo frame, senão o diagnóstico
 * re-renderizaria a cabine a cada mensagem e desfaria o ganho da fila.
 *
 * @param onAction Callback do reducer, que recebe cada `MixerAction` mapeada a
 * partir de uma mensagem da DDJ-400.
 */
export function useMidiController(onAction: (action: MixerAction) => void): MidiControllerState {
  const onActionRef = useRef(onAction);
  const ctxRef = useRef(createDdj400MapContext());
  const queueRef = useRef(createMidiActionQueue());
  const heardRef = useRef<string | null>(null);
  const frameRef = useRef(0);
  const liveTimerRef = useRef(0);
  const initial = getMidiSnapshot();
  const [status, setStatus] = useState<MidiLinkStatus>(initial.status);
  const [deviceName, setDeviceName] = useState<string | null>(initial.deviceName);
  const [ports, setPorts] = useState<string[]>(initial.ports);
  const [lastHeard, setLastHeard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initial.error);
  const [live, setLive] = useState(false);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  /**
   * Descarrega o frame, primeiro o diagnóstico e depois as ações na ordem em
   * que os controles foram tocados.
   */
  const flush = useCallback(() => {
    frameRef.current = 0;

    const heard = heardRef.current;
    if (heard !== null) {
      heardRef.current = null;
      setLastHeard(heard);
      setLive(true);
      window.clearTimeout(liveTimerRef.current);
      liveTimerRef.current = window.setTimeout(() => setLive(false), LIVE_MS);
    }

    for (const action of queueRef.current.drain()) onActionRef.current(action);
  }, []);

  const schedule = useCallback(() => {
    if (frameRef.current !== 0) return;
    frameRef.current = requestAnimationFrame(flush);
  }, [flush]);

  useEffect(() => {
    const onBytes = (data: Uint8Array) => {
      const parsed = parseMidiMessage(data);
      if (!parsed) return;

      heardRef.current = `${parsed.kind} ch${parsed.channel + 1} n${parsed.data1}=${parsed.data2}`;

      const action = mapDdj400(parsed, ctxRef.current);
      const now = action ? queueRef.current.push(action) : null;
      if (now) onActionRef.current(now);

      schedule();
    };

    const unsubBytes = subscribeMidiBytes(onBytes);
    const unsubStatus = subscribeMidiStatus((next) => {
      setStatus(next.status);
      setDeviceName(next.deviceName);
      setPorts(next.ports);
      setError(next.error);
    });
    window.__mamuteMidiInject = injectMidiBytes;
    void startMidiSession();

    return () => {
      unsubBytes();
      unsubStatus();
      window.clearTimeout(liveTimerRef.current);
      if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [schedule]);

  const connect = useCallback(() => {
    void restartMidiSession();
  }, []);

  return { status, deviceName, ports, lastHeard, error, live, connect };
}
