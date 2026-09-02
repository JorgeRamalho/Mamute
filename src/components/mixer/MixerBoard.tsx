import { useCallback, useEffect, useLayoutEffect, useReducer } from "react";
import { engine } from "../../lib/audio-engine";
import { useMidiController } from "../../lib/midi/use-midi-controller";
import type { DeckId, MixerAction } from "../../types/mixer";
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
    case "refresh":
      break;
  }
  return cloneSnapshot();
}

export function MixerBoard() {
  const [snap, dispatch] = useReducer(reducer, engine.snapshot, cloneSnapshot);

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
      default:
        dispatch(action);
    }
  }, []);

  const midi = useMidiController(dispatchAction);
  const masterKey = snap[snap.masterDeck].track.key;
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
