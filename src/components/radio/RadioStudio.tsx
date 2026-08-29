import { useCallback, useEffect, useState } from "react";
import { PLATFORMS } from "../../data/platforms";
import { buildRadioCatalog } from "../../data/radio";
import { radioEngine } from "../../lib/radio-engine";
import type { RadioClip, RadioEqLevels, RadioSource, RadioUpload } from "../../types/radio";
import { RadioCatalogImport } from "./RadioCatalogImport";
import { RadioDjPlayer } from "./RadioDjPlayer";
import { RadioEqConsole } from "./RadioEqConsole";
import { RadioLoopDeck } from "./RadioLoopDeck";

const platformById = new Map(PLATFORMS.map((platform) => [platform.id, platform]));

const DEFAULT_EQ: RadioEqLevels = {
  sub: 0.52,
  low: 0.5,
  mid: 0.48,
  high: 0.54,
  air: 0.5,
};

export function RadioStudio() {
  const [catalog, setCatalog] = useState<RadioClip[]>(() => buildRadioCatalog());
  const [source, setSource] = useState<RadioSource>(() => ({
    kind: "clip",
    clip: buildRadioCatalog()[0]!,
    loop: false,
  }));

  const refreshCatalog = useCallback(() => {
    const next = buildRadioCatalog();
    setCatalog(next);
    setSource((current) => {
      if (current.kind !== "clip") return current;
      const stillThere = next.find((clip) => clip.id === current.clip.id);
      return stillThere ? current : { kind: "clip", clip: next[0]!, loop: false };
    });
  }, []);

  const accent =
    source.kind === "clip"
      ? (platformById.get(source.clip.platform)?.accent ?? "#00e8ff")
      : "#00e8ff";

  const selectClip = (clip: RadioClip) => {
    radioEngine.stop();
    setSource({ kind: "clip", clip, loop: source.kind === "clip" ? source.loop : false });
  };

  const selectUpload = (upload: RadioUpload) => {
    setSource({ kind: "upload", upload });
  };

  const toggleClipLoop = () => {
    if (source.kind !== "clip") return;
    setSource({ ...source, loop: !source.loop });
  };

  useEffect(() => {
    radioEngine.setEqAll(DEFAULT_EQ);
  }, []);

  const handleEqChange = (levels: RadioEqLevels) => {
    (Object.keys(levels) as (keyof RadioEqLevels)[]).forEach((band) => {
      radioEngine.setEq(band, levels[band]);
    });
  };

  return (
    <div className="radio-studio">
      <RadioCatalogImport onImported={refreshCatalog} />
      <RadioEqConsole accent={accent} onEqChange={handleEqChange} />
      <RadioDjPlayer
        clips={catalog}
        source={source}
        onSelectClip={selectClip}
        onToggleLoop={toggleClipLoop}
      />
      <RadioLoopDeck
        activeUploadId={source.kind === "upload" ? source.upload.id : null}
        onSelectUpload={selectUpload}
      />
    </div>
  );
}
