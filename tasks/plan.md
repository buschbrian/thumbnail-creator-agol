# Implementation Plan: ArcGIS Thumbnail Production System

## Overview

Evolve the current single-thumbnail editor into a client-only ArcGIS thumbnail
production system for two primary users:

- GIS authors can build, save, reopen, validate, and export a polished thumbnail
  quickly without design expertise.
- GIS administrators can import public organization branding, distribute
  governed template packs, and review consistent batches without introducing a
  backend, authentication, or ArcGIS write operations.

The work is deliberately ordered around a shared, versioned `DesignSnapshot`
contract. Project files, custom templates, deterministic variations, and batch
exports must use the same representation. This avoids four independent formats
and keeps the existing Zustand/zundo history boundary intact.

## Product Outcomes

1. A first-time GIS author can create and export a compliant thumbnail in under
   five minutes.
2. A repeat author can reopen a portable project and continue without losing
   uploaded imagery.
3. An administrator can import an eligible public ArcGIS organization theme and
   produce a portable, governed template pack.
4. A GIS team can generate and review up to 50 public-item thumbnails in one
   client-side batch.
5. Every export continues to match the document pixel size exactly, excludes
   editor chrome, and contains the effective alt text metadata.

## Non-Goals and Constraints

- No backend, cloud persistence, collaborative editing, authentication, tokens,
  or ArcGIS write operations.
- The brand kit remains the only localStorage entry. Projects and template packs
  are explicitly downloaded/imported files.
- ArcGIS integration remains anonymous public read-only access.
- Remote imagery is fetched as a blob/data URL before canvas use so export is
  never tainted.
- No open-ended generative image service in these phases. “Design assist” means
  deterministic, explainable variations built from local templates and rules.
- Calcite remains the UI system and Konva remains the canvas renderer.

## Architecture Decisions

### 1. One portable design contract

Introduce a versioned `DesignSnapshot` containing the document, background
color, and layers. Keep it structurally aligned with the current zundo history
slice, but do not add project persistence to the editor store. Project/template
codecs validate untrusted JSON and embed portable image assets at the file
boundary.

### 2. Pure builders around the existing store

Refactor template and AGOL generation logic so pure functions return a
`DesignSnapshot`. Preserve thin adapters that apply the result through existing
store actions. Batch generation and variation previews must never cycle the
visible editor store through many temporary documents.

### 3. Model-driven offscreen export

Keep `performExport` as the single interactive export path, but extract a lower
level renderer that accepts a `DesignSnapshot`. The renderer must create an
offscreen content layer with no guides, transformers, or UI chrome. Single and
batch export use the same implementation.

### 4. Version every portable organizational artifact

Brand kits, design projects, and template packs use separate discriminated
formats and explicit versions. Brand-kit v1 remains importable. Foreign JSON is
rejected with user-readable errors rather than partially applied.

### 5. Governance is metadata, not a second renderer

Template packs add slot roles, locked properties, approval metadata, and pack
identity around ordinary layer drafts. The same `LayerNode`, property panels,
and export renderer remain authoritative.

### 6. Quality checks are pure rules

Contrast, safe-area, text-density, logo-size, missing-title, and asset warnings
are pure functions over a `DesignSnapshot`. The editor, AGOL-card preview, batch
review, and export panel consume the same results.

## Dependency Graph

```text
DesignSnapshot + codecs
    ├── Portable project import/export
    ├── Governed template-pack format
    │       └── Approved template gallery
    ├── Pure AGOL/template builders
    │       ├── Deterministic variations
    │       └── Batch orchestration
    └── Model-driven offscreen renderer
            └── Batch ZIP export

Multi-selection state
    ├── Multi-node canvas transforms
    ├── Align/distribute
    └── Grouping

Foreground image layer
    └── Crop/focal-point mode

Brand kit v2
    ├── Semantic role editor + contrast
    ├── Public ArcGIS organization import
    └── Governed template defaults

Quality rule engine
    ├── Canvas safe-area guides
    ├── AGOL context preview
    ├── Batch review warnings
    └── Variation scoring
```

## Task List

Detailed acceptance criteria, dependencies, verification commands, and likely
files are recorded in [`tasks/todo.md`](./todo.md).

### Phase 1: Safety and Portability

- [x] T01 Fix the left Brand panel’s responsive overflow
- [x] T02 Introduce the versioned `DesignSnapshot` contract
- [ ] T03 Export a portable project with embedded image assets
- [ ] T04 Import and validate a portable project
- [ ] T05 Protect edited designs from destructive replacement

### Checkpoint A: Safe Single-Item Workflow

- [x] Brand controls are usable without horizontal scrolling at 1024×768
- [ ] A design with local imagery survives an export/import round trip
- [ ] Destructive project and template actions require explicit confirmation
- [ ] Repository Definition of Done and all four project checks pass

### Phase 2: Core Editor Productivity

- [ ] T06 Duplicate a selected layer
- [ ] T07 Copy and paste layers within the editor
- [ ] T08 Add multi-selection to editor state and the layer list
- [ ] T09 Transform multiple selected canvas nodes
- [ ] T10 Align and distribute selected layers
- [ ] T11 Lock layers against edits and deletion
- [ ] T12 Add group data/store operations
- [ ] T13 Render and inspect grouped layers
- [ ] T14 Add a foreground image layer and insertion flow
- [ ] T15 Render foreground images with crop and focal-point properties
- [ ] T16 Add interactive image crop mode

### Checkpoint B: Credible Design Editor

- [ ] Duplicate, copy/paste, multi-select, align, lock, and grouping work with undo
- [ ] Foreground images can be replaced, positioned, cropped, and exported safely
- [ ] Existing templates and exact-pixel exports remain unchanged
- [ ] Keyboard and pointer workflows have browser coverage

### Phase 3: Quality and AGOL Context

- [ ] T17 Build the shared thumbnail quality-rule engine
- [ ] T18 Surface quality findings in the export/review UI
- [ ] T19 Add optional safe-area guides to the guides layer
- [ ] T20 Add AGOL gallery/search/list context previews
- [ ] T21 Close responsive and accessibility gaps in the editor shell

### Checkpoint C: Reviewable Output

- [ ] The same deterministic rules appear in editor, preview, and export contexts
- [ ] Guides never appear in exported pixels
- [ ] The primary workflow is keyboard reachable with a logical heading structure
- [ ] Common laptop viewport checks pass without clipped primary actions

### Phase 4: Administrator Branding and Theme Import

- [ ] T22 Add brand-kit v2 semantic roles and v1 migration
- [ ] T23 Add semantic brand-role editing and contrast feedback
- [ ] T24 Establish public ArcGIS organization/theme fixtures and feasibility matrix
- [ ] T25 Parse organization URLs and fetch anonymous portal metadata
- [ ] T26 Convert supported portal/shared-theme data into brand-kit v2
- [ ] T27 Add the organization-theme import workflow

### Checkpoint D: Public Organization Import

- [ ] Eligible public organizations import name, logo, and supported theme colors
- [ ] Private/unsupported organizations fail safely with file-import guidance
- [ ] Imported logos are portable data URLs and never taint export
- [ ] No token, credential, write endpoint, or additional persistence is introduced

### Phase 5: Governed Template Packs and Library Depth

- [ ] T28 Define and validate the template-pack format
- [ ] T29 Save the current design as a reusable template
- [ ] T30 Import/export template packs and merge them into the gallery
- [ ] T31 Enforce locked layers and editable slot roles
- [ ] T32 Add pack identity and approval status to the gallery
- [ ] T33 Expand map, layer, imagery, and dataset layout families
- [ ] T34 Expand app, dashboard, and story layout families
- [ ] T35 Expand scene, survey, and essential layout families

### Checkpoint E: Governed Self-Service

- [ ] An administrator can distribute one file containing approved templates
- [ ] An author can edit declared slots without breaking locked brand properties
- [ ] Every template has a generated preview, valid icon, and quality-rule result
- [ ] Each major AGOL category has multiple meaningfully different layout families

### Phase 6: Batch Production

- [ ] T36 Make AGOL thumbnail generation return a pure design snapshot
- [ ] T37 Render/export a design snapshot without the visible editor stage
- [ ] T38 Parse pasted IDs, URLs, and CSV batch inputs
- [ ] T39 Fetch public item metadata through a bounded cancellable queue
- [ ] T40 Orchestrate batch generation and quality evaluation
- [ ] T41 Add the batch input and review workspace
- [ ] T42 Add per-item layout/brand overrides and editor handoff
- [ ] T43 Export a ZIP with images and an alt-text manifest
- [ ] T44 Verify batch limits, cancellation, memory cleanup, and error recovery

### Checkpoint F: Batch Release

- [ ] A mixed batch of 50 public items can be reviewed without freezing the UI
- [ ] One failed/private item does not abort successful rows
- [ ] ZIP filenames, dimensions, formats, and manifest records are deterministic
- [ ] Object URLs and offscreen stages are released after generation/export

### Phase 7: Deterministic Design Assist and Performance

- [ ] T45 Score layout recommendations from item metadata and design constraints
- [ ] T46 Generate four explainable branded variations without mutating the editor
- [ ] T47 Add variation preview, rationale, and apply interactions
- [ ] T48 Split large lazy feature surfaces and record bundle budgets
- [ ] T49 Run the release-level accessibility, performance, documentation, and regression gate

### Checkpoint G: Production-System Release

- [ ] Suggestions are deterministic and explain why a layout was recommended
- [ ] Applying a variation creates one undoable editor change
- [ ] Initial editor load excludes batch and administrator-only feature chunks
- [ ] All task acceptance criteria and the standing Definition of Done are satisfied
- [ ] Human review approves release readiness

## Recommended Delivery Order

Start with T01–T05. They repair the visible administrator issue, establish the
shared data contract, and make subsequent work recoverable. Continue with the
quality engine (T17) immediately after the core editor model work if administrator
import becomes the nearer-term priority; it has few dependencies and benefits
every later surface.

Do not start batch UI work before T36 and T37. Do not expand templates before
T28 defines the portable pack contract, or the built-in and imported template
systems will diverge.

## Parallelization Opportunities

After T02 is merged:

- T03–T05 can be developed independently with coordination on the snapshot codec.
- T06–T07 and T14 can run separately from multi-selection work.
- T17–T20 can proceed in parallel after the quality finding interface is agreed.
- T24–T27 can proceed separately from template-pack work after brand-kit v2 lands.
- T33–T35 are independent template waves after T28–T32.
- T38–T39 can run in parallel after the batch row contract is agreed.
- T45 and T48 are independent once their respective foundations exist.

Sequential chains that should not be split are T08→T09→T10→T12→T13,
T22→T23→T26→T27, T28→T29→T30→T31→T32, and T36→T37→T40→T41→T43.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Public portal responses omit shared-theme fields for some organizations | High | T24 creates real response fixtures and an explicit support matrix before UI implementation; retain file/logo extraction fallback |
| Portable projects become very large when images are embedded | Medium | Enforce per-asset and total-file warnings, downscale only with user-visible disclosure, and test realistic limits |
| New group/image layer types break exhaustive layer handling | High | Add discriminated-union tests and update renderer, properties, list, store, templates, project codec, and quality rules in ordered slices |
| Batch generation exhausts browser memory | High | Default cap 50, concurrency 4, model-driven rendering, cancellation, and immediate object-URL/stage cleanup |
| Template governance makes the editor frustrating | Medium | Lock individual properties/slots rather than the whole design and provide clear lock explanations |
| Quality checks produce noisy or subjective warnings | Medium | Keep rules deterministic, dismissible, severity-ranked, and supported by unit fixtures |
| Main bundle continues to grow | Medium | Preserve lazy modal loading, make batch/admin workspaces lazy, and add an explicit initial-chunk budget in T48 |
| Project/schema migrations lose user content | High | Never mutate source input; validate first, migrate to a new in-memory object, and keep v1 fixtures in regression tests |

## Working Assumptions

- Desktop/laptop editing is primary; 1024×768 is the minimum fully supported
  editing viewport. Narrow phones may receive a constrained preview/export mode
  rather than the full three-pane editor.
- Batch v1 accepts no more than 50 rows and fetches at most four items at once.
- Built-in templates and imported packs use the same template definition after
  validation, but only built-ins may reference generated Calcite icon IDs unless
  the pack embeds a permitted raster asset.
- Project and pack imports are treated as untrusted data and may not contain
  executable markup, external scripts, tokens, or arbitrary network directives.
- The first design-assist release is rules-based; external AI requires a separate
  architecture/security decision.

## Open Questions for Human Review

- Should phone-sized viewports support editing, or only preview/export?
- Is a 50-item batch sufficient for the first release, or is 100 a hard requirement?
- Should governed template locks be absolute for authors, or locally unlockable
  with a warning?
- Which real public ArcGIS Online and Enterprise organizations may be retained as
  sanitized test fixtures for theme-import compatibility?
- Is portable project fidelity more important than small project-file size when
  a background image is very large?
