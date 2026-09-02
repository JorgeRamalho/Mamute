import type { MidiLinkStatus } from "../../lib/midi/midi-session";

const STATUS_LABEL: Record<MidiLinkStatus, string> = {
  unavailable: "MIDI indisponível neste browser",
  denied: "permissão MIDI negada",
  disconnected: "sem DDJ-400",
  connected: "DDJ-400 conectada",
};

/**
 * Chip de sessão MIDI na cabine, com o último CC ouvido e botão para religar.
 *
 * @param status Estado da sessão Web MIDI.
 * @param deviceName Nome da porta quando a DDJ-400 está ligada.
 * @param ports Nomes que o Chrome listou, úteis quando o filtro falha.
 * @param lastHeard Última mensagem parseada, mesmo que o mapper a ignore.
 * @param error Texto de diagnóstico, por exemplo Rekordbox com a porta presa.
 * @param live True por alguns milissegundos depois de qualquer MIDI, para o
 * ponto do chip piscar enquanto o knob da tela gira.
 * @param onConnect Reabre `requestMIDIAccess`.
 */
export function MidiStatus({
  status,
  deviceName,
  ports,
  lastHeard,
  error,
  live,
  onConnect,
}: {
  status: MidiLinkStatus;
  deviceName: string | null;
  ports: string[];
  lastHeard: string | null;
  error: string | null;
  live: boolean;
  onConnect: () => void;
}) {
  const label = status === "connected" && deviceName ? deviceName : STATUS_LABEL[status];
  const detail = lastHeard ?? error ?? (ports.length > 0 && status !== "connected" ? ports.join(" · ") : null);

  return (
    <div
      className="mixer-midi-status"
      data-state={status}
      data-live={live ? "true" : "false"}
      role="status"
      aria-label={`Controladora MIDI: ${label}`}
    >
      <span className="mixer-midi-dot" aria-hidden="true" />
      <span className="mixer-midi-copy">
        <span className="mixer-midi-label">{label}</span>
        {detail ? <span className="mixer-midi-detail">{detail}</span> : null}
      </span>
      {status !== "unavailable" ? (
        <button
          type="button"
          className="mixer-midi-connect"
          aria-label="Conectar controladora DDJ-400"
          onClick={onConnect}
        >
          {status === "connected" ? "Religar" : "Conectar controladora"}
        </button>
      ) : null}
    </div>
  );
}
