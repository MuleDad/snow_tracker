# Verifier: 01 Entry + backup

| ID | Check | Pass condition |
|----|-------|----------------|
| E-01 | Install on iPhone (Safari → Add to Home Screen) | Opens from home screen icon without browser UI |
| E-02 | Install on work Android (Chrome → Install) | Opens from home screen icon; or MDM block is documented as a finding |
| E-03 | Add a reading with default time | Saved with current date/time and entered inches |
| E-04 | Add a reading with a changed date/time | Saved with the chosen date/time |
| E-05 | Decimal input (e.g. 2.5) | Stored and shown as 2.5" |
| E-06 | Invalid input (blank, negative, letters, values that aren't whole tenths or 0.01, like 2.55 or 0.02) | Rejected with a clear message; nothing saved |
| E-19 | Dusting | Dusting button saves 0.01; typing 0.01 does the same; list shows "Dusting"; stored value is 0.01 so later totals (bucket 03) include it |
| E-20 | Backup reminder | Banner appears after any add/edit/delete since the last backup and clears after Back up |
| E-21 | Import never deletes | Importing into an app with existing readings keeps them all, adds new ones, skips duplicates |
| E-15 | New/Total tag | Each reading saves its tag; a new reading's tag defaults to the last one used |
| E-16 | Notes | A reading saves with or without a note; the note shows in the list and can be edited |
| E-17 | Offline | With the phone in airplane mode, the installed app opens and a reading can be added |
| E-18 | Pages | App loads from the GitHub Pages URL |
| E-07 | Several readings on the same day | All kept and listed, newest first |
| E-08 | Edit a reading | Change shows in the list and survives an app restart |
| E-09 | Delete a reading | Removed from the list and stays removed after restart |
| E-10 | Persistence | Readings still present after closing the app and restarting the phone |
| E-11 | Export | Produces a file containing every reading |
| E-12 | Import into a fresh install | All readings from the export appear, values and times identical |
| E-13 | No server storage | Network traffic shows no reading data leaving the device |
| E-14 | Automated tests | `deno test` and `deno lint` run clean; output shown |
