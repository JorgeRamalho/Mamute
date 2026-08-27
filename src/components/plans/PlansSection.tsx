import { useState } from "react";
import { NavLink } from "react-router";
import { PLAN_COMPARE, PLAN_FAQS, PLAN_NAMES, PLAN_NOTES, PLANS } from "../../data/plans";
import type { BillingCycle, Plan, PlanId } from "../../types/plan";

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "Mensal",
  yearly: "Anual · 2 meses inclusos",
};

function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function cellLabel(value: boolean | string): string {
  if (value === true) return "Incluso";
  if (value === false) return "Não incluso";
  return value;
}

function PlanCard({ plan, cycle }: { plan: Plan; cycle: BillingCycle }) {
  const amount = cycle === "monthly" ? plan.monthly : plan.yearly;
  const suffix = cycle === "monthly" ? "por mês" : "por ano";
  const equivalent =
    cycle === "yearly" ? `${formatBrl(Math.round(plan.yearly / 12))} equivalentes ao mês` : null;

  return (
    <article
      className={plan.featured ? "plan-card is-featured" : "plan-card"}
      data-plan={plan.id}
      aria-labelledby={`plan-${plan.id}-title`}
    >
      {plan.featured ? (
        <>
          <span className="plan-corner-tag">Mais escolhido</span>
          <p className="plan-badge">{plan.badge}</p>
        </>
      ) : (
        <p className="plan-badge">{plan.badge}</p>
      )}
      <h3 id={`plan-${plan.id}-title`}>{plan.name}</h3>
      <p className="plan-audience">{plan.audience}</p>
      <p className="plan-tagline">{plan.tagline}</p>
      <p className="plan-price">
        <strong>{formatBrl(amount)}</strong>
        <span>{suffix}</span>
      </p>
      {equivalent ? <p className="plan-equivalent">{equivalent}</p> : null}
      <NavLink className="btn" to={`/dj?plano=${plan.id}`}>
        {plan.cta}
      </NavLink>

      <h4>O que entra</h4>
      <ul>
        {plan.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h4>Vantagens</h4>
      <ul>
        {plan.perks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export function PlansSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const planIds = PLANS.map((plan) => plan.id);

  return (
    <section className="plans" id="assinatura" aria-labelledby="plans-title">
      <header className="plans-intro">
        <p className="kicker">Assinatura · combos da cabine</p>
        <h2 id="plans-title">Bronze, Prata e Ouro — do primeiro beat ao peak time.</h2>
        <p>
          Três camadas da mesma booth: treino no mixer sintético, academia com progresso no visor
          e rádio em clipe. Nenhum combo finge Beatport LINK nem mixa catálogo de streaming.
        </p>
        <div className="plans-cycle" role="group" aria-label="Ciclo de cobrança">
          {(Object.keys(CYCLE_LABEL) as BillingCycle[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={cycle === value}
              onClick={() => setCycle(value)}
            >
              {CYCLE_LABEL[value]}
            </button>
          ))}
        </div>
      </header>

      <div className="plans-grid">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} cycle={cycle} />
        ))}
      </div>

      <section className="plans-compare-wrap" aria-labelledby="plans-compare-title">
        <h3 id="plans-compare-title">Comparativo de atributos</h3>
        <p>Do básico ao avançado: o que cada metal destrava na cabine Harako.</p>
        <div className="plans-compare-scroll">
          <table className="plans-compare">
            <caption className="visually-hidden">Inclusões por combo Bronze, Prata e Ouro</caption>
            <thead>
              <tr>
                <th scope="col">Atributo</th>
                {planIds.map((id) => (
                  <th scope="col" key={id}>
                    {PLAN_NAMES[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARE.map((row) => (
                <tr key={`${row.group}-${row.feature}`}>
                  <th scope="row">
                    <span className="plans-compare-group">{row.group}</span>
                    {row.feature}
                  </th>
                  {planIds.map((id: PlanId) => {
                    const value = row.values[id];
                    const included = value !== false;
                    return (
                      <td
                        key={id}
                        data-included={included ? "yes" : "no"}
                      >
                        {cellLabel(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ul className="plans-notes">
        {PLAN_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <section className="plans-faq" aria-labelledby="plans-faq-title">
        <h3 id="plans-faq-title">Perguntas da booth</h3>
        {PLAN_FAQS.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </section>
  );
}
