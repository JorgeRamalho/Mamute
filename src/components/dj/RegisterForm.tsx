import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { GENRE_OPTIONS, SOFTWARE_OPTIONS } from "../../data/academy";
import { isExperience, loadProfile, saveProfile } from "../../lib/storage";
import type { DjProfile, HardwareKind } from "../../types";

const HARDWARE: HardwareKind[] = ["cdj", "controladora", "mixer", "toca-discos"];

const HARDWARE_LABELS: Record<HardwareKind, string> = {
  cdj: "CDJ",
  controladora: "Controladora",
  mixer: "Mixer",
  "toca-discos": "Toca-discos",
};

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "@seuartista" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "soundcloud.com/…" },
  { key: "mixcloud", label: "Mixcloud", placeholder: "mixcloud.com/…" },
  { key: "beatport", label: "Beatport", placeholder: "beatport.com/artist/…" },
  { key: "spotify", label: "Spotify", placeholder: "open.spotify.com/…" },
  { key: "youtube", label: "YouTube", placeholder: "youtube.com/@…" },
  { key: "tiktok", label: "TikTok", placeholder: "@seuartista" },
  { key: "deezer", label: "Deezer", placeholder: "deezer.com/…" },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<
    DjProfile,
    "instagram" | "soundcloud" | "mixcloud" | "beatport" | "spotify" | "youtube" | "tiktok" | "deezer"
  >;
  label: string;
  placeholder: string;
}>;

const FORM_STEPS = [
  { step: 1, id: "dj-section-1", short: "Identidade" },
  { step: 2, id: "dj-section-2", short: "Contato" },
  { step: 3, id: "dj-section-3", short: "Perfil" },
  { step: 4, id: "dj-section-4", short: "Equip." },
  { step: 5, id: "dj-section-5", short: "Redes" },
  { step: 6, id: "dj-section-6", short: "Carreira" },
  { step: 7, id: "dj-section-7", short: "Academy" },
  { step: 8, id: "dj-section-8", short: "Termos" },
] as const;

function toggle<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function estimateProgress(profile: DjProfile): number {
  const checks = [
    profile.fullName.trim(),
    profile.artistName.trim(),
    profile.city.trim(),
    profile.country.trim(),
    profile.email.trim(),
    profile.bio.trim(),
    profile.genres.length > 0,
    profile.hardware.length > 0,
    SOCIAL_FIELDS.some(({ key }) => profile[key].trim()),
    profile.over18 && profile.terms,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function isStepDone(profile: DjProfile, step: number): boolean {
  switch (step) {
    case 1:
      return Boolean(
        profile.fullName.trim() && profile.artistName.trim() && profile.city.trim() && profile.country.trim(),
      );
    case 2:
      return Boolean(profile.email.trim());
    case 3:
      return Boolean(profile.bio.trim() && profile.genres.length > 0);
    case 4:
      return profile.hardware.length > 0;
    case 5:
      return SOCIAL_FIELDS.some(({ key }) => profile[key].trim());
    case 6:
      return Boolean(
        profile.agencies.trim() ||
          profile.labels.trim() ||
          profile.residencies.trim() ||
          profile.feeRange.trim() ||
          profile.pressKit.trim(),
      );
    case 7:
      return Boolean(profile.weeklyHours.trim() || profile.goals.trim() || profile.challenges.trim());
    case 8:
      return profile.over18 && profile.terms;
    default:
      return false;
  }
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionHead({ step, title, hint }: { step: number; title: string; hint: string }) {
  return (
    <header className="dj-register-section-head">
      <span className="dj-register-section-badge" aria-hidden>
        {String(step).padStart(2, "0")}
      </span>
      <div>
        <h2>
          {step}. {title}
        </h2>
        <p>{hint}</p>
      </div>
    </header>
  );
}

function FieldLabel({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className ? `field ${className}` : "field"}>
      {label}
      {hint ? <span className="field-hint">{hint}</span> : null}
      {children}
    </label>
  );
}

export function RegisterForm() {
  const [profile, setProfile] = useState<DjProfile>(() => loadProfile());
  const [saved, setSaved] = useState(false);

  const progress = useMemo(() => estimateProgress(profile), [profile]);

  const update = <K extends keyof DjProfile>(key: K, value: DjProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile.terms || !profile.over18) return;
    saveProfile(profile);
    const body = new URLSearchParams({
      "form-name": "mamute-cadastro",
      fullName: profile.fullName,
      artistName: profile.artistName,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      country: profile.country,
      bio: profile.bio,
      experienceLevel: profile.experienceLevel,
    });
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
    } catch {
      /* local save already persisted */
    }
    setSaved(true);
  };

  return (
    <div className="dj-register">
      <div className="dj-register-hero">
        <div className="dj-register-hero-top">
          <div className="dj-register-hero-copy">
            <h2>Seu cartão de visita na cabine Mamute</h2>
            <p>
              Preencha por etapas — os campos com destaque são obrigatórios. Você pode voltar a qualquer
              seção; o progresso atualiza conforme avança.
            </p>
          </div>
          <div className="dj-register-progress-ring" aria-live="polite">
            <span className="dj-register-progress-value">{progress}%</span>
            <span className="dj-register-progress-label">Perfil completo</span>
            <div className="dj-register-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <nav className="dj-register-steps" aria-label="Seções do cadastro">
          {FORM_STEPS.map(({ step, id, short }) => (
            <button
              key={id}
              type="button"
              className={`dj-register-step-pill${isStepDone(profile, step) ? " is-done" : ""}`}
              onClick={() => scrollToSection(id)}
            >
              {String(step).padStart(2, "0")} · {short}
            </button>
          ))}
        </nav>
      </div>

      <form className="form-grid dj-register-form" name="mamute-cadastro" onSubmit={onSubmit} noValidate={false}>
        <input type="hidden" name="form-name" value="mamute-cadastro" />

        <section className="form-section" id="dj-section-1">
          <SectionHead step={1} title="Identidade" hint="Quem você é fora e dentro da cabine." />
          <div className="fields">
            <FieldLabel label="Nome completo" hint="Como consta em documentos e contratos.">
              <input
                required
                placeholder="Maria Silva"
                value={profile.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel label="Nome artístico" hint="Nome que aparece no visor e no mural Mamute.">
              <input
                required
                placeholder="DJ Mamute"
                value={profile.artistName}
                onChange={(e) => update("artistName", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel label="Pronomes" hint="Opcional — ajuda na comunicação inclusiva.">
              <input
                placeholder="ela/dela, ele/dele…"
                value={profile.pronouns}
                onChange={(e) => update("pronouns", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel label="Nascimento" hint="Para verificação de maioridade.">
              <input
                type="date"
                value={profile.birthDate}
                onChange={(e) => update("birthDate", e.target.value)}
              />
            </FieldLabel>
            <label className="field">
              Nacionalidade
              <input
                placeholder="Brasileira"
                value={profile.nationality}
                onChange={(e) => update("nationality", e.target.value)}
              />
            </label>
            <label className="field">
              Cidade
              <input
                required
                placeholder="São Paulo"
                value={profile.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </label>
            <label className="field">
              País
              <input
                required
                placeholder="Brasil"
                value={profile.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </label>
            <FieldLabel label="Idiomas" hint="Separe com vírgula se falar mais de um.">
              <input
                placeholder="Português, inglês…"
                value={profile.languages}
                onChange={(e) => update("languages", e.target.value)}
              />
            </FieldLabel>
          </div>
        </section>

        <section className="form-section" id="dj-section-2">
          <SectionHead step={2} title="Contato" hint="Canal direto para booking e mentoria." />
          <div className="fields">
            <FieldLabel label="E-mail" hint="Usado para login e confirmações.">
              <input
                type="email"
                required
                placeholder="voce@email.com"
                value={profile.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </FieldLabel>
            <label className="field">
              Telefone
              <input
                placeholder="+55 11 99999-0000"
                value={profile.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </label>
            <FieldLabel label="WhatsApp" hint="Preferido para contato rápido de promoters.">
              <input
                placeholder="+55 11 99999-0000"
                value={profile.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel label="Site / press kit" hint="Link do site, Linktree ou press kit online.">
              <input
                placeholder="https://…"
                value={profile.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </FieldLabel>
          </div>
        </section>

        <section className="form-section" id="dj-section-3">
          <SectionHead step={3} title="Perfil artístico" hint="Gêneros, nível e a história do seu som." />
          <div className="fields">
            <FieldLabel label="Nível" hint="A academia adapta exercícios ao seu nível.">
              <select
                value={profile.experienceLevel}
                onChange={(e) => {
                  if (isExperience(e.target.value)) update("experienceLevel", e.target.value);
                }}
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
                <option value="profissional">Profissional</option>
              </select>
            </FieldLabel>
            <label className="field">
              Anos de cabine
              <input
                type="number"
                min={0}
                placeholder="3"
                value={profile.yearsDJing}
                onChange={(e) => update("yearsDJing", e.target.value)}
              />
            </label>
            <label className="field">
              Sets por mês
              <input
                type="number"
                min={0}
                placeholder="4"
                value={profile.setsPerMonth}
                onChange={(e) => update("setsPerMonth", e.target.value)}
              />
            </label>
            <FieldLabel label="Venue preferida" hint="Onde você mais se sente em casa.">
              <select value={profile.preferredVenue} onChange={(e) => update("preferredVenue", e.target.value)}>
                <option value="clube">Clube</option>
                <option value="festival">Festival</option>
                <option value="radio">Rádio</option>
                <option value="streaming">Live stream</option>
                <option value="casamento">Open format / festa</option>
              </select>
            </FieldLabel>
            <FieldLabel className="full" label="Bio" hint="Até 800 caracteres — conte seu estilo em poucas linhas.">
              <textarea
                required
                maxLength={800}
                placeholder="House e techno com grooves brasileiros, sets energéticos para pista cheia…"
                value={profile.bio}
                onChange={(e) => update("bio", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel className="full" label="Influências" hint="Artistas ou referências que moldam seu som.">
              <input
                placeholder="Frankie Knuckles, MK, Vintage Culture…"
                value={profile.influences}
                onChange={(e) => update("influences", e.target.value)}
              />
            </FieldLabel>
            <div className="field full">
              Gêneros
              <span className="field-hint">Selecione um ou mais — aparecem no visor e nas sugestões de playlist.</span>
              <div className="chip-set">
                {GENRE_OPTIONS.map((genre) => (
                  <label key={genre}>
                    <input
                      type="checkbox"
                      checked={profile.genres.includes(genre)}
                      onChange={() => update("genres", toggle(profile.genres, genre))}
                    />
                    {genre}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="form-section" id="dj-section-4">
          <SectionHead
            step={4}
            title="Equipamento"
            hint="CDJ, controladora, mixer ou vinil — o Mamute DJPLAYER simula os três primeiros."
          />
          <div className="fields">
            <div className="field full">
              Hardware
              <span className="field-hint">Marque o que você usa ou quer treinar na cabine virtual.</span>
              <div className="chip-set">
                {HARDWARE.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={profile.hardware.includes(item)}
                      onChange={() => update("hardware", toggle(profile.hardware, item))}
                    />
                    {HARDWARE_LABELS[item]}
                  </label>
                ))}
              </div>
            </div>
            <label className="field">
              Marcas
              <input
                value={profile.brands}
                placeholder="Pioneer, Denon, NI…"
                onChange={(e) => update("brands", e.target.value)}
              />
            </label>
            <label className="field">
              Fones
              <input
                placeholder="Sennheiser HD-25…"
                value={profile.headphones}
                onChange={(e) => update("headphones", e.target.value)}
              />
            </label>
            <div className="field full">
              Software
              <span className="field-hint">DJs que usam o mesmo software recebem dicas mais precisas.</span>
              <div className="chip-set">
                {SOFTWARE_OPTIONS.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={profile.software.includes(item)}
                      onChange={() => update("software", toggle(profile.software, item))}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="form-section" id="dj-section-5">
          <SectionHead
            step={5}
            title="Presença digital"
            hint="Handles do Mamute e das cinco integrações do visor — preencha os que você usa."
          />
          <div className="fields">
            {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
              <label className="field" key={key}>
                {label}
                <input
                  placeholder={placeholder}
                  value={profile[key]}
                  onChange={(e) => update(key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="form-section" id="dj-section-6">
          <SectionHead step={6} title="Carreira" hint="Booking, selos e disponibilidade para gigs." />
          <div className="fields">
            <label className="field">
              Agências
              <input
                placeholder="Nome da agência ou autônomo"
                value={profile.agencies}
                onChange={(e) => update("agencies", e.target.value)}
              />
            </label>
            <label className="field">
              Selos
              <input
                placeholder="Selos com os quais já lançou"
                value={profile.labels}
                onChange={(e) => update("labels", e.target.value)}
              />
            </label>
            <label className="field">
              Residências
              <input
                placeholder="Clube X — sextas mensais"
                value={profile.residencies}
                onChange={(e) => update("residencies", e.target.value)}
              />
            </label>
            <label className="field">
              Viagem
              <select value={profile.travel} onChange={(e) => update("travel", e.target.value)}>
                <option value="local">Só local</option>
                <option value="nacional">Nacional</option>
                <option value="internacional">Internacional</option>
              </select>
            </label>
            <FieldLabel label="Cache" hint="Faixa indicativa — opcional e confidencial.">
              <input
                placeholder="R$ 1.500 – 3.000 / set"
                value={profile.feeRange}
                onChange={(e) => update("feeRange", e.target.value)}
              />
            </FieldLabel>
            <label className="field">
              Press kit URL
              <input
                placeholder="https://…"
                value={profile.pressKit}
                onChange={(e) => update("pressKit", e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="form-section" id="dj-section-7">
          <SectionHead step={7} title="Aprendizado" hint="A academia usa isso para sugerir módulos e exercícios." />
          <div className="fields">
            <FieldLabel label="Horas por semana" hint="Quanto tempo você pode dedicar por semana.">
              <input
                type="number"
                min={1}
                max={40}
                placeholder="5"
                value={profile.weeklyHours}
                onChange={(e) => update("weeklyHours", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel className="full" label="Objetivos" hint="Ex.: transições mais limpas, beatmatch em vinil, branding.">
              <textarea
                placeholder="Quero dominar harmonic mixing e gravar um podcast mensal…"
                value={profile.goals}
                onChange={(e) => update("goals", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel className="full" label="Desafios atuais" hint="O que mais trava você hoje na cabine.">
              <textarea
                placeholder="Dificuldade com EQ em pista barulhenta…"
                value={profile.challenges}
                onChange={(e) => update("challenges", e.target.value)}
              />
            </FieldLabel>
            <label className="field">
              <span>
                <input
                  type="checkbox"
                  checked={profile.mentorship}
                  onChange={(e) => update("mentorship", e.target.checked)}
                />
                Quero mentoria Mamute
              </span>
            </label>
          </div>
        </section>

        <section className="form-section" id="dj-section-8">
          <SectionHead
            step={8}
            title="Termos"
            hint="Cadastro pedagógico. Mixagem licenciada continua nas plataformas oficiais."
          />
          <div className="checks">
            <label>
              <input
                type="checkbox"
                required
                checked={profile.over18}
                onChange={(e) => update("over18", e.target.checked)}
              />
              Tenho 18 anos ou mais
            </label>
            <label>
              <input
                type="checkbox"
                required
                checked={profile.terms}
                onChange={(e) => update("terms", e.target.checked)}
              />
              Aceito os termos de uso e a política de catálogos (sem mixar streams proibidos)
            </label>
            <label>
              <input
                type="checkbox"
                checked={profile.imageRights}
                onChange={(e) => update("imageRights", e.target.checked)}
              />
              Autorizo uso de nome artístico no mural Mamute
            </label>
            <label>
              <input
                type="checkbox"
                checked={profile.newsletter}
                onChange={(e) => update("newsletter", e.target.checked)}
              />
              Quero avisos de aulas e eventos
            </label>
          </div>
        </section>

        <footer className="dj-register-footer">
          <p>
            Ao gravar, seu perfil fica salvo neste navegador e pode ser enviado ao Mamute. Revise nome
            artístico e e-mail antes de confirmar.
          </p>
          <button className="btn btn-solid" type="submit">
            Gravar perfil de cabine
          </button>
          {saved ? (
            <p className="form-status" role="status">
              Perfil salvo no visor Mamute.
            </p>
          ) : null}
        </footer>
      </form>
    </div>
  );
}
