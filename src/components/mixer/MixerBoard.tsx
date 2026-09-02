import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { TRAINING_TRACKS } from "../../data/training-tracks";
import { engine } from "../../lib/audio-engine";
import {
  armDeckFileInput,
  clickDeckFileInput,
  disarmDeckFileInput,
} from "../../lib/deck-file-picker";
import { assertAllowedInReducer } from "../../lib/mixer-assert";
import { createBrowseState, masterTrackIndex } from "../../lib/mixer-browse";
import { applyAbsoluteAction, createMixerDispatch } from "../../lib/mixer-dispatch";
import { cloneMixerSnapshot } from "../../lib/mixer-snapshot";
import { useMidiController } from "../../lib/midi/use-midi-controller";
import type { DeckId, MixerAction, MixerSnapshot } from "../../types/mixer";
import { BrowseChip } from "./BrowseChip";
import { CdjDeck } from "./CdjDeck";
import { DeckFileInput } from "./DeckFileInput";
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
  assertAllowedInReducer(action);
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
  const [pendingLoad, setPendingLoad] = useState<DeckId | null>(null);

  const cursorRef = useRef(cursor);
  const inputRefA = useRef<HTMLInputElement>(null);
  const inputRefB = useRef<HTMLInputElement>(null);

  const lookupDeckInput = useCallback((deckId: DeckId) => {
    return deckId === "a" ? inputRefA.current : inputRefB.current;
  }, []);

  const openDeckPicker = useCallback(
    (deckId: DeckId) => {
      disarmDeckFileInput();
      setPendingLoad(null);
      clickDeckFileInput(deckId, lookupDeckInput);
    },
    [lookupDeckInput],
  );

  const armDeckPicker = useCallback(
    (deckId: DeckId) => {
      armDeckFileInput(deckId, lookupDeckInput, {
        onArm: () => setPendingLoad(deckId),
        onDisarm: () => setPendingLoad(null),
      });
    },
    [lookupDeckInput],
  );

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
    () =>
      createMixerDispatch({
        eng: engine,
        browse,
        dispatchReducer: dispatch,
        onUiOp: (op) => {
          if (op.kind === "openFilePicker") openDeckPicker(op.deckId);
          if (op.kind === "armFilePicker") armDeckPicker(op.deckId);
          if (op.kind === "showLoadError") window.alert(op.message);
        },
      }),
    [armDeckPicker, browse, openDeckPicker],
  );

  const midi = useMidiController(dispatchAction);
  const masterKey = snap[snap.masterDeck].track.key;
  const browseTrack = TRAINING_TRACKS[cursor];
  const { markPainted } = midi;

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

  useEffect(() => () => disarmDeckFileInput(), []);

  return (
    <div className="mixer-cabinet" data-stage="6">
      <header className="mixer-cabinet-head">
        <p className="mixer-cabinet-note">
          Key Camelot, sync, loop e trim. Carregue MP3 ou WAV com LOAD — loops sintéticos até haver arquivo.
        </p>
        {pendingLoad ? (
          <p className="mixer-cabinet-note mixer-cabinet-note--load-pending" role="status">
            LOAD na DDJ-400: clique na tela para escolher o áudio do deck {pendingLoad.toUpperCase()}.
          </p>
        ) : null}
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

      <DeckFileInput
        ref={inputRefA}
        id="a"
        onFile={(file) => {
          setPendingLoad(null);
          dispatchAction({ type: "loadDeckFile", id: "a", file });
        }}
      />
      <DeckFileInput
        ref={inputRefB}
        id="b"
        onFile={(file) => {
          setPendingLoad(null);
          dispatchAction({ type: "loadDeckFile", id: "b", file });
        }}
      />

      <div className="mixer-board" data-stage="5">
        <CdjDeck
          id="a"
          masterKey={masterKey}
          loadPending={pendingLoad === "a"}
          onLoadClick={() => openDeckPicker("a")}
          onChange={dispatchAction}
        />
        <MixerConsole snap={snap} onChange={dispatchAction} />
        <CdjDeck
          id="b"
          masterKey={masterKey}
          loadPending={pendingLoad === "b"}
          onLoadClick={() => openDeckPicker("b")}
          onChange={dispatchAction}
        />
      </div>
    </div>
  );
}
