# 01: Entry + backup

## Goal
From his phone, Michael can record a snow reading in a few taps, fix or delete a
reading, and move all his data to a new phone.

## In scope
- Installable PWA that opens from the home screen on iPhone and Android.
- Add a reading: date/time (defaults to now, editable) and depth in decimal inches.
- Multiple readings per day.
- List of readings, newest first.
- Edit and delete a reading.
- Data stored on the device and kept after closing the app or restarting the phone.
- Export all readings to a backup file the user saves wherever they like.
- Import a backup file (for example on a new phone).

## Out of scope
- Graphs (03), image sharing (04), importing the Keep note (02).
- Accounts, sync, or any server-side storage.

## Open for this bucket
- Measurement meaning: leaning toward current total depth in the yard (Proposed).
- Decimal precision (e.g. 0.1").
- Tooling/framework for the PWA: decide in the bucket plan, no new deps without discussion.
- Does the work Android's MDM allow installing a PWA? Test early.
