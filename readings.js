// Data logic for snow readings. No browser APIs here so Deno can test it.

export const DUSTING = 0.01;
export const KINDS = ["new", "total"];
export const BACKUP_APP = "snow_tracker";
export const BACKUP_VERSION = 1;

// Accepts whole tenths of an inch (e.g. "2", "2.5", ".5") or exactly 0.01 (Dusting).
// Returns { ok: true, value } or { ok: false, error }.
export function parseInches(text) {
  const s = String(text ?? "").trim();
  if (s === "") return { ok: false, error: "Enter how many inches." };
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) {
    return { ok: false, error: "Inches must be a number like 2.5." };
  }
  const v = Number(s);
  if (!Number.isFinite(v) || v < 0) {
    return { ok: false, error: "Inches must be zero or more." };
  }
  if (Math.abs(v - DUSTING) < 1e-9) return { ok: true, value: DUSTING };
  const tenths = v * 10;
  if (Math.abs(tenths - Math.round(tenths)) > 1e-9) {
    return {
      ok: false,
      error: "Use one decimal place (like 2.5), or tap Dusting for 0.01.",
    };
  }
  return { ok: true, value: Math.round(tenths) / 10 };
}

export function formatInches(value) {
  if (value === DUSTING) return "Dusting";
  return `${value.toFixed(1)}"`;
}

// Builds a reading from form values. Returns { ok: true, reading } or { ok: false, error }.
export function makeReading({ id, takenAt, inches, kind, note }) {
  const parsed = parseInches(inches);
  if (!parsed.ok) return parsed;
  const date = takenAt instanceof Date ? takenAt : new Date(takenAt);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Enter a valid date and time." };
  }
  if (!KINDS.includes(kind)) {
    return { ok: false, error: "Choose New or Total." };
  }
  return {
    ok: true,
    reading: {
      id,
      takenAt: date.toISOString(),
      inches: parsed.value,
      kind,
      note: String(note ?? "").trim(),
    },
  };
}

export function sortNewestFirst(readings) {
  return [...readings].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

// "YYYY-MM-DDTHH:MM" in local time, the format <input type="datetime-local"> uses.
export function toLocalInputValue(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function makeBackup(readings, now = new Date()) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    readings: sortNewestFirst(readings),
  };
}

// Parses backup file text. Returns { ok: true, readings } or { ok: false, error }.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't a snow tracker backup." };
  }
  if (!data || data.app !== BACKUP_APP || !Array.isArray(data.readings)) {
    return { ok: false, error: "That file isn't a snow tracker backup." };
  }
  if (data.version !== BACKUP_VERSION) {
    return { ok: false, error: `Unsupported backup version: ${data.version}.` };
  }
  const readings = [];
  for (const [i, r] of data.readings.entries()) {
    if (!r || typeof r.id !== "string" || r.id === "") {
      return { ok: false, error: `Reading ${i + 1} in the backup has no id.` };
    }
    const built = makeReading({ ...r, inches: String(r.inches) });
    if (!built.ok) {
      return { ok: false, error: `Reading ${i + 1} in the backup: ${built.error}` };
    }
    readings.push(built.reading);
  }
  return { ok: true, readings };
}

export function freshState() {
  return { readings: [], lastKind: "total", unsaved: false, lastBackupAt: null };
}

// Parses the app's saved state. Empty storage is a fresh start.
// Returns { ok: true, state } or { ok: false } when the data is unreadable.
export function parseStoredState(raw) {
  if (raw === null || raw === undefined || raw === "") return { ok: true, state: freshState() };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.readings)) return { ok: false };
  const state = { ...freshState(), ...data };
  if (!KINDS.includes(state.lastKind)) state.lastKind = "total";
  state.unsaved = state.unsaved === true;
  return { ok: true, state };
}

// Adds incoming readings whose id isn't already present. Never removes or overwrites.
export function mergeReadings(existing, incoming) {
  const ids = new Set(existing.map((r) => r.id));
  const merged = [...existing];
  let added = 0;
  let skipped = 0;
  for (const r of incoming) {
    if (ids.has(r.id)) {
      skipped++;
    } else {
      ids.add(r.id);
      merged.push(r);
      added++;
    }
  }
  return { readings: merged, added, skipped };
}
