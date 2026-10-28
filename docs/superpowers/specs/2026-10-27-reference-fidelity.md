# Reference fidelity — visual refinement of existing Zaky

Baseline: `b44ac9efec9f33cf4a47d9f9b8033601535d731b`, clean `feature/kantor-3d-review`; remote verified at that SHA. User supplied the strict replication specification and the 75.229796 s, 1024×576, 30 FPS video. This increment refines the existing presentation. No changes to database/migrations/API/auth/business rules/routes/dashboard/standard mode/dependency versions.

## Frame analysis and matching criteria

Video sampled across the full duration at 1 FPS; original-resolution samples additionally extracted at 0,6,11,16,21,26,40.7,44.7,49.7,55.7,60.7,64.7,67.7,71.7,74.5 seconds. Measurements below refer to the 1024×576 source; original assets/font/source camera matrices are unavailable, so geometry and camera values are reconstructed from these observations.

| Time | Original composition | Existing Zaky equivalent | Interaction | Measurable target |
| --- | --- | --- | --- | --- |
| 0–4 s | Capsule nav x167,y8,w681,h40; copy begins x167,y174; cream tiled ground; narrow tall curved white building, orange ribbed tower, low right wing, curved entry road and vehicle; long right shadow | Institutional Zaky building; existing code lookup | Hero/search and chapter navigation | Header bounds ±10 px; text left edge ±8 px; building occupies right half, roof near y45–80; no clipping of orange tower |
| 5–8 s; sample6 | Almost frontal high-angle cutaway; long two-person counter, two visitors, orange three-seat rows, digital wall board and plants. Main orange figure stops at right side of counter. Text at x167,y130, contextual panel below | Existing reception form | Open existing receipt wizard | Counter horizontal; two officers and two occupied seating rows; 3-line heading; panel bottom above chapter nav |
| 10–13 s; sample11 | Camera translates right, less azimuth than exterior. Rear desk to right, front checking/partition area to left, pale green privacy screens | Existing mustahik/distribution preparation | Open existing draft form | Visually distinct room; desk/partition placement; character pauses near front left |
| 15–18 s; sample16 | Two narrow rooms divided by tall wall; separate rear processing counters and front inspection surfaces. Orange route enters right room | Existing independent witness units | Open real work queue | Two distinct work areas; divider and curved path; do not imply healthcare procedures |
| 20–23 s; sample21 | Broad colorful filing/supply wall behind long left counter; smaller right counter; waiting seats in front | Existing approval area and adjacent records | Open existing authorized work | Shelf grid, counters and seats match relative arrangement |
| 25–29 s; sample26 | Small rightward pan within SAME room; final counter, orange figure and adjacent shelf remain visible | Existing records/final summary | Open exact saved records | Shared final room, short pan instead of another room-width jump |
| 31–33 s | Two columns, left headline/CTA; illustrated route/map and floating status panel at right | Existing code tracking | Actual public verification endpoint | Same density and column proportions; illustration explicitly not GPS |
| 34–36 s | Four compact service cards beside short left copy | Existing four service links | Existing forms/verification | Card count/relative widths, cream image surfaces and circular icon treatments |
| 37–39 s | Three personnel cards with category pills above, left heading | Existing role directory (illustrations, no invented identities) | Existing category filter | Three visible columns, similar spacing; no fake ratings |
| 40.7 s | Modal x247,y53,w523,h470, sidebar154 (29.4%); dark sidebar with scene thumbnail; white 2-column option tiles; rounded pale surface | Existing receipt/distribution wizard step1 | Existing radio selection/Next | Dialog width51.1vw and height81.6vh at source viewport, ±18px; sidebar ratio29.4% ±2%; preserve existing behavior |
| 44.7 s | Sidebar remains fixed, selected cards and dense input controls, footer aligned bottom | Existing fund selection | Existing catalog only | Consistent modal frame across steps; content scrolls independently |
| 49.7 s | Dense 2-column form; small labels, white inputs, footerBack/Next | Existing receipt/draft fields | Original validation/upload | Similar field rhythm, no new appointment/medical/payment fields |
| 55.7 s | Review card, options and final confirmation | Existing review/acknowledgment | Original server-confirmed save | Keep real financial semantics; no pretend payment |
| 60.7 s | Orange completion icon, dark receipt header, real QR at right, print/calendar controls | Existing saved-record receipt | Existing QR/print/ICS | Same proportions and alignment; QR only after actual save |
| 64.7 s | Angled phone at right with small floating context card and orange road | Existing web preview | Existing mode links | Similar relative phone/card position; no app-store claims |
| 67.7 s | Three narrow plan cards and orange illustration to right, left headline | Existing three working modes | Mode links and comparison | Narrow cards, middle orange highlight; retain actual capabilities |
| 71.7 s | Three testimonial-like cards, metrics card, partner row | Existing trust/process cards | Docs/verification | Preserve visual hierarchy using process explanations, no invented endorsements/usage |
| 74.5 s | Wide rounded near-black CTA with orange winding road/building illustration at right; compact footer | Existing final CTA/footer | Existing mode navigation | Same broad dark surface, warm illustration and whitespace |

All desktop comparisons use identical 1024×576 viewport. Typography uses the existing licensed Plus Jakarta Sans; exact original font is unknown. Zaky headings use deliberate line breaks to match the source's 2/3-line rhythm. Source text, hospital-specific figures, payment and people are not copied as real Zaky data. Mobile is adapted to 390×844 since the video supplies no mobile reference.

## Reuse and exact edit boundaries

| Existing file | Why the edit is necessary | Preserved interface/behavior |
| --- | --- | --- |
| `src/components/journey/models.ts` | Refine geometry in the already mounted world builder: exterior, differentiated rooms, figures, furniture and route | `buildWorld()` and World desk/task/disposal contracts |
| `src/lib/office/journey.ts` | Replace constant-angle linear pan with documented visual keyframes and pauses | Presentation math only; chapter/station IDs and business rules untouched |
| `src/components/journey/scene.tsx` | Apply camera framing, light/shadow tracking, culling and deterministic character route | All existing props remain valid; optional chapter notification only |
| `src/components/journey/journey.tsx` | Align text with rendered chapter, reuse installed GSAP ScrollTrigger lifecycle; visual chapter attribute | Existing onStart callback, search/router and keyboard navigation |
| `src/components/journey/reference.css` and new `reference-match.css` | Keep three local base fixes small; isolate measured layout, proportions and landing-only wizard rules in an additional stylesheet | Local experience only; no global theme or shared form rule changes |
| `src/components/journey/reference-home.tsx` | Only if needed for a local visual element or original section proportions | Existing route targets, forms, state/API behavior retained |

Reuse: current WorkWizard/Receipt without changing their logic or public interfaces; current queue/detail, optional office wrapper/gateway, backend operations, existing font assets, Three.js and GSAP. New `service-art.tsx` provides four code-native illustrations; the shared `public/` reception thumbnail comes from the actual refined scene; the first-step building raster was withheld after automatic approval rejected its upload. Legacy landing's ScrollTrigger integration was inspected; its context/kill pattern is reused in the current isolated journey rather than modifying/remounting the legacy dashboard. Removing this refinement means reverting the visual-only commit(s); no data/schema rollback is needed.

## Acceptance and verification

- Capture before/after at all6 chapters and5 wizard states, supporting sections,390pxmobile,Standard and3D mode.
- Check heading/card/header bounds and overflow; camera stop/reverse/resize/reducedmotion, keyboard and WebGL fallback.
- Standard mode keeps zero WebGL canvases; stage navigation has no financial mutations.
- Existing SQL/HTTP and browser workflow regression suites pass; TypeScript, changed-code lint and production build run.
- Review important visual differences against exact source frames. List remaining reconstruction/asset differences explicitly; no pixel-perfect claim.
- Only feature branch push, small reviewable commits, expected-SHA guard, remote tree verification.
