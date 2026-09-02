import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { TRAINING_TRACKS } from "../../data/training-tracks";
import { engine } from "../../lib/audio-engine";
import { useMidiController } from "../../lib/midi/use-midi-controller";
import type { DeckId, MixerAction } from "../../types/mixer";
import { BrowseChip } from "./BrowseChip";
import { CdjDeck } from "./CdjDeck";
import { MidiStatus } from "./MidiStatus";
import { MixerConsole } from "./MixerConsole";

function cloneSnapshot() {
  return {
    ...engine.snapshot,
    a: {
      ...engine.snapshot.a,
      eq: { ...engine.snapshot.a.eq },
      eqKill: { ...engine.snapshot.a.eqKill },
      loop: { ...engine.snapshot.a.loop },
      hotCues: engine.snapshot.a.hotCues.map((cue) => ({ ...cue })),
      track: { ...engine.snapshot.a.track },
    },
    b: {
      ...engine.snapshot.b,
      eq: { ...engine.snapshot.b.eq },
      eqKill: { ...engine.snapshot.b.eqKill },
      loop: { ...engine.snapshot.b.loop },
      hotCues: engine.snapshot.b.hotCues.map((cue) => ({ ...cue })),
      track: { ...engine.snapshot.b.track },
    },
  };
}

/**
 * Converte a fase corrente do deck no beat do compasso de oito, que é a unidade
 * que `setCueBeat` espera.
 *
 * @param id Deck a consultar.
 */
function phaseToBeat(id: DeckId) {
  return engine.snapshot[id].phase * 8;
}

/**
 * Prende o cursor da biblioteca dentro da lista dando a volta nas pontas.
 *
 * O módulo é aplicado duas vezes de propósito, porque `-1 % 5` devolve `-1` em
 * JavaScript, e não `4`, ou seja o operador preserva o sinal do dividendo. Sem
 * a segunda soma, girar o encoder para trás na primeira track levaria o cursor
 * a um índice negativo.
 *
 * @param index Índice cru, possivelmente fora da lista.
 */
function wrapCursor(index: number) {
  const total = TRAINING_TRACKS.length;
  return ((index % total) + total) % total;
}

/** Índice da track que o deck master toca, que é onde o cursor se realinha. */
function masterTrackIndex() {
  const id = engine.snapshot[engine.snapshot.masterDeck].track.id;
  const found = TRAINING_TRACKS.findIndex((track) => track.id === id);
  return found < 0 ? 0 : found;
}

function reducer(_state: typeof engine.snapshot, action: MixerAction) {
  switch (action.type) {
    case "pitch":
      engine.setPitch(action.id, action.value);
      break;
    case "gain":
      engine.setGain(action.id, action.value);
      break;
    case "trim":
      engine.setTrim(action.id, action.value);
      break;
    case "filter":
      engine.setFilter(action.id, action.value);
      break;
    case "eq":
      engine.setEq(action.id, action.band, action.value);
      break;
    case "eqKill":
      engine.setEqKill(action.id, action.band, action.value);
      break;
    case "xf":
      engine.setCrossfader(action.value);
      break;
    case "master":
      engine.setMaster(action.value);
      break;
    case "booth":
      engine.setBooth(action.value);
      break;
    case "cueMix":
      engine.setCueMix(action.value);
      break;
    case "sync":
      engine.setSync(action.id, action.value);
      break;
    case "masterDeck":
      engine.setMasterDeck(action.id);
      break;
    case "cueMonitor":
      engine.setCueMonitor(action.id, action.value);
      break;
    case "jogMode":
      engine.setJogMode(action.id, action.value);
      break;
    case "quantize":
      engine.setQuantize(action.id, action.value);
      break;
    case "loadTrack":
      engine.loadTrack(action.id, action.trackId);
      break;
    case "callCue":
      engine.callCue(action.id);
      break;
    case "setCue":
      engine.setCueBeat(action.id, phaseToBeat(action.id));
      break;
    case "hotCue":
      engine.setHotCue(action.id, action.slot);
      break;
    case "triggerHotCue":
      engine.triggerHotCue(action.id, action.slot);
      break;
    case "toggle":
    case "toggleSync":
    case "toggleCueMonitor":
    case "cueButton":
    case "toggleLoop":
    case "loopOn":
    case "loopOff":
    case "hotCuePad":
    case "nudge":
      // Resolvidas em `dispatchAction`, e não aqui, porque todas dependem do
      // estado anterior e este reducer roda duas vezes sob StrictMode. Chegar
      // neste ponto significa que alguém desviou do `dispatchAction`.
      break;
    case "browseMove":
    case "browseHome":
    case "browseLoad":
      // Também resolvidas em `dispatchAction`, mas por outro motivo: o cursor é
      // estado de tela e portanto não pertence ao snapshot do engine. As duas
      // primeiras nem chegam a virar ação de áudio, ao passo que `browseLoad`
      // volta como `loadTrack` já com o `trackId` do cursor.
      break;
    case "refresh":
      break;
  }
  return cloneSnapshot();
}

export function MixerBoard() {
  const [snap, dispatch] = useReducer(reducer, engine.snapshot, cloneSnapshot);

  // O cursor da biblioteca nasce na track do deck master, e assim o estado
  // inicial e o BACK seguem a mesma regra em vez de duas.
  const [cursor, setCursor] = useState(masterTrackIndex);

  // O `dispatchAction` precisa ler o cursor para resolver o LOAD, mas ele é um
  // callback estável, e fechar sobre o state o congelaria no valor da primeira
  // render. Por isso o valor corrente vive num ref e o state só serve à
  // pintura do chip.
  const cursorRef = useRef(cursor);

  const moveCursor = useCallback((next: number) => {
    cursorRef.current = wrapCursor(next);
    setCursor(cursorRef.current);
  }, []);

  /**
   * Caminho único de ação da cabine, para o mouse e a DDJ-400 emitirem o mesmo
   * union em vez de fluxos separados.
   *
   * Aqui também mora a fronteira de pureza. O reducer aplica cada ação no
   * `audio-engine`, e portanto ele **não** é puro, ao passo que o StrictMode
   * invoca reducers duas vezes justamente para expor impureza. A consequência é
   * que qualquer ação derivada do estado anterior seria aplicada em dobro, ou
   * seja, um toggle voltaria ao valor original e um `nudge` andaria o dobro do
   * gesto. Por isso essas ações são resolvidas neste ponto, viram absolutas ou
   * chamam o engine uma única vez, e o reducer só recebe o que é idempotente.
   */
  const dispatchAction = useCallback((action: MixerAction) => {
    switch (action.type) {
      case "toggle":
        // O play aguarda o resume do `AudioContext`, e por isso o `refresh` só
        // sai quando o engine assenta, senão o rótulo continuaria em Play com o
        // deck já tocando.
        void engine.toggle(action.id).then(() => dispatch({ type: "refresh" }));
        return;
      case "toggleSync":
        dispatch({ type: "sync", id: action.id, value: !engine.snapshot[action.id].sync });
        return;
      case "toggleCueMonitor":
        dispatch({
          type: "cueMonitor",
          id: action.id,
          value: !engine.snapshot[action.id].cueMonitor,
        });
        return;
      case "cueButton":
        // Critério do CDJ: com o deck tocando o CUE volta ao ponto, ao passo
        // que com o deck pausado ele grava o ponto na posição atual.
        dispatch(
          engine.snapshot[action.id].playing
            ? { type: "callCue", id: action.id }
            : { type: "setCue", id: action.id },
        );
        return;
      case "toggleLoop":
        engine.toggleLoop(action.id);
        dispatch({ type: "refresh" });
        return;
      case "loopOn":
      case "loopOff":
        // O engine só expõe `toggleLoop`, e por isso LOOP IN e LOOP OUT viram
        // pedidos de estado que só chamam o toggle quando ele muda alguma
        // coisa. Sem essa guarda, apertar IN e depois OUT ligaria e desligaria
        // o loop na sequência, deixando a cabine como estava.
        if (engine.snapshot[action.id].loop.active === (action.type === "loopOn")) return;
        engine.toggleLoop(action.id);
        dispatch({ type: "refresh" });
        return;
      case "hotCuePad": {
        // Critério do CDJ: pad com ponto gravado salta para ele, ao passo que
        // pad vazio grava a posição atual.
        const cue = engine.snapshot[action.id].hotCues.find((item) => item.slot === action.slot);
        dispatch({
          type: cue?.set ? "triggerHotCue" : "hotCue",
          id: action.id,
          slot: action.slot,
        });
        return;
      }
      case "nudge":
        engine.nudge(action.id, action.direction);
        dispatch({ type: "refresh" });
        return;
      case "browseMove":
        // Só move o destaque, e por isso **não** há `dispatch`: girar o encoder
        // sem carregar nada não pode tocar no snapshot nem no áudio.
        moveCursor(cursorRef.current + action.delta);
        return;
      case "browseHome":
        moveCursor(masterTrackIndex());
        return;
      case "browseLoad": {
        const track = TRAINING_TRACKS[cursorRef.current];
        if (track) dispatch({ type: "loadTrack", id: action.id, trackId: track.id });
        return;
      }
      default:
        dispatch(action);
    }
  }, [moveCursor]);

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
