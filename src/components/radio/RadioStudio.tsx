import { useCallback, useEffect, useRef, useState } from "react";
import { PLATFORMS } from "../../data/platforms";
import { buildRadioCatalog } from "../../data/radio";
import { enrichCatalogWithPreviews } from "../../lib/radio-catalog-enrich";
import { syncBeginnerDjToStorage } from "../../lib/radio-catalog-import";
import { getNextPlayableClip } from "../../lib/radio-playlist";
import { radioEngine } from "../../lib/radio-engine";
import {
  loadUserPlaylistIds,
  markBeginnerPlaylistLoaded,
  togglePlaylistClip,
  wasBeginnerPlaylistLoaded,
} from "../../lib/radio-user-playlist";
import type { RadioClip, RadioEqLevels, RadioSource, RadioUpload } from "../../types/radio";
import { RadioDjPlayer } from "./RadioDjPlayer";
import { RadioLoopDeck } from "./RadioLoopDeck";

const platformById = new Map(PLATFORMS.map((platform) => [platform.id, platform]));

const DEFAULT_EQ: RadioEqLevels = {
  sub: 0.52,
  low: 0.5,
  mid: 0.48,
  high: 0.54,
  air: 0.5,
};

function syncClipInCatalog(catalog: RadioClip[], clipId: string): RadioClip | undefined {
  return catalog.find((clip) => clip.id === clipId);
}

export function RadioStudio() {
  const [catalog, setCatalog] = useState<RadioClip[]>(() => buildRadioCatalog());
  const [catalogReady, setCatalogReady] = useState(true);
  const [playlistIds, setPlaylistIds] = useState<string[]>(() => loadUserPlaylistIds());
  const [playlistOnly, setPlaylistOnly] = useState(false);
  const [source, setSource] = useState<RadioSource>(() => ({
    kind: "clip",
    clip: buildRadioCatalog()[0]!,
    continuous: true,
    autoplay: false,
  }));
  const lastAdvanceAtRef = useRef(0);

  const applyCatalog = useCallback((next: RadioClip[]) => {
    setCatalog(next);
    setSource((current) => {
      if (current.kind !== "clip") return current;
      const updated = syncClipInCatalog(next, current.clip.id);
      return updated ? { ...current, clip: updated } : current;
    });
  }, []);

  const refreshCatalog = useCallback(() => {
    void enrichCatalogWithPreviews(buildRadioCatalog()).then((enriched) => {
      applyCatalog(enriched);
      setCatalogReady(true);
    });
  }, [applyCatalog]);

  const bootstrapCatalog = useCallback(async () => {
    if (!wasBeginnerPlaylistLoaded()) {
      await syncBeginnerDjToStorage();
      markBeginnerPlaylistLoaded();
    }
    const enriched = await enrichCatalogWithPreviews(buildRadioCatalog());
    applyCatalog(enriched);
    setCatalogReady(true);
    setSource((current) =>
      current.kind === "clip" && !current.autoplay
        ? { ...current, autoplay: true, continuous: true }
        : current,
    );
  }, [applyCatalog]);

  useEffect(() => {
    let cancelled = false;
    void bootstrapCatalog().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [bootstrapCatalog]);

  const playbackScope = playlistOnly ? playlistIds : undefined;
  const visibleClips = playlistOnly ? catalog.filter((clip) => playlistIds.includes(clip.id)) : catalog;

  const accent =
    source.kind === "clip"
      ? (platformById.get(source.clip.platform)?.accent ?? "#00e8ff")
      : "#00e8ff";

  const selectClip = (clip: RadioClip, options?: { autoplay?: boolean }) => {
    radioEngine.stop();
    setSource((current) => ({
      kind: "clip",
      clip,
      continuous: current.kind === "clip" ? current.continuous : true,
      autoplay: options?.autoplay ?? false,
    }));
  };

  const selectUpload = (upload: RadioUpload) => {
    setSource({ kind: "upload", upload });
  };

  const toggleContinuous = () => {
    if (source.kind !== "clip") return;
    setSource({ ...source, continuous: !source.continuous });
  };

  const advanceToNextClip = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceAtRef.current < 1_500) return;
    lastAdvanceAtRef.current = now;

    setSource((current) => {
      if (current.kind !== "clip" || !current.continuous) return current;
      const next = getNextPlayableClip(catalog, current.clip.id, playbackScope);
      if (!next || next.id === current.clip.id) return current;
      return { kind: "clip", clip: next, continuous: true, autoplay: true };
    });
  }, [catalog, playbackScope]);

  const handleTrackEnded = useCallback(() => {
    advanceToNextClip();
  }, [advanceToNextClip]);

  const consumeAutoplay = useCallback(() => {
    setSource((current) =>
      current.kind === "clip" && current.autoplay ? { ...current, autoplay: false } : current,
    );
  }, []);

  const handleTogglePlaylistClip = useCallback((clipId: string) => {
    setPlaylistIds(togglePlaylistClip(clipId));
  }, []);

  useEffect(() => {
    radioEngine.setEqAll(DEFAULT_EQ);
  }, []);

  return (
    <div className="radio-studio">
      <RadioDjPlayer
        clips={visibleClips}
        catalogReady={catalogReady}
        accent={accent}
        playlistIds={playlistIds}
        playlistOnly={playlistOnly}
        onPlaylistOnlyChange={setPlaylistOnly}
        onCatalogUpdated={refreshCatalog}
        source={source}
        onTogglePlaylistClip={handleTogglePlaylistClip}
        onSelectClip={selectClip}
        onToggleContinuous={toggleContinuous}
        onTrackEnded={handleTrackEnded}
        onAutoplayConsumed={consumeAutoplay}
      />
      <RadioLoopDeck
        activeUploadId={source.kind === "upload" ? source.upload.id : null}
        onSelectUpload={selectUpload}
      />
    </div>
  );
}
