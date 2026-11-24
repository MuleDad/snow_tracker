import {
  DUSTING,
  formatInches,
  makeBackup,
  makeReading,
  mergeReadings,
  parseBackup,
  sortNewestFirst,
  toLocalInputValue,
} from "./readings.js";

const STORAGE_KEY = "snow_tracker.v1";

const $ = (id) => document.getElementById(id);
const form = $("entry-form");

const state = loadState();
let editingId = null;

function loadState() {
  const fresh = { readings: [], lastKind: "total", unsaved: false, lastBackupAt: null };
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    return { ...fresh, ...JSON.parse(raw) };
  } catch {
    // Keep the unreadable data aside rather than overwrite it.
    try {
      if (raw) localStorage.setItem(`${STORAGE_KEY}.unreadable`, raw);
    } catch { /* storage unavailable */ }
    alert("Saved readings could not be read. Import a backup to restore them.");
    return fresh;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showError("Could not save on this device. Back up now if you can.");
    return false;
  }
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

function markChanged() {
  state.unsaved = true;
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

  $("backup-banner").hidden = !(state.unsaved && state.readings.length > 0);
  $("last-backup").textContent = state.lastBackupAt
    ? `Last backup: ${fmt.format(new Date(state.lastBackupAt))}`
    : "Not backed up yet.";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const built = makeReading({
    id: editingId ?? crypto.randomUUID(),
    takenAt: $("taken-at").value,
    inches: $("inches").value,
    kind: selectedKind(),
    note: $("note").value,
  });
  if (!built.ok) {
    showError(built.error);
    return;
  }
  const wasEditing = editingId !== null;
  if (wasEditing) {
    state.readings = state.readings.map((r) => (r.id === editingId ? built.reading : r));
  } else {
    state.readings.push(built.reading);
  }
  state.lastKind = built.reading.kind;
  markChanged();
  if (!saveState()) return;
  resetForm();
  render();
  showStatus(wasEditing ? "Reading updated." : "Reading saved.");
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
  state.readings = state.readings.filter((r) => r.id !== editingId);
  markChanged();
  if (!saveState()) return;
  resetForm();
  render();
  showStatus("Reading deleted.");
});

async function backUp() {
  const now = new Date();
  const json = JSON.stringify(makeBackup(state.readings, now), null, 2);
  const name = `snow-tracker-backup-${toLocalInputValue(now).slice(0, 10)}.json`;
  const file = new File([json], name, { type: "application/json" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Snow Tracker backup" });
    } else {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  } catch (err) {
    if (err?.name !== "AbortError") showStatus(`Backup failed: ${err?.message ?? err}`);
    return;
  }
  state.unsaved = false;
  state.lastBackupAt = now.toISOString();
  saveState();
  render();
  showStatus(`Backed up ${state.readings.length} readings.`);
}

$("backup").addEventListener("click", backUp);
$("banner-backup").addEventListener("click", backUp);

$("import").addEventListener("click", () => $("import-file").click());

$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  const parsed = parseBackup(await file.text());
  if (!parsed.ok) {
    showStatus(parsed.error);
    return;
  }
  const result = mergeReadings(state.readings, parsed.readings);
  state.readings = result.readings;
  if (result.added > 0) markChanged();
  if (!saveState()) return;
  render();
  showStatus(`Imported ${result.added} readings, skipped ${result.skipped} already here.`);
});

navigator.storage?.persist?.().catch(() => {});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

resetForm();
render();
