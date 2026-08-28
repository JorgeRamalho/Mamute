import type { PlatformIntel } from "../types";

export const PLATFORMS: PlatformIntel[] = [
  {
    id: "beatport",
    name: "Beatport",
    role: "Catálogo DJ / streaming profissional",
    accent: "#01ff95",
    summary:
      "Loja e streaming de dance music com filtros de BPM, tom e gênero — o padrão da cabine eletrônica.",
    capabilities: [
      "Catálogo de tracks, releases, artists, labels, charts e playlists",
      "Filtros DJ: BPM, key, data de lançamento e gênero",
      "Downloads lossless WAV, AIFF, FLAC e AAC",
      "Beatport Streaming em rekordbox, Serato, Traktor, Engine DJ, djay e VirtualDJ",
      "API v4 REST em api.beatport.com com OAuth 2.0 (parceiros)",
    ],
    limits: [
      "API pública é gated — acesso via Partner Portal, sem client-credentials aberto",
      "Não há SDK oficial nem OpenAPI público para download",
      "Streaming em software/hardware só para integrações aprovadas",
    ],
    playerDjUse:
      "No Mamute DJPLAYER o Beatport alimenta o visor de charts, BPM/key e a fila profissional. Mixagem real no simulador usa loops sintéticos até haver parceria LINK.",
    docsUrl: "https://api.beatport.com/v4/docs/",
    partnerUrl: "https://stream.beatport.com/",
  },
  {
    id: "spotify",
    name: "Spotify",
    role: "Descoberta + metadados",
    accent: "#1db954",
    summary:
      "Web API e Web Playback SDK para busca, playlists e player Connect — não para mixagem DJ.",
    capabilities: [
      "Web API: busca, playlists, biblioteca e estado de playback",
      "Audio Features: tempo (BPM), key, energy, danceability",
      "Web Playback SDK: dispositivo Connect no browser (Premium)",
      "OAuth PKCE com scopes streaming, user-read-playback-state e user-modify-playback-state",
    ],
    limits: [
      "Termos proíbem apps que mixam, fazem crossfade ou sobrepõem faixas",
      "Playback no SDK exige Spotify Premium (exceto alguns planos mobile)",
      "Mamute DJPLAYER usa Spotify só para metadados, rádio linear e descoberta — nunca para beatmatch",
    ],
    playerDjUse:
      "O catálogo Spotify no Mamute DJPLAYER mostra BPM/energia no visor e alimenta a rádio em modo linear. O mixer CDJ não roteia áudio do Spotify.",
    docsUrl: "https://developer.spotify.com/documentation/web-api",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    role: "Cenas underground + widget",
    accent: "#ff5500",
    summary:
      "Uploads de produtores, bootlegs e rádios. Widget HTML5 e API de tracks para embed controlado.",
    capabilities: [
      "Widget API (SC.Widget) com play, pause, seek, volume e eventos READY/PLAY/FINISH",
      "oEmbed para qualquer URL pública de track ou playlist",
      "API de tracks com stream_url transcodificado (AAC) e atribuição obrigatória",
      "Ideal para promoções, DJ mixes e cenas locais",
    ],
    limits: [
      "Getters do widget são assíncronos (postMessage)",
      "Múltiplos widgets exigem reconsultar SC.Widget(iframe) a cada comando",
      "Tracks privadas precisam de sessão e secret_token",
    ],
    playerDjUse:
      "A rádio Mamute FM pode encaixar o widget SoundCloud como deck de clipe. O mixer pedagógico continua no motor Web Audio interno.",
    docsUrl: "https://developers.soundcloud.com/docs/api/html5-widget.html",
  },
  {
    id: "deezer",
    name: "Deezer",
    role: "Catálogo + rádio editorial",
    accent: "#a238ff",
    summary:
      "API de busca e rádios editoriais, JavaScript SDK para player. Preview de 30s fora do Premium.",
    capabilities: [
      "GET https://api.deezer.com/search?q= com ordenação",
      "GET https://api.deezer.com/radio para mixes editoriais",
      "JS SDK: DZ.init, DZ.login, DZ.player.playTracks / playPlaylist",
      "Capas de álbum em tamanhos small, medium e big",
    ],
    limits: [
      "API devolve só extracts de 30s; faixa completa exige SDK + Premium",
      "URLs de áudio full-length nunca podem ser expostas ao usuário",
      "Chamadas JS cross-origin devem passar pelo SDK, não por fetch direto",
    ],
    playerDjUse:
      "Deezer entra no Mamute DJPLAYER como busca editorial e rádio de gênero. O simulador de CDJ não faz DJ mix com o stream Deezer.",
    docsUrl: "https://developers.deezer.com/guidelines",
  },
  {
    id: "youtube",
    name: "YouTube",
    role: "Clipes + aulas em vídeo",
    accent: "#ff0033",
    summary:
      "IFrame Player API para clipes da rádio e Data API v3 para metadados das aulas da academia.",
    capabilities: [
      "IFrame Player API: play, pause, seek, volume, playlists e eventos de estado",
      "enablejsapi=1 permite controle via postMessage / YT.Player",
      "Data API v3: busca, playlists e detalhes (quota 10.000/dia)",
      "Playback de clipes oficiais sem baixar áudio — o caminho legal para vídeo",
    ],
    limits: [
      "A chave da Data API deve ficar no backend, nunca no cliente",
      "Autoplay e iframe cross-origin pedem allow=encrypted-media;autoplay",
      "Esconder o player (height 0) viola diretrizes se for só para áudio pirata",
    ],
    playerDjUse:
      "A rádio Mamute FM toca clipes no visor widescreen. A academia embute aulas oficiais. O mixer não extrai stems do YouTube.",
    docsUrl: "https://developers.google.com/youtube/iframe_api_reference",
  },
];
