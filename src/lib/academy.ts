import { COURSE_MODULES } from "../data/courses";

const KEY = "mamute.academy.progress";
const LEGACY_KEY = "playerdj.academy.progress";

export function loadProgress(): string[] {
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function toggleLesson(id: string): string[] {
  const current = new Set(loadProgress());
  if (current.has(id)) current.delete(id);
  else current.add(id);
  const next = [...current];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function completionRatio(done: string[]): number {
  const total = COURSE_MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);
  return total === 0 ? 0 : done.length / total;
}
