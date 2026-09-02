import { useCallback, useEffect, useReducer } from "react";
import { engine } from "../../lib/audio-engine";
import { useMidiController } from "../../lib/midi/use-midi-controller";
import type { MixerAction } from "../../types/mixer";
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
      engine.setCueBeat(action.id, engine.snapshot[action.id].phase * 8);
      break;
    case "toggleLoop":
      engine.toggleLoop(action.id);
      break;
    case "nudge":
      engine.nudge(action.id, action.direction);
      break;
    case "toggle":
      // Não chama o engine aqui, e sim em `dispatchAction`, porque o play
      // espera o resume do AudioContext ao passo que o reducer precisa
      // devolver o clone neste mesmo tick.
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
   * O `toggle` é a única ação assíncrona, porque `engine.toggle` aguarda o
   * resume do `AudioContext`, e por isso ela não cabe no reducer, que devolve o
   * clone na hora. Aqui o `refresh` só sai depois que o engine assenta, senão o
   * rótulo continuaria em Play com o deck já tocando.
   */
  const dispatchAction = useCallback((action: MixerAction) => {
    if (action.type === "toggle") {
      void engine.toggle(action.id).then(() => dispatch({ type: "refresh" }));
      return;
    }
    dispatch(action);
  }, []);

  const midi = useMidiController(dispatchAction);
  const masterKey = snap[snap.masterDeck].track.key;

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
