# snow_tracker

A phone-first log of snowfall that Michael measures by hand at his house with a ruler,
sometimes several times a day. It replaces a Google Keep note kept for several years.
Single user. Built as a PWA (installable web app) that works on iPhone and Android.

## Folder map
- `specs/`: one spec per bucket; `specs/README.md` is the index and status
- `verifier/`: testable criteria per bucket plus `DEFINITION_OF_DONE.md`
- `decisions/DECISIONS.md`: Verified / Proposed / Open decisions
- `reference/`: source material (old Keep data). Read it, never edit it.

## Hard constraints
- Must work on both iPhone and Android with no app store and no sideloading
  (the Android is a managed work phone).
- Data lives on the device only. No server stores any user's data, ever. Hosting
  serves static code only.
- Data must survive a phone change: export/import of a backup file is required.
- Readings are in decimal inches.
- Hobby project: keep it simple enough to finish and maintain.
- App store release would be a separate v2, not a v1 concern.

## Commands
TBD once bucket 1 picks the tooling (see decisions/DECISIONS.md).
