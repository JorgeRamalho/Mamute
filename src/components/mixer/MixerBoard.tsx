import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { TRAINING_TRACKS } from "../../data/training-tracks";
import { engine } from "../../lib/audio-engine";
import { createBrowseState, masterTrackIndex } from "../../lib/mixer-browse";
import { applyAbsoluteAction, createMixerDispatch } from "../../lib/mixer-dispatch";
import { cloneMixerSnapshot } from "../../lib/mixer-snapshot";
import { useMidiController } from "../../lib/midi/use-midi-controller";
import type { MixerAction, MixerSnapshot } from "../../types/mixer";
import { BrowseChip } from "./BrowseChip";
import { CdjDeck } from "./CdjDeck";
import { MidiStatus } from "./MidiStatus";
import { MixerConsole } from "./MixerConsole";

/**
 * Aplica a ação no engine e devolve um clone do snapshot para o React.
 *
 * O reducer **não** é puro, porque o engine muta o grafo de áudio. O
 * StrictMode invoca reducers duas vezes, e por isso intenções nunca entram
 * aqui: elas nascem no `createMixerDispatch` e só chegam como absolutas ou
 * como `refresh`.
 *
 * @param _state Snapshot anterior, ignorado porque a fonte da verdade é o engine.
 * @param action Ação absoluta ou `refresh`.
 */
function reducer(_state: MixerSnapshot, action: MixerAction): MixerSnapshot {
  applyAbsoluteAction(engine, action);
  return cloneMixerSnapshot(engine.snapshot);
}

export function MixerBoard() {
  const [snap, dispatch] = useReducer(reducer, engine.snapshot, () =>
    cloneMixerSnapshot(engine.snapshot),
  );

  const [cursor, setCursor] = useState(() =>
    masterTrackIndex(
      engine.snapshot,
      TRAINING_TRACKS.map((track) => track.id),
    ),
  );

  // O `dispatchAction` precisa ler o cursor para resolver o LOAD, mas ele é um
  // callback estável, e fechar sobre o state o congelaria no valor da primeira
  // render. Por isso o valor corrente vive num ref e o state só serve à
  // pintura do chip.
  const cursorRef = useRef(cursor);

  const browse = useMemo(
    () =>
      createBrowseState({
        tracks: TRAINING_TRACKS,
        getCursor: () => cursorRef.current,
        setCursor: (index) => {
          cursorRef.current = index;
          setCursor(index);
        },
        snapshot: () => engine.snapshot,
      }),
    [],
  );

  /**
   * Caminho único de ação da cabine, para o mouse e a DDJ-400 emitirem o
   * mesmo union em vez de fluxos separados.
   */
  const dispatchAction = useMemo(
    () => createMixerDispatch({ eng: engine, browse, dispatchReducer: dispatch }),
    [browse],
  );

  const midi = useMidiController(dispatchAction);
  const masterKey = snap[snap.masterDeck].track.key;
  // O `wrapCursor` garante o índice na lista, mas o acesso indexado é opcional
  // no tsconfig, e por isso o chip sai do ar em vez de fingir uma track.
  const browseTrack = TRAINING_TRACKS[cursor];
  const { markPainted } = midi;

  // Fecha a medição de latência com o snapshot novo já no layout, e não depois
  // da pintura assíncrona, porque `useEffect` mediria também o tempo ocioso até
  // o próximo commit. O hook ignora a chamada quando nada de MIDI está em voo,
  // e por isso o refresh periódico e os cliques de mouse não entram na conta.
  useLayoutEffect(() => {
    markPainted();
  }, [snap, markPainted]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (engine.snapshot.a.playing || engine.snapshot.b.playing) {
        dispatch({ type: "refresh" });
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mixer-cabinet" data-stage="6">
      <header className="mixer-cabinet-head">
        <p className="mixer-cabinet-note">
          Key Camelot, sync, loop e trim. Loops sintéticos — sem streaming licenciado.
        </p>
        {browseTrack ? (
          <BrowseChip
            track={browseTrack}
            position={cursor + 1}
            total={TRAINING_TRACKS.length}
          />
        ) : null}
        <MidiStatus
          status={midi.status}
          deviceName={midi.deviceName}
          ports={midi.ports}
          lastHeard={midi.lastHeard}
          error={midi.error}
          live={midi.live}
          latency={midi.latency}
          onConnect={midi.connect}
        />
      </header>

      <div className="mixer-board" data-stage="5">
        <CdjDeck id="a" masterKey={masterKey} onChange={dispatchAction} />
        <MixerConsole snap={snap} onChange={dispatchAction} />
        <CdjDeck id="b" masterKey={masterKey} onChange={dispatchAction} />
      </div>
    </div>
  );
}
