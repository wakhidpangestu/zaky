# Reference fidelity verification

This increment resumes the existing application at `b44ac9e` on [feature/kantor-3d-review](https://github.com/wakhidpangestu/zaky/tree/feature/kantor-3d-review). It changes the presentation, its regression coverage and evidence. Database migrations, financial rules, authentication, APIs, routes, the standard dashboard and dependency versions have no changes.

The supplied 75.229796-second, 1024×576, 30 FPS video was inspected across its full duration. The [timestamp matrix and component inventory](../../superpowers/specs/2026-10-27-reference-fidelity.md) and [implementation plan](../../superpowers/plans/2026-10-27-reference-fidelity.md) record the source observations and edit boundaries.

## Evidence

Visual comparisons and the interaction recording are delivered privately with this review, rather than published in the repository. The comparison package contains `before-after.jpg`, `scenes-1.jpg`, `scenes-2.jpg`, `wizard.jpg`, `supporting.jpg` and `responsive.jpg`, plus these measurements and the timestamp specification. Video frames are on the left and browser captures are on the right. The saved-record QR comes from the isolated test database, not a production transaction.

The 66.3-second recording runs at original interaction speed, encoded at 960×540/20 FPS. Screenshots and the recording precede the final first-step thumbnail adjustment described below; other application geometry/layout is unchanged. Browser developer overlays alone are hidden during captures.

[Final measurements](measurements.json) and [baseline measurements](baseline-measurements.json) remain in the repository. Automatic approval rejected publishing several screenshots and the recording to GitHub because of possible application/test-account disclosure. These are excluded from the Git tree. The runtime uses the approved reception thumbnail throughout the wizard; the first-step building thumbnail is withheld, while the actual 3D hero building remains implemented in code.

## Measured layout

Tolerances were defined before implementation in the spec. Values below use the source viewport, 1024×576. Source values are measured from the video frame; browser values come from DOM bounds.

| Feature | Video | Before | After | Result |
| --- | --- | --- | --- | --- |
| Header x / y | 167 / 8 px | 32 / 23 px | 171.52 / 7.98 px | Within 10 px |
| Header width / height | 681 / 40 px | 960 / 64.5 px | 680.95 / 39.98 px | Within 10 px |
| Hero copy left | 167 px | 32 px | 166.91 px | Within 8 px |
| Modal x / y | 247 / 53 px | Not recorded in baseline JSON | 250.38 / 52.98 px | Within 18 px |
| Modal width / height | 523 / 470 px | See before screenshot | 523.25 / 470.02 px | Within 18 px |
| Sidebar share | 29.4% | See before screenshot | 29.40% | Within 2 percentage points |
| Page overflow | None | None | None at 390, 820, 1024 and 1440 px | Pass |

## Visual discrepancies and corrections

| Reference time | Evidence | Difference found | Impact / corrective action | Verified result and remaining difference |
| --- | --- | --- | --- | --- |
| 0 s | scenes-1 | Header too wide; copy too far left; generic building silhouette | High: measured capsule/copy bounds; seven window bands, rounded facade, ribbed orange tower, podium, low wing, curved road and van | Layout tolerances pass. Roof/tower placement and window density corrected after comparison. Facade details, vegetation, vehicle and shadows remain procedural reconstructions. |
| 6 s | scenes-1 | Interior was framed like the exterior; zoom multiplied its lateral offset | High: frontal interior camera, zoom-independent frustum shift, long counter, two officers, visitors and two seating rows | Counter remains in frame. Source character anatomy, furniture detail and exact object spacing are approximate. |
| 11 s | scenes-1 | Rooms were insufficiently differentiated | High: checking area, rear preparation desk and pale green privacy screens | Distinct preparation environment; actual distribution form retained. |
| 16 s | scenes-2 | Verification area lacked the two-part spatial composition | High: divider, independent desks and front document inspection surface | Two areas and curved route are visible. Medical activity is adapted to witness work. |
| 21 / 26 s | scenes-2 | Final stage jumped to another room | High: shared archive/records room, shelves and two counters, short final pan | Pure camera tests confirm the final target moves less than 8 world units. Counter dimensions and seated figures remain approximate. |
| 32–38 s | supporting | Services/roles were too large and sparse | Medium: narrow centered sections, four illustrated services, three role cards and filters | Counts and visual hierarchy reproduced. Role illustrations replace unavailable portraits; no fictional staff or ratings. |
| 40.7–60.7 s | wizard | Oversized modal; sidebar proportion, field rhythm and completion footer differed | High: locally scoped modal dimensions, a shared reception thumbnail, compact fields, fixed split, scroll containment | All five states captured; first-step thumbnail now uses the approved reception image; final button fits; focus/Escape, real save and QR pass. Option counts and field content follow the existing Zaky process, so source healthcare/date/payment controls are deliberately absent. |
| 64.7–74.5 s | supporting | Missing density in mode/process sections | Medium: angled web preview, three mode cards plus parcel art, three process cards plus facts and category row, dark final CTA | Full sequence captured. Original product illustrations/partner graphics are unavailable; existing Zaky capabilities replace marketing claims. |
| Transitions | interaction.mp4 | Continuous drift, forward-facing reverse travel, residual turning under reduced motion | High: deterministic holds, curved travel, actual travel direction, reduced-motion heading snap and idle rendering | Eight camera/motion tests pass. Timing is reconstructed from scroll keyframes; the source browser's exact scroll velocity is unknown. |

The existing licensed Plus Jakarta Sans is used; the original typeface, models, textures and animation rigs were not supplied. No pixel-perfect or numerical similarity percentage is claimed. The video supplies no mobile layout, so mobile and tablet are adaptations.

## Regression results

| Check | Result |
| --- | --- |
| `npm run test:office` | 81/81 pass, including 8 camera/motion tests |
| `npm run test:all` | Pass: domain, cryptography, locking, attack, network and concurrency checks |
| Visual browser harness | Pass: six chapters, seven supporting sections, five modal states, mobile/tablet/wide desktop, no runtime page errors |
| Financial invariance | Pass: pure scene/modal navigation and Standard/3D switching leave balances and receipt count unchanged |
| Standard mode | Pass: zero WebGL canvases; shared authorized data retained |
| Full browser workflow | 9/9 groups pass on a fresh normal run; diagnostic run also passes |
| HTTP workflow suite | 5/5 groups pass: auth/origin, receipt replay/privacy, evidence/assignment/handoff/independent witnesses/approval, recipient confirmation and realtime presence/catalog search |
| TypeScript / changed-code ESLint | Pass |
| Full repository ESLint | Existing baseline remains: 77 errors and 129 warnings; changed files pass |
| Next production build | Pass: Next16.4.3/Turbopack, TypeScript and 31 static pages; Cache Components and Partial Prefetching retained |

One earlier browser run received HTTP 503 from the workflow catalog during distribution setup. Both the diagnostic rerun and a subsequent fresh normal run completed all nine groups; no business/API change was made to conceal the failure. The fixture uses PGlite's socket multiplexer rather than a production PostgreSQL server; the cause of that isolated response has not been established.

A read-only independent reviewer identified residual avatar rotation under reduced motion. A failing regression was added, the renderer was corrected, and the regression now passes. Reverse travel facing was also corrected. The reviewer reported no prohibited business/schema/API edits, but its final review was interrupted by tool quota; this is not represented as an unconditional review approval.

Scene draw calls at the six settled stops are 768, 444, 563, 515, 503 and 485, including shadow passes. Primitive geometry/materials are shared, distant rooms are culled, rendering stops when settled/hidden and resources/listeners/observers are disposed. No FPS guarantee is inferred from the software-rendered test browser.

## Reproduction and delivery

Run `node tests/experience/visual.mjs` with an installed Playwright Chromium. `ZAKY_RECORD_VIDEO=true` also records the desktop session. `BROWSER_EXECUTABLE_PATH` supports an alternate Chromium; `ZAKY_FRESH_TEST_CACHE=true` isolates an incompatible prior dev cache. `ZAKY_SQL_TRACE=true` enables protocol diagnostics only in the isolated test fixture.

The delivery is split into camera/world/motion and local presentation/evidence commits. Only the existing feature branch is eligible for the final expected-SHA guarded update; `main` is untouched. The final response records the pushed commit after remote SHA/tree verification.
