# Verifier: 01 Entry + backup

| ID | Check | Pass condition |
|----|-------|----------------|
| E-01 | Install on iPhone (Safari → Add to Home Screen) | Opens from home screen icon without browser UI |
| E-02 | Install on work Android (Chrome → Install) | Opens from home screen icon; or MDM block is documented as a finding |
| E-03 | Add a reading with default time | Saved with current date/time and entered inches |
| E-04 | Add a reading with a changed date/time | Saved with the chosen date/time |
| E-05 | Decimal input (e.g. 2.5) | Stored and shown as 2.5", not rounded or truncated |
| E-06 | Invalid input (blank, negative, letters) | Rejected with a clear message; nothing saved |
| E-07 | Several readings on the same day | All kept and listed, newest first |
| E-08 | Edit a reading | Change shows in the list and survives an app restart |
| E-09 | Delete a reading | Removed from the list and stays removed after restart |
| E-10 | Persistence | Readings still present after closing the app and restarting the phone |
| E-11 | Export | Produces a file containing every reading |
| E-12 | Import into a fresh install | All readings from the export appear, values and times identical |
| E-13 | No server storage | Network traffic shows no reading data leaving the device |
| E-14 | Automated tests | Test suite and linter/analyzer run clean; output shown |
