import type { DjProfile, ExperienceLevel } from "../types";

const KEY = "mamute.dj.profile";
const LEGACY_KEY = "playerdj.dj.profile";

export const EMPTY_PROFILE: DjProfile = {
  fullName: "",
  artistName: "",
  pronouns: "",
  birthDate: "",
  nationality: "",
  city: "",
  country: "Brasil",
  languages: "Português",
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  bio: "",
  experienceLevel: "iniciante",
  yearsDJing: "0",
  genres: [],
  influences: "",
  setsPerMonth: "0",
  preferredVenue: "clube",
  hardware: [],
  brands: "",
  software: ["Mamute DJPLAYER Mixer"],
  headphones: "",
  instagram: "",
  soundcloud: "",
  mixcloud: "",
  beatport: "",
  spotify: "",
  youtube: "",
  tiktok: "",
  deezer: "",
  agencies: "",
  labels: "",
  residencies: "",
  travel: "local",
  feeRange: "",
  pressKit: "",
  goals: "",
  weeklyHours: "3",
  mentorship: false,
  challenges: "",
  terms: false,
  imageRights: false,
  newsletter: true,
  over18: false,
};

export function loadProfile(): DjProfile {
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
  if (!raw) return { ...EMPTY_PROFILE };
  try {
    return { ...EMPTY_PROFILE, ...(JSON.parse(raw) as Partial<DjProfile>) };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function saveProfile(profile: DjProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function isExperience(value: string): value is ExperienceLevel {
  return ["iniciante", "intermediario", "avancado", "profissional"].includes(value);
}
