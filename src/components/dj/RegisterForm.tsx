import { useState, type FormEvent } from "react";
import { GENRE_OPTIONS, SOFTWARE_OPTIONS } from "../../data/academy";
import { isExperience, loadProfile, saveProfile } from "../../lib/storage";
import type { DjProfile, HardwareKind } from "../../types";

const HARDWARE: HardwareKind[] = ["cdj", "controladora", "mixer", "toca-discos"];

function toggle<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function RegisterForm() {
  const [profile, setProfile] = useState<DjProfile>(() => loadProfile());
  const [saved, setSaved] = useState(false);

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
    <form className="form-grid" name="mamute-cadastro" onSubmit={onSubmit} noValidate={false}>
      <input type="hidden" name="form-name" value="mamute-cadastro" />

      <section className="form-section">
        <h2>1. Identidade</h2>
        <p>Quem você é fora e dentro da cabine.</p>
        <div className="fields">
          <label className="field">Nome completo
            <input required value={profile.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </label>
          <label className="field">Nome artístico
            <input required value={profile.artistName} onChange={(e) => update("artistName", e.target.value)} />
          </label>
          <label className="field">Pronomes
            <input value={profile.pronouns} onChange={(e) => update("pronouns", e.target.value)} />
          </label>
          <label className="field">Nascimento
            <input type="date" value={profile.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
          </label>
          <label className="field">Nacionalidade
            <input value={profile.nationality} onChange={(e) => update("nationality", e.target.value)} />
          </label>
          <label className="field">Cidade
            <input required value={profile.city} onChange={(e) => update("city", e.target.value)} />
          </label>
          <label className="field">País
            <input required value={profile.country} onChange={(e) => update("country", e.target.value)} />
          </label>
          <label className="field">Idiomas
            <input value={profile.languages} onChange={(e) => update("languages", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>2. Contato</h2>
        <p>Canal direto para booking e mentoria.</p>
        <div className="fields">
          <label className="field">E-mail
            <input type="email" required value={profile.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label className="field">Telefone
            <input value={profile.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
          <label className="field">WhatsApp
            <input value={profile.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
          </label>
          <label className="field">Site / press kit
            <input value={profile.website} onChange={(e) => update("website", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>3. Perfil artístico</h2>
        <p>Gêneros, nível e a história do seu som.</p>
        <div className="fields">
          <label className="field">Nível
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
          </label>
          <label className="field">Anos de cabine
            <input type="number" min={0} value={profile.yearsDJing} onChange={(e) => update("yearsDJing", e.target.value)} />
          </label>
          <label className="field">Sets por mês
            <input type="number" min={0} value={profile.setsPerMonth} onChange={(e) => update("setsPerMonth", e.target.value)} />
          </label>
          <label className="field">Venue preferida
            <select value={profile.preferredVenue} onChange={(e) => update("preferredVenue", e.target.value)}>
              <option value="clube">Clube</option>
              <option value="festival">Festival</option>
              <option value="radio">Rádio</option>
              <option value="streaming">Live stream</option>
              <option value="casamento">Open format / festa</option>
            </select>
          </label>
          <label className="field full">Bio
            <textarea required maxLength={800} value={profile.bio} onChange={(e) => update("bio", e.target.value)} />
          </label>
          <label className="field full">Influências
            <input value={profile.influences} onChange={(e) => update("influences", e.target.value)} />
          </label>
          <div className="field full">
            Gêneros
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

      <section className="form-section">
        <h2>4. Equipamento</h2>
        <p>CDJ, controladora, mixer ou vinil — o Mamute DJPLAYER simula os três primeiros.</p>
        <div className="fields">
          <div className="field full">
            Hardware
            <div className="chip-set">
              {HARDWARE.map((item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={profile.hardware.includes(item)}
                    onChange={() => update("hardware", toggle(profile.hardware, item))}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
          <label className="field">Marcas
            <input value={profile.brands} placeholder="Pioneer, Denon, NI…" onChange={(e) => update("brands", e.target.value)} />
          </label>
          <label className="field">Fones
            <input value={profile.headphones} onChange={(e) => update("headphones", e.target.value)} />
          </label>
          <div className="field full">
            Software
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

      <section className="form-section">
        <h2>5. Presença digital</h2>
        <p>Handles do Mamute e das cinco integrações do visor.</p>
        <div className="fields">
          {(["instagram", "soundcloud", "mixcloud", "beatport", "spotify", "youtube", "tiktok", "deezer"] as const).map((key) => (
            <label className="field" key={key}>
              {key}
              <input value={profile[key]} onChange={(e) => update(key, e.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>6. Carreira</h2>
        <p>Booking, selos e disponibilidade.</p>
        <div className="fields">
          <label className="field">Agências
            <input value={profile.agencies} onChange={(e) => update("agencies", e.target.value)} />
          </label>
          <label className="field">Selos
            <input value={profile.labels} onChange={(e) => update("labels", e.target.value)} />
          </label>
          <label className="field">Residências
            <input value={profile.residencies} onChange={(e) => update("residencies", e.target.value)} />
          </label>
          <label className="field">Viagem
            <select value={profile.travel} onChange={(e) => update("travel", e.target.value)}>
              <option value="local">Só local</option>
              <option value="nacional">Nacional</option>
              <option value="internacional">Internacional</option>
            </select>
          </label>
          <label className="field">Cache
            <input value={profile.feeRange} onChange={(e) => update("feeRange", e.target.value)} />
          </label>
          <label className="field">Press kit URL
            <input value={profile.pressKit} onChange={(e) => update("pressKit", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>7. Aprendizado</h2>
        <p>A academia usa isso para sugerir módulos e exercícios.</p>
        <div className="fields">
          <label className="field">Horas por semana
            <input type="number" min={1} max={40} value={profile.weeklyHours} onChange={(e) => update("weeklyHours", e.target.value)} />
          </label>
          <label className="field full">Objetivos
            <textarea value={profile.goals} onChange={(e) => update("goals", e.target.value)} />
          </label>
          <label className="field full">Desafios atuais
            <textarea value={profile.challenges} onChange={(e) => update("challenges", e.target.value)} />
          </label>
          <label className="field">
            <span>
              <input type="checkbox" checked={profile.mentorship} onChange={(e) => update("mentorship", e.target.checked)} />
              Quero mentoria Mamute
            </span>
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>8. Termos</h2>
        <p>Cadastro pedagógico. Mixagem licenciada continua nas plataformas oficiais.</p>
        <div className="checks">
          <label>
            <input type="checkbox" required checked={profile.over18} onChange={(e) => update("over18", e.target.checked)} />
            Tenho 18 anos ou mais
          </label>
          <label>
            <input type="checkbox" required checked={profile.terms} onChange={(e) => update("terms", e.target.checked)} />
            Aceito os termos de uso e a política de catálogos (sem mixar streams proibidos)
          </label>
          <label>
            <input type="checkbox" checked={profile.imageRights} onChange={(e) => update("imageRights", e.target.checked)} />
            Autorizo uso de nome artístico no mural Mamute
          </label>
          <label>
            <input type="checkbox" checked={profile.newsletter} onChange={(e) => update("newsletter", e.target.checked)} />
            Quero avisos de aulas e eventos
          </label>
        </div>
      </section>

      <button className="btn btn-solid" type="submit">Gravar perfil de cabine</button>
      {saved ? <p className="form-status" role="status">Perfil salvo no visor Mamute.</p> : null}
    </form>
  );
}
