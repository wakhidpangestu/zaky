# Reference fidelity implementation plan

> **For agentic workers:** use superpowers:executing-plans for direct implementation. The user supplied the visual spec and explicitly instructed analysis → implementation → verification on the current branch.

**Goal:** Refine the existing Zaky journey against the actual video while freezing business/structure interfaces.
**Architecture:** Preserve the mounted journey and world builder. Apply measured keyframes and room-specific geometry; use local CSS for video layout and the landing's existing wizard. No backend changes.
**Tech Stack:** Existing Next16.4.3/React19.3/Three0.186/GSAP3.15; existing fonts and dependencies unchanged.
**Spec:** `docs/superpowers/specs/2026-10-27-reference-fidelity.md`.

## Global Constraints

Only `feature/kantor-3d-review`. No file removal/renaming/moving. No edits to DB, migration, API, auth, financial logic, dashboard or global tokens. Preserve `cacheComponents:true`/`partialPrefetching:true`. Reuse current state and operations; no fake proof or data.

## Review Focus

- Fast/reverse scroll: text must follow the rendered camera chapter, not leap ahead.
- Resizing and mobile: character/counter remain framed; no horizontal overflow.
- Hidden tab/WebGL loss: no leaked frames/resources; all actions retain keyboard alternatives.
- Clicking scene papers: preserve exact real task IDs; do not turn every object into one generic popup.
- Pure stage/mode navigation: no financial writes; Standard has no WebGL.

### Task1 — Baseline and camera timeline

- [x] Native-size video analysis, initial SHA/remote audit and component reuse inventory.
- [x] Run existing full browser suite before edits; current operational paths pass.
- [x] Capture baseline via `tests/experience/visual.mjs` at source viewport and mobile.
- [x] Update camera tests for keyframe holds, curved character path and short shared final-room pan; confirm RED.
- [x] Implement presentation-only keyframes in `src/lib/office/journey.ts`; verify GREEN.

### Task2 — World geometry and renderer

- [x] Refine `models.ts` using current helpers: rounded office facade/podium/ribbed tower/low wing/entry road; reception seating; private prep room; two witness areas; shared archive/records room.
- [x] Cache/reuse primitive geometry and materials; retain desk/task markers and disposal.
- [x] Apply camera/light framing and chapter sync in `scene.tsx`, GSAP lifecycle in `journey.tsx`. No public callback removed.
- [x] Capture all camera stops; compare counter/building scale and room composition to source; fix differences.

### Task3 — Local UI and wizard presentation

- [x] Correct capsule/header/copy/context/nav/supporting-section proportions with three small base fixes plus isolated `reference-match.css`; keep global/standard styles unchanged.
- [x] Use `.zj-home .zw-dialog` to reproduce modal frame/sidebar/steps/field surfaces/footer, retaining all existing form logic.
- [x] Add scene thumbnails from the actual new render under `public/` if needed; no new dependency.
- [x] Capture source-size wizard states and mobile; verify focus, Escape, filtering and links.

### Task4 — Verification, evidence and feature push

- [x] Existing domain/office/HTTP/browser suites, TypeScript, changed-code ESLint and build.
- [x] Financial invariance during pure navigation; Standard zero-canvas regression; exact task navigation.
- [x] Read-only independent review findings obtained (final review interrupted by quota); fix important motion finding with a regression and rerun checks.
- [x] Publish compact visual discrepancy/evidence report and remaining asset differences; validate restricted diff scope.
- [x] Prepare two commits containing only allowed visual/test/docs/assets files. Final delivery operation: expected-SHA guarded feature push and remote-tree verification; final response records its result.

Final verification and explicit remaining differences: `docs/evidence/reference-fidelity/README.md`.
