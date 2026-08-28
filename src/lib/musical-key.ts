const CAMELOT: Record<string, { root: string; scale: string }> = {
  "1A": { root: "G#", scale: "Ab minor" },
  "1B": { root: "B", scale: "B major" },
  "2A": { root: "D#", scale: "Eb minor" },
  "2B": { root: "F#", scale: "Gb major" },
  "3A": { root: "A#", scale: "Bb minor" },
  "3B": { root: "C#", scale: "Db major" },
  "4A": { root: "F", scale: "F minor" },
  "4B": { root: "G#", scale: "Ab major" },
  "5A": { root: "C", scale: "C minor" },
  "5B": { root: "D#", scale: "Eb major" },
  "6A": { root: "G", scale: "G minor" },
  "6B": { root: "A#", scale: "Bb major" },
  "7A": { root: "D", scale: "D minor" },
  "7B": { root: "F", scale: "F major" },
  "8A": { root: "A", scale: "A minor" },
  "8B": { root: "C", scale: "C major" },
  "9A": { root: "E", scale: "E minor" },
  "9B": { root: "G", scale: "G major" },
  "10A": { root: "B", scale: "B minor" },
  "10B": { root: "D", scale: "D major" },
  "11A": { root: "F#", scale: "Gb minor" },
  "11B": { root: "A", scale: "A major" },
  "12A": { root: "C#", scale: "Db minor" },
  "12B": { root: "E", scale: "E major" },
};

export function resolveMusicalKey(camelot: string): { root: string; scale: string; label: string } {
  const entry = CAMELOT[camelot.toUpperCase()];
  if (!entry) {
    return { root: "—", scale: "Unknown", label: camelot };
  }
  return {
    ...entry,
    label: `${entry.root} · ${entry.scale}`,
  };
}

export function harmonicDistance(from: string, to: string): "perfect" | "compatible" | "shift" {
  if (from === to) return "perfect";
  const fromNum = Number.parseInt(from, 10);
  const toNum = Number.parseInt(to, 10);
  const fromLetter = from.slice(-1);
  const toLetter = to.slice(-1);
  if (fromNum === toNum && fromLetter !== toLetter) return "compatible";
  const diff = Math.abs(fromNum - toNum);
  if (diff === 1 || diff === 11) return "compatible";
  return "shift";
}
