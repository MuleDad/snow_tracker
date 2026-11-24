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
