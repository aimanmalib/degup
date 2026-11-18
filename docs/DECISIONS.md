# Degup: design decisions

Public record of the decisions that shape this repo. Each entry: what was decided, why, and how to undo it.
Internal build notes (in Malay) are kept outside the public repo.

| # | Decision | Why | Undo |
|---|---|---|---|
| 1 | Degup is a heartbeat perception game: watch, feel, then bend your breathing | A short, playable question ("Can you feel your own heartbeat?") that shows the SDK signal reacting live | A count mode if the live signal is too sparse |
| 2 | Electron desktop app; the SDK runs on the user's laptop | The SDK's official Node path, with an official Electron sample | A web build only if the desktop path cannot work |
| 3 | Beat times come from `cardio.arterial_pressure_trace` with an in-repo peak detector | The SDK payload has no per-beat marker | A count mode that uses only the rate |
| 4 | The sync score is phase consistency (circular statistics), not delay or a tap count | A steady offset between beat and tap does not matter; consistency does | Show the plain n/N ratio instead |
| 5 | Three scenes, SEE first | The live signal is visible in the first seconds of a session | Reorder scenes with a new entry here |
| 6 | Only cardio and breathing metrics; no face, expression or EDA metrics; no Insights request | The game does not need them | None |
| 7 | Telemetry off; automatic Presage Insights disclosed in the consent screen, README and Data panel as something Degup cannot turn off | Matches the SDK privacy policy | If Presage adds an Insights switch, turn it off and update the text |
| 8 | Nothing is stored by default; the API key is kept with Electron `safeStorage` | Consent screen promises only what the code does | None |
| 9 | Fixtures are derived numbers only; no images or video of anyone in the repo | Biometric video stays off git | None |
| 10 | `@smartspectra/node-sdk` pinned to exactly `3.4.0` | The integration was tested against that version | Bump with a full gate run |
| 11 | One `metrics` listener that fans out inside the app | A second SDK listener replaces the first | None |
| 12 | Live, replay and simulation sources share one interface (`src/sumber/`); game logic in `src/core/` has no DOM or SDK | The same game can be tested on recorded and simulated numbers | None |
| 13 | All UI text in `lang/en.json` and `lang/ms.json` (same keys); tunable values in `config/app.json` | English and Malay from day one; values change without code edits | None |
| 14 | A word list test (`tests/kata-larangan.json`) blocks clinical-sounding wording in the UI and public docs, with a narrow allow list for the required consent text | Degup is a game, not a health product | Add a key to the allow list only with a new entry here |
| 15 | Animations use transform and opacity only | Animated filters crash some GPU and WebKit paths | None |
| 16 | Built-in demo recorder | Makes the demo video reproducible | Use the OS recorder |
| 17 | MIT licence | Simple reuse | None |
| 18 | Internal Malay notes are not tracked in the public repo; public measurements live in [`MEASUREMENTS.md`](MEASUREMENTS.md) | Reviewers read English; internal paths do not belong in a public repo | Track the notes again |

Credit: the "renderer owns the camera, main owns the window and permissions" pattern follows the official SmartSpectra
`electron-quickstart` sample.
