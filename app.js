import {
  DUSTING,
  formatInches,
  freshState,
  makeBackup,
  makeReading,
  mergeReadings,
  parseBackup,
  parseStoredState,
  sortNewestFirst,
  toLocalInputValue,
} from "./readings.js";

const STORAGE_KEY = "snow_tracker.v1";

const $ = (id) => document.getElementById(id);
const form = $("entry-form");

const state = loadState();
let editingId = null;
// True once the user changes the time field; until then a new reading uses "now".
let timeTouched = false;

// Reads saved state. Returns { ok: true, state }, or { ok: false, reason }.
function readStored() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  const parsed = parseStoredState(raw);
  if (parsed.ok) return parsed;
  // Keep the unreadable data aside rather than overwrite it.
  try {
    localStorage.setItem(`${STORAGE_KEY}.unreadable`, raw);
  } catch { /* storage unavailable */ }
  return { ok: false, reason: "unreadable" };
}

function loadState() {
  const r = readStored();
  if (r.ok) return r.state;
  if (r.reason === "unreadable") {
    alert("Saved readings could not be read. Import a backup to restore them.");
  } else {
    alert("This device isn't letting the app save readings.");
  }
  return freshState();
}

// Re-reads storage so changes made in another open copy of the app aren't lost.
// Keeps what's in memory if storage can't be read.
function refreshState() {
  const r = readStored();
  if (r.ok) Object.assign(state, r.state);
}

// Saves `next` and only then makes it the current state, so a failed save
// never leaves memory and storage disagreeing.
function commit(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    showError("Could not save on this device. Back up now if you can.");
    return false;
  }
  Object.assign(state, next);
  return true;
}

function showError(msg) {
  $("form-error").textContent = msg;
}

function showStatus(msg) {
  $("status").textContent = msg;
}

function selectedKind() {
  return form.querySelector('input[name="kind"]:checked')?.value;
}

function setKind(kind) {
  for (const r of form.querySelectorAll('input[name="kind"]')) r.checked = r.value === kind;
}

function resetForm() {
  editingId = null;
  timeTouched = false;
  $("form-title").textContent = "New reading";
  $("taken-at").value = toLocalInputValue(new Date());
  $("inches").value = "";
  $("note").value = "";
  setKind(state.lastKind);
  $("save").textContent = "Save";
  $("cancel").hidden = true;
  $("delete").hidden = true;
  showError("");
}

function startEdit(reading) {
  editingId = reading.id;
  $("form-title").textContent = "Edit reading";
  $("taken-at").value = toLocalInputValue(new Date(reading.takenAt));
  $("inches").value = String(reading.inches);
  $("note").value = reading.note;
  setKind(reading.kind);
  $("save").textContent = "Save changes";
  $("cancel").hidden = false;
  $("delete").hidden = false;
  showError("");
  showStatus("");
  form.scrollIntoView({ behavior: "smooth" });
}

function editedReadingGone() {
  return editingId !== null && !state.readings.some((r) => r.id === editingId);
}

function render() {
  const list = $("list");
  list.replaceChildren();
  const sorted = sortNewestFirst(state.readings);
  $("empty").hidden = sorted.length > 0;
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  for (const r of sorted) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = fmt.format(new Date(r.takenAt));
    const amount = document.createElement("span");
    amount.className = "amount";
    amount.textContent = formatInches(r.inches);
    const kind = document.createElement("span");
    kind.className = "kind-tag";
    kind.textContent = r.kind === "new" ? "New snow" : "Total depth";
    btn.append(when, amount, kind);
    if (r.note) {
      const note = document.createElement("span");
      note.className = "note";
      note.textContent = r.note;
      btn.append(note);
    }
    btn.addEventListener("click", () => startEdit(r));
    li.append(btn);
    list.append(li);
  }

  $("backup-banner").hidden = !state.unsaved;
  $("last-backup").textContent = state.lastBackupAt
    ? `Last backup: ${fmt.format(new Date(state.lastBackupAt))}`
    : "Not backed up yet.";
}

// Picks up changes from another open copy of the app and a stale default time.
function syncFromStorage() {
  refreshState();
  render();
  if (editedReadingGone()) {
    resetForm();
    showStatus("That reading was deleted in another window.");
  } else if (editingId === null && !timeTouched) {
    $("taken-at").value = toLocalInputValue(new Date());
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncFromStorage();
});
globalThis.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) syncFromStorage();
});

for (const type of ["input", "change"]) {
  $("taken-at").addEventListener(type, () => {
    timeTouched = true;
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  refreshState();
  if (editedReadingGone()) {
    resetForm();
    render();
    showStatus("That reading was deleted in another window.");
    return;
  }
  const isNew = editingId === null;
  const built = makeReading({
    id: editingId ?? crypto.randomUUID(),
    // A new reading whose time wasn't changed is taken "now", even if the form sat open.
    takenAt: isNew && !timeTouched ? new Date() : $("taken-at").value,
    inches: $("inches").value,
    kind: selectedKind(),
    note: $("note").value,
  });
  if (!built.ok) {
    showError(built.error);
    return;
  }
  const readings = isNew
    ? [...state.readings, built.reading]
    : state.readings.map((r) => (r.id === editingId ? built.reading : r));
  if (!commit({ ...state, readings, lastKind: built.reading.kind, unsaved: true })) return;
  resetForm();
  render();
  showStatus(isNew ? "Reading saved." : "Reading updated.");
});

$("dusting").addEventListener("click", () => {
  $("inches").value = String(DUSTING);
  showError("");
});

$("cancel").addEventListener("click", () => {
  resetForm();
  showStatus("");
});

$("delete").addEventListener("click", () => {
  if (!editingId || !confirm("Delete this reading?")) return;
  refreshState();
  const readings = state.readings.filter((r) => r.id !== editingId);
  if (!commit({ ...state, readings, unsaved: true })) return;
  resetForm();
  render();
  showStatus("Reading deleted.");
});

function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function backUp() {
  refreshState();
  const now = new Date();
  const json = JSON.stringify(makeBackup(state.readings, now), null, 2);
  const base = `snow-tracker-backup-${toLocalInputValue(now).slice(0, 10)}`;
  // Some phones won't share .json files, so offer a .txt copy of the same backup.
  const candidates = [
    new File([json], `${base}.json`, { type: "application/json" }),
    new File([json], `${base}.txt`, { type: "text/plain" }),
  ];
  const shareable = candidates.find((f) => navigator.canShare?.({ files: [f] }));
  let saved;
  try {
    if (shareable) {
      await navigator.share({ files: [shareable], title: "Snow Tracker backup" });
      saved = true;
    } else {
      download(candidates[0]);
      saved = confirm("Did the backup file save? Tap OK only if you can see it in your downloads.");
    }
  } catch (err) {
    if (err?.name !== "AbortError") showStatus(`Backup failed: ${err?.message ?? err}`);
    return;
  }
  if (!saved) {
    showStatus("Backup not confirmed. The reminder stays on until a backup is saved.");
    return;
  }
  refreshState();
  if (!commit({ ...state, unsaved: false, lastBackupAt: now.toISOString() })) return;
  render();
  showStatus(`Backed up ${JSON.parse(json).readings.length} readings.`);
}

$("backup").addEventListener("click", backUp);
$("banner-backup").addEventListener("click", backUp);

$("import").addEventListener("click", () => $("import-file").click());

$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  let text;
  try {
    text = await file.text();
  } catch {
    showStatus("Couldn't read that file.");
    return;
  }
  const parsed = parseBackup(text);
  if (!parsed.ok) {
    showStatus(parsed.error);
    return;
  }
  refreshState();
  const result = mergeReadings(state.readings, parsed.readings);
  const next = { ...state, readings: result.readings, unsaved: state.unsaved || result.added > 0 };
  if (!commit(next)) return;
  render();
  showStatus(
    `Imported ${result.added} readings. ${result.skipped} were already here ` +
      "(the versions on this phone were kept).",
  );
});

navigator.storage?.persist?.().catch(() => {});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

resetForm();
render();
