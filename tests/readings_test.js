import assert from "node:assert/strict";
import {
  DUSTING,
  formatInches,
  makeBackup,
  makeReading,
  mergeReadings,
  freshState,
  needsConfirm,
  parseBackup,
  parseInches,
  parseStoredState,
  sortNewestFirst,
  toLocalInputValue,
} from "../readings.js";

const base = { id: "a", takenAt: "2026-11-24T08:00:00Z", kind: "total", note: "" };

Deno.test("parseInches accepts whole tenths (E-05)", () => {
  assert.deepEqual(parseInches("2.5"), { ok: true, value: 2.5 });
  assert.deepEqual(parseInches("3"), { ok: true, value: 3 });
  assert.deepEqual(parseInches(".5"), { ok: true, value: 0.5 });
  assert.deepEqual(parseInches("0"), { ok: true, value: 0 });
  assert.deepEqual(parseInches(" 12.0 "), { ok: true, value: 12 });
});

Deno.test("parseInches accepts 0.01 as dusting (E-19)", () => {
  assert.deepEqual(parseInches("0.01"), { ok: true, value: DUSTING });
  assert.deepEqual(parseInches(".01"), { ok: true, value: DUSTING });
});

Deno.test("parseInches rejects invalid input (E-06)", () => {
  for (const bad of ["", "  ", "-1", "abc", "2.55", "0.02", "1e2", "2..5", "0.75"]) {
    const r = parseInches(bad);
    assert.equal(r.ok, false, `expected "${bad}" to be rejected`);
    assert.ok(r.error.length > 0);
  }
});

Deno.test("formatInches shows Dusting and one decimal", () => {
  assert.equal(formatInches(DUSTING), "Dusting");
  assert.equal(formatInches(2.5), '2.5"');
  assert.equal(formatInches(3), '3.0"');
});

Deno.test("makeReading builds a reading with kind and note (E-15, E-16)", () => {
  const r = makeReading({ ...base, inches: "1.2", note: "  heavy, wet " });
  assert.equal(r.ok, true);
  assert.deepEqual(r.reading, {
    id: "a",
    takenAt: "2026-11-24T08:00:00.000Z",
    inches: 1.2,
    kind: "total",
    note: "heavy, wet",
  });
  const noNote = makeReading({ ...base, inches: "1", note: undefined });
  assert.equal(noNote.reading.note, "");
});

Deno.test("makeReading rejects bad date and kind", () => {
  assert.equal(makeReading({ ...base, inches: "1", takenAt: "nope" }).ok, false);
  assert.equal(makeReading({ ...base, inches: "1", kind: "depth" }).ok, false);
});

Deno.test("sortNewestFirst orders by time, newest first (E-07)", () => {
  const list = [
    { ...base, id: "1", takenAt: "2026-11-24T08:00:00.000Z" },
    { ...base, id: "2", takenAt: "2026-11-24T16:00:00.000Z" },
    { ...base, id: "3", takenAt: "2026-11-23T12:00:00.000Z" },
  ];
  assert.deepEqual(sortNewestFirst(list).map((r) => r.id), ["2", "1", "3"]);
  assert.deepEqual(list.map((r) => r.id), ["1", "2", "3"], "input not mutated");
});

Deno.test("toLocalInputValue round-trips through local time", () => {
  const d = new Date(2026, 0, 5, 7, 3);
  assert.equal(toLocalInputValue(d), "2026-01-05T07:03");
  assert.equal(new Date(toLocalInputValue(d)).getTime(), d.getTime());
});

Deno.test("backup round-trips every reading exactly (E-11, E-12)", () => {
  const readings = [
    makeReading({ ...base, id: "x", inches: "0.01", kind: "new" }).reading,
    makeReading({ ...base, id: "y", inches: "4.5", note: "drifts" }).reading,
  ];
  const text = JSON.stringify(makeBackup(readings, new Date("2026-11-24T00:00:00Z")));
  const parsed = parseBackup(text);
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    sortNewestFirst(parsed.readings),
    sortNewestFirst(readings),
  );
});

Deno.test("parseBackup rejects files that aren't backups", () => {
  assert.equal(parseBackup("not json").ok, false);
  assert.equal(parseBackup("{}").ok, false);
  assert.equal(parseBackup('{"app":"snow_tracker","version":99,"readings":[]}').ok, false);
  const badReading = JSON.stringify({
    app: "snow_tracker",
    version: 1,
    readings: [{ ...base, inches: 2.55 }],
  });
  assert.equal(parseBackup(badReading).ok, false);
});

Deno.test("mergeReadings adds new, skips duplicates, never deletes (E-21)", () => {
  const existing = [
    { ...base, id: "1", inches: 1 },
    { ...base, id: "2", inches: 2 },
  ];
  const incoming = [
    { ...base, id: "2", inches: 99 },
    { ...base, id: "3", inches: 3 },
  ];
  const result = mergeReadings(existing, incoming);
  assert.equal(result.added, 1);
  assert.equal(result.skipped, 1);
  assert.deepEqual(result.readings.map((r) => [r.id, r.inches]), [
    ["1", 1],
    ["2", 2],
    ["3", 3],
  ]);
});

Deno.test("parseStoredState: empty storage is a fresh start", () => {
  assert.deepEqual(parseStoredState(null), { ok: true, state: freshState() });
  assert.deepEqual(parseStoredState(""), { ok: true, state: freshState() });
});

Deno.test("parseStoredState: unreadable or wrong-shape data is flagged (verifier #7)", () => {
  assert.equal(parseStoredState("{not json").ok, false);
  assert.equal(parseStoredState('{"readings":5}').ok, false);
  assert.equal(parseStoredState("null").ok, false);
  assert.equal(parseStoredState("[]").ok, false);
});

Deno.test("parseStoredState: keeps readings and repairs bad fields", () => {
  const r = parseStoredState(JSON.stringify({ readings: [{ id: "a" }], lastKind: "x", unsaved: "yes" }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.state.readings, [{ id: "a" }]);
  assert.equal(r.state.lastKind, "total");
  assert.equal(r.state.unsaved, false);
  assert.equal(r.state.rev, 0);
});

Deno.test("needsConfirm: double digits ask first (D-10)", () => {
  assert.equal(needsConfirm(9.9), false);
  assert.equal(needsConfirm(DUSTING), false);
  assert.equal(needsConfirm(10), true);
  assert.equal(needsConfirm(25), true);
});
