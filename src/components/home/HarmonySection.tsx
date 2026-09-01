import { useCallback, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { NavLink } from "react-router";
import { HARMONY_DRILLS, HARMONY_STUDIES, HARMONY_TIPS } from "../../data/harmony";
import {
  CAMELOT_BY_CODE,
  getCamelotKey,
  harmonicSquare,
  neighborCamelot,
  relativeCamelot,
} from "../../lib/musical-key";
import type { HarmonyStudyId } from "../../types/harmony";
import { CamelotWheel } from "./CamelotWheel";

const DEFAULT_CODE = "8A";

const STUDY_ORDER: HarmonyStudyId[] = ["ler", "aplicar", "metodos", "praticas"];

function studyById(id: HarmonyStudyId) {
  return HARMONY_STUDIES.find((item) => item.id === id) ?? HARMONY_STUDIES[0]!;
}

export function HarmonySection() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [studyId, setStudyId] = useState<HarmonyStudyId>("ler");

  const active = getCamelotKey(code) ?? CAMELOT_BY_CODE[DEFAULT_CODE]!;
  const study = studyById(studyId);
  const relative = relativeCamelot(active.code);
  const prev = neighborCamelot(active.code, -1);
  const next = neighborCamelot(active.code, 1);
  const journey = useMemo(() => harmonicSquare(active.code), [active.code]);

  const relativeKey = relative ? getCamelotKey(relative) : undefined;
  const prevKey = prev ? getCamelotKey(prev) : undefined;
  const nextKey = next ? getCamelotKey(next) : undefined;

  const onStudyKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + STUDY_ORDER.length) % STUDY_ORDER.length;
    setStudyId(STUDY_ORDER[nextIndex]!);
  }, []);

  const neighborChips = [
    { key: prevKey, hint: "−1 quinta" },
    { key: relativeKey, hint: "relativo" },
    { key: nextKey, hint: "+1 quinta" },
  ].filter((item): item is { key: NonNullable<typeof prevKey>; hint: string } => Boolean(item.key));

  return (
    <section
      className="home-showcase harmony-showcase"
      id="harmonia"
      aria-labelledby="harmony-title"
    >
      <div className="home-showcase-head">
        <p className="kicker">Harmonia · roda Camelot</p>
        <h2 id="harmony-title">Navegue em boa sintonia</h2>
        <p>
          A escala Camelot traduz o círculo de quintas em relógio: B no anel de fora (maior), A no
          de dentro (menor). Clique uma fatia — os vizinhos acendem. É o mapa para o aluno sentir
          que pode viajar de tom em tom sem desafinar a pista.
        </p>
      </div>

      <div className="harmony-stage">
        <CamelotWheel selected={active.code} onSelect={setCode} />

        <article
          className="card harmony-key-card"
          aria-live="polite"
          data-stage="13"
          style={{ "--spot-accent": active.color } as CSSProperties}
        >
          <p className="kicker">Tom selecionado · vetor 3D</p>
          <header className="harmony-key-head">
            <span className="harmony-key-code">{active.code}</span>
            <div>
              <h3>{active.namePt}</h3>
              <p>
                {active.nameIntl} · {active.mode}
              </p>
            </div>
          </header>

          <p className="harmony-key-lead">
            {active.letter === "A"
              ? "Tom menor: corpo, groove, afterglow. O relativo maior abre o céu no peak."
              : "Tom maior: céu aberto, vocal e peak. O relativo menor fecha o corpo sem sair do bairro."}
          </p>

          <div className="harmony-neighbors" aria-label="Tons compatíveis">
            {neighborChips.map((item) => (
              <button
                key={item.key.code}
                type="button"
                className="harmony-chip"
                style={{ "--chip-accent": item.key.color } as CSSProperties}
                onClick={() => setCode(item.key.code)}
              >
                <strong>{item.key.code}</strong>
                <span>{item.key.namePt}</span>
                <em>{item.hint}</em>
              </button>
            ))}
          </div>

          <div className="harmony-journey">
            <p className="kicker">Jornada sugerida · quadrado harmônico</p>
            <div className="harmony-prism-scene" aria-hidden="true">
              <div className="harmony-prism-rig">
                <span className="harmony-prism-plane" />
                {journey.map((step) => {
                  const stepKey = getCamelotKey(step);
                  return (
                    <span
                      key={step}
                      className={
                        step === active.code
                          ? "harmony-prism-node is-active"
                          : "harmony-prism-node"
                      }
                      style={
                        {
                          "--node-color": stepKey?.color ?? active.color,
                        } as CSSProperties
                      }
                    >
                      {step}
                    </span>
                  );
                })}
              </div>
            </div>
            <ol>
              {journey.map((step, index) => {
                const stepKey = getCamelotKey(step);
                return (
                  <li key={step}>
                    <button
                      type="button"
                      className={step === active.code ? "is-active" : undefined}
                      style={{ "--chip-accent": stepKey?.color ?? active.color } as CSSProperties}
                      onClick={() => setCode(step)}
                    >
                      <span>{index + 1}</span>
                      {step}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p>
              {journey.join(" → ")} — um bloco de quatro faixas que volta para casa.
            </p>
          </div>
        </article>
      </div>

      <div className="harmony-study">
        <div className="harmony-study-tabs" role="tablist" aria-label="Estudo de harmonia">
          {HARMONY_STUDIES.map((item, index) => {
            const selected = item.id === studyId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`harmony-tab-${item.id}`}
                aria-selected={selected}
                aria-controls="harmony-study-panel"
                tabIndex={selected ? 0 : -1}
                className={selected ? "is-active" : undefined}
                onClick={() => setStudyId(item.id)}
                onKeyDown={(event) => onStudyKeyDown(event, index)}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        <article
          className="card harmony-study-panel"
          id="harmony-study-panel"
          role="tabpanel"
          aria-labelledby={`harmony-tab-${study.id}`}
        >
          <p className="kicker">{study.kicker}</p>
          <h3>{study.title}</h3>
          <p className="harmony-study-lead">{study.lead}</p>

          {study.steps ? (
            <ol className="harmony-steps">
              {study.steps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>
          ) : null}

          {study.cards ? (
            <div className="harmony-method-grid">
              {study.cards.map((card) => (
                <article key={card.title}>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          ) : null}

          {study.bullets ? (
            <ul className="harmony-bullets">
              {study.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>

      <div className="harmony-tips" aria-label="Dicas de harmonia">
        {HARMONY_TIPS.map((tip) => (
          <article className="card harmony-tip" key={tip.id}>
            <h4>{tip.title}</h4>
            <p>{tip.body}</p>
          </article>
        ))}
      </div>

      <div className="harmony-drills">
        {HARMONY_DRILLS.map((drill) => (
          <article className="card harmony-drill" key={drill.id}>
            <header>
              <h4>{drill.title}</h4>
              <span>{drill.duration}</span>
            </header>
            <p>{drill.goal}</p>
            <ol>
              {drill.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      <div className="harmony-footer">
        <NavLink className="btn" to="/academia#l-07">
          Aula Camelot na academia
        </NavLink>
        <NavLink className="btn btn-solid" to="/mixer">
          Treinar keys no mixer
        </NavLink>
      </div>
    </section>
  );
}
