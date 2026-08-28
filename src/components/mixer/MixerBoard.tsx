import { useEffect, useReducer } from "react";
import { engine } from "../../lib/audio-engine";
import { CdjDeck, type MixerAction } from "./CdjDeck";
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
    case "setHotCue":
      engine.setHotCue(action.id, action.slot);
      break;
    case "triggerHotCue":
      engine.triggerHotCue(action.id, action.slot);
      break;
    case "toggleLoop":
      engine.toggleLoop(action.id);
      break;
    case "nudge":
      engine.nudge(action.id, action.direction);
      break;
    case "refresh":
      break;
  }
  return cloneSnapshot();
}

export function MixerBoard() {
  const [snap, dispatch] = useReducer(reducer, engine.snapshot, cloneSnapshot);
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
        <div>
          <p className="kicker">Mamute DJPLAYER · cabine profissional</p>
          <h2 className="mixer-cabinet-title">Dual CDJ + mixer integrado</h2>
        </div>
        <p className="mixer-cabinet-note">
          Key Camelot, sync, hot cues, loop e trim pedagógicos. Loops sintéticos — sem roteamento de
          streaming licenciado.
        </p>
      </header>

      <div className="mixer-board" data-stage="5">
        <CdjDeck id="a" masterKey={masterKey} onChange={dispatch} />
        <MixerConsole snap={snap} onChange={dispatch} />
        <CdjDeck id="b" masterKey={masterKey} onChange={dispatch} />
      </div>
    </div>
  );
}
