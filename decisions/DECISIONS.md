# Decisions

Verified = Michael confirmed. Proposed = Claude suggested, not confirmed. Open = unanswered.

## Verified
- **2026-11-23: Purpose.** Log snowfall measured by hand with a ruler at home, sometimes
  several times a day. Replaces a Google Keep note because it's hard to edit.
- **2026-11-23: Users.** Michael only. Results get shared as a picture with family.
- **2026-11-23: Platform.** Must work on iPhone and Android. The Android is a work phone,
  so no sideloading.
- **2026-11-23: Stack is a PWA.** Installable web app, no app store for v1. If it works
  out and a store release is wanted, that becomes v2.
- **2026-11-23: Data ownership.** Data stays on the device. No server stores anyone's
  data, including in any future store release.
- **2026-11-23: Backup.** Data must survive a phone change, so export/import of a backup
  file is part of bucket 1.
- **2026-11-23: Units.** Decimal inches.
- **2026-11-23: First bucket.** Entry (add/edit/delete) plus backup. Graphs come later.
- **2026-11-23: Old data source.** Google Keep (and a Google Sheet export).
- **2026-11-24: Public repo.** GitHub repo MuleDad/snow_tracker is public. Michael's
  historical readings in `reference/` are published as example data.
- **2026-11-24: Hosting.** GitHub Pages (free on a public repo), serving static code only.

## Proposed
- **2026-11-23: Measuring method.** Measure current total depth in the yard instead of
  clearing the deck between readings. Michael said "maybe"; confirm after trying it.
- **2026-11-23: Bucket order.** 01 entry + backup, 02 import Keep, 03 graphs, 04 share image.

## Open
- Keep export method: copy-paste note text into `reference/` vs Google Takeout.
- How to label the old deck readings (new snow since clearing) vs depth readings on import.
- Decimal precision for readings.
- PWA tooling/framework (decide in the bucket 01 plan).
- Whether the work Android's MDM allows installing a PWA.
- Whether a store release (v2) is actually wanted.

## Log
ID | Date | Status | Decision | Why / alternatives rejected
---|------|--------|----------|----------------------------
D-1 | 2026-11-24 | Verified | Bucket 01 tooling: plain HTML/CSS/JS, no framework, no build step, no npm packages. Deno 2.9.8 (already installed) runs tests and lint. Resolves Open "PWA tooling/framework". | Least to maintain; Pages serves files as-is. Rejected: installing Node + Vite (more moving parts), React/Svelte (overkill for a form and a list).
D-2 | 2026-11-24 | Verified | Each reading stores one value tagged New or Total; the tag defaults to the last one used. | Works whichever measuring method wins and matches the old CSV's New/Total columns. Rejected: total depth only (old New data won't fit), separate New and Total fields (more to fill in outside).
D-3 | 2026-11-24 | Verified | Readings are stored to one decimal place. Resolves Open "decimal precision". | Michael's choice. Rejected: two decimals, any decimals. Note: older values like 0.75 and 0.01 will need rounding in bucket 02.
D-4 | 2026-11-24 | Verified | Each reading has an optional free-text notes field. | Old CSV uses notes. Rejected: no notes.
D-5 | 2026-11-24 | Verified | Supersedes D-3. Readings are whole tenths of an inch, or exactly 0.01 meaning "Dusting". A Dusting button fills in 0.01 (typing 0.01 also works); the list shows "Dusting"; it counts as 0.01 in totals. | Shows it snowed without being significant, and old 0.01 readings import as-is. Rejected: typing 0.01 with no button.
D-6 | 2026-11-24 | Verified | Bucket 01 backup = a "not backed up" reminder plus one-tap Back up via the phone's share sheet. Automatic Google Drive sync (Michael's own Drive, no server of ours) becomes its own later bucket, after a second opinion. | Browsers can't silently save or reload files on phones. Rejected: reminder only, Drive sync in bucket 01 (too big, Google setup, work phone may block sign-in).
D-7 | 2026-11-24 | Proposed | Known effect of "import never deletes" (D-6 / spec 01): importing an older backup brings back readings deleted since, and a reading already on the phone keeps its phone version even if the backup has an edited one. The import message says so. | Raised by the bucket 01 verifier (#5). Alternative: a "replace everything" restore option, rejected for now because one wrong tap could wipe data.
