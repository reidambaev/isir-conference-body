/** Program session codes for invited speaker abstracts. */

export const PROGRAM_SESSIONS = [
  "PS1",
  "PS2",
  "PF1",
  "PF2",
  "PF3",
  "POP1",
  "POP2",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
  "S10",
  "S11",
  "S12",
  "S13",
  "S14",
  "S15",
  "S16",
  "S17",
  "S18",
  "S19",
  "S20",
  "S21",
];

const SESSION_SET = new Set(PROGRAM_SESSIONS);

function normalizeProgramSessionKey(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[\s.–—-]+/g, "");
}

const PROGRAM_SESSION_ALIASES = {
  PS1: "PS1",
  PSI: "PS1",
  PRESIDENTSYMPOSIUMI: "PS1",
  PRESIDENTSYMPOSIUM1: "PS1",
  PS2: "PS2",
  PSII: "PS2",
  PRESIDENTSYMPOSIUMII: "PS2",
  PRESIDENTSYMPOSIUM2: "PS2",
  PF1: "PF1",
  PFI: "PF1",
  PUBLICFORUMI: "PF1",
  PUBLICFORUM1: "PF1",
  PF2: "PF2",
  PFII: "PF2",
  PUBLICFORUMII: "PF2",
  PUBLICFORUM2: "PF2",
  PF3: "PF3",
  PFIII: "PF3",
  PUBLICFORUMIII: "PF3",
  PUBLICFORUM3: "PF3",
  POP1: "POP1",
  POPI: "POP1",
  POPULATIONFORUMI: "POP1",
  POPULATIONFORUM1: "POP1",
  POP2: "POP2",
  POPII: "POP2",
  POPULATIONFORUMII: "POP2",
  POPULATIONFORUM2: "POP2",
};

export function getProgramSession(code) {
  const parsed = parseProgramSession(code);
  if (!parsed.ok || !parsed.value) return null;
  return parsed.value;
}

/** Normalize assigned program session code, or null to clear. */
export function parseProgramSession(raw) {
  if (raw === null || raw === "" || raw === undefined) {
    return { ok: true, value: null };
  }
  const key = normalizeProgramSessionKey(raw);
  if (key === "CLEAR" || key === "NONE" || key === "UNASSIGNED") {
    return { ok: true, value: null };
  }
  const value = PROGRAM_SESSION_ALIASES[key] || (SESSION_SET.has(key) ? key : null);
  if (value) {
    return { ok: true, value };
  }
  return { ok: false, value: null };
}
