import { useEffect, useId, useRef, useState } from "react";
import { buildYoutubeEmbedSrc } from "../../lib/youtube-embed";

type RadioYoutubeFrameProps = {
  videoId: string;
  title: string;
  autoplay: boolean;
  className?: string;
  unavailableAfterMs?: number;
  onEnded: () => void;
  onUnavailable?: () => void;
  onReady?: () => void;
};

type YoutubeMessagePayload = {
  event?: string;
  info?: number | {
    playerState?: number;
    currentTime?: number;
    duration?: number;
  };
};

function parseYoutubeMessage(data: unknown): YoutubeMessagePayload | null {
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as YoutubeMessagePayload;
    } catch {
      return null;
    }
  }

  if (typeof data === "object" && data !== null) {
    return data as YoutubeMessagePayload;
  }

  return null;
}

function readInfo(payload: YoutubeMessagePayload): {
  playerState?: number;
  currentTime?: number;
  duration?: number;
} {
  if (typeof payload.info === "number") return {};
  return payload.info ?? {};
}

export function RadioYoutubeFrame({
  videoId,
  title,
  autoplay,
  className,
  unavailableAfterMs = 9_000,
  onEnded,
  onUnavailable,
  onReady,
}: RadioYoutubeFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameId = useId().replace(/:/g, "");
  const onEndedRef = useRef(onEnded);
  const onUnavailableRef = useRef(onUnavailable);
  const onReadyRef = useRef(onReady);
  const autoplayRef = useRef(autoplay);
  const endedRef = useRef(false);
  const unavailableRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const trackStartedAtRef = useRef(Date.now());
  const [embedSrc, setEmbedSrc] = useState(() =>
    buildYoutubeEmbedSrc(videoId, { autoplay, enableJsApi: true }),
  );

  onEndedRef.current = onEnded;
  onUnavailableRef.current = onUnavailable;
  onReadyRef.current = onReady;
  autoplayRef.current = autoplay;

  const markUnavailable = () => {
    if (unavailableRef.current || endedRef.current) return;
    unavailableRef.current = true;
    onUnavailableRef.current?.();
  };

  useEffect(() => {
    endedRef.current = false;
    unavailableRef.current = false;
    wasPlayingRef.current = false;
    trackStartedAtRef.current = Date.now();
    setEmbedSrc(buildYoutubeEmbedSrc(videoId, { autoplay: autoplayRef.current, enableJsApi: true }));

    const timer = window.setTimeout(() => {
      if (!wasPlayingRef.current) {
        markUnavailable();
      }
    }, unavailableAfterMs);

    return () => window.clearTimeout(timer);
  }, [unavailableAfterMs, videoId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || event.source !== iframe.contentWindow) return;

      const payload = parseYoutubeMessage(event.data);
      if (!payload) return;

      if (payload.event === "onError") {
        markUnavailable();
        return;
      }

      if (payload.event !== "infoDelivery") return;

      const { playerState, currentTime = 0, duration = 0 } = readInfo(payload);

      if (playerState === 1 && currentTime > 1) {
        wasPlayingRef.current = true;
      }

      const playedLongEnough = Date.now() - trackStartedAtRef.current >= 12_000;
      const reachedNaturalEnd =
        duration > 0 ? currentTime >= Math.max(15, duration - 4) : currentTime >= 30;

      if (
        playerState === 0 &&
        wasPlayingRef.current &&
        playedLongEnough &&
        reachedNaturalEnd &&
        !endedRef.current
      ) {
        endedRef.current = true;
        onEndedRef.current();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const armListener = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: frameId }),
        "https://www.youtube.com",
      );
      onReadyRef.current?.();
    };

    iframe.addEventListener("load", armListener);
    return () => iframe.removeEventListener("load", armListener);
  }, [videoId, frameId]);

  return (
    <iframe
      ref={iframeRef}
      id={frameId}
      title={title}
      className={className ? `radio-dj-youtube-frame ${className}` : "radio-dj-youtube-frame"}
      src={embedSrc}
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
