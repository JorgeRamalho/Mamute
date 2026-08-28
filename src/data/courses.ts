import type { CourseModule } from "../types";

export const COURSE_MODULES: CourseModule[] = [
  {
    id: "mod-01",
    level: "iniciante",
    title: "Fundação da cabine",
    subtitle: "Ouvir, contar e respeitar o grid",
    lessons: [
      {
        id: "l-01",
        title: "Anatomia da CDJ e da controladora",
        duration: "12 min",
        synopsis:
          "Jog, pitch, cue, hot cues, pads, faders e o que cada um faz no Mamute DJPLAYER e no hardware real.",
        youtubeId: "M7lc1UVf-VE",
        checklist: [
          "Identificar jog wheel, pitch fader e cue",
          "Diferença entre CDJ e controladora MIDI",
          "Por que o visor mostra BPM e tom",
        ],
      },
      {
        id: "l-02",
        title: "Tempo, compassos e contar 32 beats",
        duration: "18 min",
        synopsis: "House em 4/4, downbeat, phrasing e onde cortar sem matar o groove.",
        checklist: [
          "Contar 8, 16 e 32 beats em voz alta",
          "Marcar o primeiro beat de cada frase",
          "Ouvir o kick contra o metrônomo do mixer",
        ],
      },
      {
        id: "l-03",
        title: "Ganho, cue de fone e volume de booth",
        duration: "10 min",
        synopsis: "Trim, channel fader e por que o master vermelho é inimigo do set.",
        checklist: [
          "Ajustar trim até o LED amarelo",
          "Pré-escutar no cue sem vazar no master",
          "Manter headroom de 6 dB",
        ],
      },
    ],
  },
  {
    id: "mod-02",
    level: "intermediario",
    title: "Beatmatch e transições",
    subtitle: "Duas decks, um groove",
    lessons: [
      {
        id: "l-04",
        title: "Pitch fader e nudge no jog",
        duration: "22 min",
        synopsis: "Acoplar BPMs no ouvido, sem depender só do sync.",
        checklist: [
          "Alinhar BPM A e B no visor",
          "Usar jog para adiantar/atrasar o kick",
          "Segurar 16 compassos sem drift",
        ],
      },
      {
        id: "l-05",
        title: "EQ de 3 bandas e o corte de graves",
        duration: "16 min",
        synopsis: "Low kill no deck que entra, mid/high para costurar vocais e hats.",
        checklist: [
          "Nunca dois kicks no mesmo low",
          "Abrir high da track nova no último 8",
          "Voltar EQ a 12h depois da troca",
        ],
      },
      {
        id: "l-06",
        title: "Crossfader, curvas e phrasing",
        duration: "14 min",
        synopsis: "Curva suave vs. cut de scratch. Frases de 32 para trocar de tema.",
        checklist: [
          "Trocar no começo da frase, nunca no meio do vocal",
          "Escolher curva para house vs. techno",
          "Usar channel faders se o crossfader estiver em scratch",
        ],
      },
    ],
  },
  {
    id: "mod-03",
    level: "avancado",
    title: "Harmonia, energia e palco",
    subtitle: "Do loop ao peak time",
    lessons: [
      {
        id: "l-07",
        title: "Camelot / tom musical e mix harmônico",
        duration: "20 min",
        synopsis: "Vizinhanças de tom, energy boost e quando quebrar a regra de propósito.",
        checklist: [
          "Ler a key no visor Mamute",
          "Planejar 4 faixas em círculo de quintas",
          "Usar um contraste de tom no drop",
        ],
      },
      {
        id: "l-08",
        title: "Hot cues, loops e stems pedagógicos",
        duration: "18 min",
        synopsis: "Loops de 8 beats, skip de intro e isolação de kick para treino.",
        checklist: [
          "Mapear cue 1 no downbeat",
          "Loop de 8 no breakdown",
          "Treinar entrada no drop sem olhar",
        ],
      },
      {
        id: "l-09",
        title: "Leitura de pista e dinâmica de set",
        duration: "24 min",
        synopsis: "Abrir, construir, peak e fechar. Energia sem queimar o clube cedo.",
        checklist: [
          "Desenhar arco de 60 minutos",
          "Reservar 2 IDs para o peak",
          "Ter um plano B de 6 faixas mais lentas",
        ],
      },
    ],
  },
  {
    id: "mod-04",
    level: "conclusao",
    title: "Conclusão de cabine",
    subtitle: "Do simulador ao equipamento real",
    lessons: [
      {
        id: "l-10",
        title: "Checklist de booth e ética de set",
        duration: "12 min",
        synopsis: "USB, cabos, rec, direitos, créditos e o que não fazer com catálogos licenciados.",
        checklist: [
          "Exportar um set de 30 min no Mamute DJPLAYER",
          "Listar 3 faixas por plataforma (metadados)",
          "Assinar o manifesto de direitos do cadastro DJ",
        ],
      },
    ],
  },
];
