# 01: Entry + backup

## Goal
From his phone, Michael can record a snow reading in a few taps, fix or delete a
reading, and move all his data to a new phone.

## In scope
- Installable PWA that opens from the home screen on iPhone and Android.
- Add a reading: date/time (defaults to now, editable), inches in whole tenths or a
  Dusting button for 0.01 (D-5), a New/Total tag that defaults to the last one used (D-2), and an optional note
  (D-4).
- Multiple readings per day.
- List of readings, newest first.
- Edit and delete a reading.
- Data stored on the device and kept after closing the app or restarting the phone.
- Export all readings to a backup file via one-tap Back up (phone share sheet, falls
  back to a download where sharing files isn't supported).
- "Not backed up" banner whenever readings were added, edited or deleted since the last
  backup (D-6).
- Import a backup file (for example on a new phone). Import adds readings and skips
  ones already present; it never deletes.
- Works offline once installed (measuring outside may have poor signal).
- Published on GitHub Pages.

## Approach
- Plain HTML/CSS/JS, no framework, no build step, no packages (D-1).
- Readings kept in the browser's localStorage, with a request for persistent storage
  so the browser is less likely to clear it.
- A small service worker caches the app files so it opens offline.
- Data logic (validation, rounding, export/import format) lives in its own module so
  Deno can test it without a browser.
- Backup file is JSON with a format version number.

## Out of scope
- Graphs (03), image sharing (04), importing the Keep note (02).
- Accounts, sync, or any server-side storage.

## Open for this bucket
- Does the work Android's MDM allow installing a PWA? Test early.
