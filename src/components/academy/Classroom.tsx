import { useMemo, useState } from "react";
import { COURSE_MODULES } from "../../data/courses";
import { EXERCISES, TIPS } from "../../data/academy";
import { completionRatio, loadProgress, toggleLesson } from "../../lib/academy";

export function Classroom() {
  const [done, setDone] = useState<string[]>(() => loadProgress());
  const [activeId, setActiveId] = useState(COURSE_MODULES[0]?.lessons[0]?.id ?? "l-01");

  const lesson = useMemo(() => {
    for (const module of COURSE_MODULES) {
      const found = module.lessons.find((item) => item.id === activeId);
      if (found) return { module, lesson: found };
    }
    return null;
  }, [activeId]);

  if (!lesson) return null;
  const ratio = Math.round(completionRatio(done) * 100);

  return (
    <div>
      <p className="kicker">Progresso da cabine · {ratio}%</p>
      <div className="lesson-layout">
        <nav className="lesson-nav card" aria-label="Módulos do curso">
          {COURSE_MODULES.map((module) => (
            <div key={module.id}>
              <p className="kicker">{module.level}</p>
              <h3>{module.title}</h3>
              {module.lessons.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === activeId ? "active" : ""}
                  onClick={() => setActiveId(item.id)}
                >
                  {done.includes(item.id) ? "● " : "○ "}
                  {item.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <article className="card">
          <p className="kicker">{lesson.module.subtitle} · {lesson.lesson.duration}</p>
          <h2>{lesson.lesson.title}</h2>
          <p>{lesson.lesson.synopsis}</p>
          {lesson.lesson.youtubeId ? (
            <div className="video-frame">
              <iframe
                title={lesson.lesson.title}
                src={`https://www.youtube-nocookie.com/embed/${lesson.lesson.youtubeId}?rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          <ul>
            {lesson.lesson.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button
            className="btn btn-solid"
            type="button"
            onClick={() => setDone(toggleLesson(lesson.lesson.id))}
          >
            {done.includes(lesson.lesson.id) ? "Desmarcar aula" : "Concluir aula"}
          </button>
        </article>
      </div>

      <div className="section-title">
        <h2>Dicas e melhores práticas</h2>
        <p>Hábitos de cabine que separam o botão de sync de um DJ que segura a pista.</p>
      </div>
      <div className="grid-3">
        {TIPS.map((tip) => (
          <article className="card" key={tip.id}>
            <p className="kicker">{tip.level}</p>
            <h3>{tip.title}</h3>
            <p>{tip.body}</p>
          </article>
        ))}
      </div>

      <div className="section-title">
        <h2>Laboratório de exercícios</h2>
        <p>Treinos curtos para usar no mixer Harako com fone e o visor aberto.</p>
      </div>
      <div className="grid-3">
        {EXERCISES.map((exercise) => (
          <article className="card" key={exercise.id}>
            <p className="kicker">{exercise.duration}</p>
            <h3>{exercise.title}</h3>
            <p>{exercise.goal}</p>
            <ol>
              {exercise.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}
