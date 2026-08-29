type YoutubeEmbedOptions = {
  loop?: boolean;
  autoplay?: boolean;
  enableJsApi?: boolean;
};

/** URL de embed com origin — evita "Vídeo indisponível" / erro 153 em browsers recentes. */
export function buildYoutubeEmbedSrc(videoId: string, options: YoutubeEmbedOptions = {}): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  if (options.enableJsApi) {
    params.set("enablejsapi", "1");
  }

  if (typeof window !== "undefined" && window.location.origin !== "null") {
    params.set("origin", window.location.origin);
  }

  if (options.autoplay) {
    params.set("autoplay", "1");
  }

  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
