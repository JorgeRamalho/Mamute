export type PlatformId =
  | "beatport"
  | "deezer"
  | "soundcloud"
  | "youtube"
  | "spotify";

export interface PlatformIntel {
  id: PlatformId;
  name: string;
  role: string;
  accent: string;
  summary: string;
  capabilities: string[];
  limits: string[];
  playerDjUse: string;
  docsUrl: string;
  partnerUrl?: string;
}
