import type { CompareRow, Plan, PlanFaq, PlanId } from "../types/plan";

export const PLANS: Plan[] = [
  {
    id: "bronze",
    name: "Bronze",
    badge: "Primeiro beat",
    tagline: "Cabine de casa para quem está aprendendo a contar o grid.",
    audience: "Iniciante · treino no browser",
    monthly: 29,
    yearly: 290,
    featured: false,
    cta: "Assinar Bronze",
    includes: [
      "Mixer dual deck com play, jog, pitch, EQ de 3 bandas e crossfader",
      "Academia: módulo Fundação (aulas, dicas e checklist do visor)",
      "Rádio Mamute FM em modo linear, com BPM e tom no visor",
      "Fichas públicas de Beatport, Deezer, SoundCloud, YouTube e Spotify",
      "1 perfil de DJ gravado no visor (localStorage)",
      "Progresso das aulas no próprio dispositivo",
    ],
    perks: [
      "Entra na cabine no mesmo dia, sem hardware",
      "Ideal para o primeiro beatmatch de fone",
      "Cancela no fim do ciclo, sem multa pedagógica",
    ],
  },
  {
    id: "prata",
    name: "Prata",
    badge: "Alto Nível",
    tagline: "Do warm-up à conclusão da academia, com rádio em clipe e fila.",
    audience: "Intermediário · prática diária",
    monthly: 59,
    yearly: 590,
    featured: true,
    cta: "Assinar Prata",
    includes: [
      "Tudo do Bronze, com waveform, cue e hot cues sintéticos",
      "Academia completa: iniciante → intermediário → avançado → conclusão",
      "Exercícios cronometrados (metrônomo vivo, duplo kick, curva de energia)",
      "Rádio em modo clipe, fila e metadados no visor widescreen",
      "Até 3 perfis de cabine no mesmo dispositivo",
      "Dicas semanais no feed e newsletter de booth",
    ],
    perks: [
      "O combo que cobre treino, aula e rádio sem pular etapa",
      "Dois meses de desconto no ciclo anual (10× o mensal)",
      "Hábitos de metadados antes de pisar num CDJ de clube",
    ],
  },
  {
    id: "ouro",
    name: "Ouro",
    badge: "Booth avançada",
    tagline: "Cabine completa para quem já fecha a noite e quer mentoria no visor.",
    audience: "Avançado · residência pedagógica",
    monthly: 99,
    yearly: 990,
    featured: false,
    cta: "Assinar Ouro",
    includes: [
      "Tudo da Prata, com presets de curva equal-power e sessão de overlap",
      "Mentoria marcada no cadastro (flag de acompanhamento)",
      "Exportação dos campos de press kit e relatório de prática no visor",
      "Fila prioritária de exercícios e dicas de peak time",
      "Até 5 perfis / booths e 3 visores ativos",
      "Canal DJ com resposta em 12 horas úteis",
    ],
    perks: [
      "Para quem já conta 32 beats e quer fechar o checklist da booth",
      "Press kit e residências entram no mesmo cadastro de oito seções",
      "Prioridade no roteiro de features da cabine Mamute",
    ],
  },
];

export const PLAN_COMPARE: CompareRow[] = [
  { group: "Mixer", feature: "Waveform + hot cues", values: { bronze: false, prata: true, ouro: true } },
  { group: "Mixer", feature: "Curva XF avançada", values: { bronze: false, prata: false, ouro: true } },
  { group: "Academia", feature: "Trilha + exercícios", values: { bronze: false, prata: true, ouro: true } },
  { group: "Academia", feature: "Mentoria booth", values: { bronze: false, prata: false, ouro: true } },
  { group: "Rádio", feature: "Clipe + fila", values: { bronze: false, prata: true, ouro: true } },
  { group: "Conta", feature: "Perfis · visores", values: { bronze: "1 · 1", prata: "3 · 2", ouro: "5 · 3" } },
  { group: "Conta", feature: "Export press kit", values: { bronze: false, prata: false, ouro: true } },
  { group: "Suporte", feature: "Resposta SLA", values: { bronze: "72 h", prata: "48 h", ouro: "12 h" } },
];

export const PLAN_FAQS: PlanFaq[] = [
  {
    question: "O áudio do mixer é de Spotify, Beatport ou Deezer?",
    answer:
      "Não. O simulador CDJ usa loops sintéticos no Web Audio API. Spotify proíbe mix e crossfade; Beatport LINK é parceria gated. Os combos cobrem treino, academia e rádio — não um LINK pirata.",
  },
  {
    question: "Posso mudar de Bronze para Prata ou Ouro depois?",
    answer:
      "Sim. O upgrade vale no próximo ciclo. O progresso da academia e o perfil do visor continuam no mesmo dispositivo; o combo novo só destrava módulos, rádio em clipe e limites de booth.",
  },
  {
    question: "O ciclo anual trava o cancelamento?",
    answer:
      "O anual antecipa 10 meses e congela o preço. Você pode deixar de renovar no fim do período. O mensal cancela no encerramento do mês vigente, sem multa pedagógica.",
  },
  {
    question: "Preciso de CDJ física para assinar?",
    answer:
      "Não. A cabine Mamute DJPLAYER roda no browser. Hardware real (CDJ, controladora, mixer, toca-discos) entra só no cadastro, para o visor saber com o que você treina na vida real.",
  },
  {
    question: "Onde o pagamento é confirmado?",
    answer:
      "Esta página escolhe o combo e leva ao cadastro de cabine. A cobrança entra no checkout da conta Mamute DJPLAYER depois do perfil gravado — o visor não processa cartão nesta tela.",
  },
];

export const PLAN_NOTES = [
  "Preços em reais, sem taxas de plataforma de streaming de terceiros.",
  "Dois meses inclusos no anual (10× o valor mensal).",
  "Mamute DJPLAYER não substitui licenças oficiais de Beatport, Spotify, Deezer, SoundCloud ou YouTube.",
];

export const PLAN_NAMES: Record<PlanId, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
};

export function isPlanId(value: string | null): value is PlanId {
  return value === "bronze" || value === "prata" || value === "ouro";
}
