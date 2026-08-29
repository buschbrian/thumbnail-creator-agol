# ArcGIS Thumbnail Production System — Executable Task List

Every task must satisfy its acceptance criteria and the repository-wide
Definition of Done. At each checkpoint run:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Run `npm run test:e2e` whenever a task changes visible browser behavior.

## Phase 1: Safety and Portability

## T01: Fix Brand panel responsive overflow

**Description:** Make administrator brand controls usable in the existing left
dock at the minimum supported 1024×768 viewport.

**Acceptance criteria:**
- [x] No horizontal scrollbar appears inside the Brand panel at 1024×768 or 1280×720.
- [x] Section labels, import-mode controls, and Share Kit actions remain visible and operable.
- [x] Existing template, element, text, and canvas tabs retain their current layout.

**Verification:**
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] Browser check at 1024×768 and 1280×720 with an empty and populated brand kit.

**Dependencies:** None

**Files likely touched:**
- `src/theme.css`
- `src/panels/BrandPanel.tsx`
- `e2e/thumbnail.spec.ts`

**Estimated scope:** S

## T02: Introduce the versioned DesignSnapshot contract

**Description:** Define the one portable design representation used by project
files, template packs, variations, and batch operations.

**Acceptance criteria:**
- [x] Version 1 represents `doc`, `backgroundColor`, and the full discriminated layer union.
- [x] Runtime validation rejects malformed versions, dimensions, colors, layer IDs, and unsafe image sources.
- [x] The current editor state converts to/from a snapshot without changing zundo history partialization.

**Verification:**
- [x] `npm test -- src/project/schema.test.ts src/state/store.test.ts`
- [x] `npm run typecheck`
- [x] Unit round trip covers every current layer type.

**Dependencies:** None

**Files likely touched:**
- `src/state/types.ts`
- `src/state/store.ts`
- `src/project/schema.ts`
- `src/project/schema.test.ts`
- `src/state/store.test.ts`

**Estimated scope:** M

## T03: Export a portable project with embedded assets

**Description:** Download the current design as validated JSON while converting
blob-backed images into portable data URLs at the file boundary.

**Acceptance criteria:**
- [ ] Project export includes the versioned snapshot and no `blob:` URLs.
- [ ] PNG/JPEG foreground, logo, and background assets survive serialization.
- [ ] Oversized assets produce a clear warning before download rather than silently failing.

**Verification:**
- [ ] `npm test -- src/project/exportProject.test.ts`
- [ ] `npm run typecheck`
- [ ] Manual project download contains no object URL and does not alter editor state/history.

**Dependencies:** T02

**Files likely touched:**
- `src/project/assetCodec.ts`
- `src/project/exportProject.ts`
- `src/project/exportProject.test.ts`
- `src/panels/TopBar.tsx`

**Estimated scope:** M

## T04: Import and validate a portable project

**Description:** Open a downloaded project file, validate it atomically, and
apply it as one editor/history transition.

**Acceptance criteria:**
- [ ] Valid projects restore document metadata, background color, layers, and embedded imagery.
- [ ] Invalid/foreign JSON leaves the current design untouched and shows a useful error.
- [ ] Importing a project creates one undoable change and clears selection safely.

**Verification:**
- [ ] `npm test -- src/project/importProject.test.ts src/project/schema.test.ts`
- [ ] `npm run test:e2e -- --grep "project round trip"`
- [ ] Manual export/import reproduces visible pixels and alt text.

**Dependencies:** T02, T03

**Files likely touched:**
- `src/project/importProject.ts`
- `src/project/importProject.test.ts`
- `src/panels/TopBar.tsx`
- `e2e/thumbnail.spec.ts`

**Estimated scope:** M

## T05: Protect edited designs from destructive replacement

**Description:** Track whether the current design differs from its last blank,
imported, or exported project baseline and guard replacing operations.

**Acceptance criteria:**
- [ ] Applying a template or importing another project after edits opens one confirmation dialog.
- [ ] Cancel preserves all document and history state; confirm performs exactly one replacement.
- [ ] Blank/unmodified designs retain the current one-click template flow.

**Verification:**
- [ ] `npm test -- src/state/store.test.ts src/ui/uiStore.test.ts`
- [ ] `npm run test:e2e -- --grep "replacement confirmation"`
- [ ] Browser check covers template apply, project import, cancel, and confirm.

**Dependencies:** T02, T04

**Files likely touched:**
- `src/state/store.ts`
- `src/ui/uiStore.ts`
- `src/panels/TemplateGallery.tsx`
- `src/panels/TopBar.tsx`
- `src/App.tsx`

**Estimated scope:** M

## Checkpoint A: Safe Single-Item Workflow

- [ ] T01–T05 acceptance criteria are complete.
- [ ] Lint, typecheck, unit tests, build, and e2e tests pass.
- [ ] Project round trip is reviewed manually with text, shape, icon, logo, and background layers.
- [ ] Human review approves Phase 2 work.

## Phase 2: Core Editor Productivity

## T06: Duplicate a selected layer

**Description:** Add a predictable duplicate action with a small positional
offset, new ID, preserved styling, and one history entry.

**Acceptance criteria:**
- [ ] Duplicate works from the layer list and `Ctrl+D` when focus is not in an input.
- [ ] The copy is selected, receives a unique ID/name, and appears directly above the source.
- [ ] Undo/redo treats duplication as one operation.

**Verification:**
- [ ] `npm test -- src/state/store.test.ts src/hooks/useKeyboardShortcuts.test.ts`
- [ ] `npm run test:e2e -- --grep "duplicate layer"`
- [ ] Manual check covers every layer type except the managed background image.

**Dependencies:** T02

**Files likely touched:**
- `src/state/store.ts`
- `src/state/store.test.ts`
- `src/hooks/useKeyboardShortcuts.ts`
- `src/panels/LayersList.tsx`

**Estimated scope:** M

## T07: Copy and paste layers within the editor

**Description:** Add a local, schema-validated layer clipboard that never reads
or writes sensitive system clipboard contents implicitly.

**Acceptance criteria:**
- [ ] `Ctrl+C`/`Ctrl+V` copies selected layers with new IDs and incremental offsets.
- [ ] Pasting after a document-size change clamps the copy within a recoverable canvas area.
- [ ] Input fields retain native text copy/paste behavior.

**Verification:**
- [ ] `npm test -- src/state/layerClipboard.test.ts src/hooks/useKeyboardShortcuts.test.ts`
- [ ] `npm run test:e2e -- --grep "copy and paste layers"`
- [ ] Manual input-field regression check.

**Dependencies:** T02, T06

**Files likely touched:**
- `src/state/layerClipboard.ts`
- `src/state/layerClipboard.test.ts`
- `src/state/store.ts`
- `src/hooks/useKeyboardShortcuts.ts`

**Estimated scope:** M

## T08: Add multi-selection to editor state and the layer list

**Description:** Preserve a primary selected layer while adding an ordered set of
selected IDs for shift-click and additive selection.

**Acceptance criteria:**
- [ ] Click selects one layer; Shift-click toggles additional unlocked visible layers.
- [ ] The layer list exposes all selected rows and one primary row for the properties panel.
- [ ] Removing, hiding, replacing, or undoing layers removes stale selection IDs.

**Verification:**
- [ ] `npm test -- src/state/store.test.ts`
- [ ] `npm run test:e2e -- --grep "multi-select layer list"`
- [ ] `npm run typecheck`

**Dependencies:** T02

**Files likely touched:**
- `src/state/store.ts`
- `src/state/store.test.ts`
- `src/panels/LayersList.tsx`
- `src/theme.css`

**Estimated scope:** M

## T09: Transform multiple selected canvas nodes

**Description:** Connect multi-selection to the Konva transformer while
committing one final store update per completed drag/transform.

**Acceptance criteria:**
- [ ] Shift-click on canvas matches layer-list selection semantics.
- [ ] Dragging or scaling a multi-selection preserves relative placement and commits once.
- [ ] Guides/transformer remain outside the content layer and exports remain unchanged.

**Verification:**
- [ ] `npm run test:e2e -- --grep "multi-node transform"`
- [ ] `npm run typecheck`
- [ ] Browser check confirms one undo returns every transformed layer.

**Dependencies:** T08

**Files likely touched:**
- `src/canvas/EditorCanvas.tsx`
- `src/canvas/LayerNode.tsx`
- `src/state/store.ts`
- `e2e/thumbnail.spec.ts`

**Estimated scope:** M

## T10: Align and distribute selected layers

**Description:** Provide exact geometry operations for common Canva-style layout
cleanup without adding a second coordinate system.

**Acceptance criteria:**
- [ ] Align left/center/right/top/middle/bottom works for two or more selections.
- [ ] Horizontal/vertical distribution is enabled only for three or more selections.
- [ ] Each command is deterministic, skips locked layers, and creates one history entry.

**Verification:**
- [ ] `npm test -- src/state/geometry.test.ts src/state/store.test.ts`
- [ ] `npm run test:e2e -- --grep "align and distribute"`
- [ ] Manual pixel-position check at 600×400 and 1200×800.

**Dependencies:** T08, T09

**Files likely touched:**
- `src/state/geometry.ts`
- `src/state/geometry.test.ts`
- `src/state/store.ts`
- `src/canvas/SelectionToolbar.tsx`
- `src/canvas/EditorCanvas.tsx`

**Estimated scope:** M

## T11: Lock layers against edits and deletion

**Description:** Add a layer lock flag enforced by store operations, canvas
selection/transforms, keyboard deletion, and layer-list actions.

**Acceptance criteria:**
- [ ] Locked layers cannot be dragged, transformed, deleted, hidden, or edited through normal author controls.
- [ ] Lock/unlock is explicit in the layer list and undoable.
- [ ] Export renders locked layers identically to unlocked layers.

**Verification:**
- [ ] `npm test -- src/state/store.test.ts`
- [ ] `npm run test:e2e -- --grep "locked layer"`
- [ ] `npm run typecheck`

**Dependencies:** T08

**Files likely touched:**
- `src/state/types.ts`
- `src/state/store.ts`
- `src/state/store.test.ts`
- `src/panels/LayersList.tsx`
- `src/canvas/LayerNode.tsx`

**Estimated scope:** M

## T12: Add group data and store operations

**Description:** Extend the layer discriminated union with a group that owns an
ordered child list and supports atomic group/ungroup operations.

**Acceptance criteria:**
- [ ] Grouping two or more selected layers preserves their absolute visible positions.
- [ ] Ungrouping restores child order and positions without pixel drift.
- [ ] Project/schema validation detects cycles, duplicate child IDs, and invalid nesting.

**Verification:**
- [ ] `npm test -- src/state/store.test.ts src/project/schema.test.ts`
- [ ] `npm run typecheck`
- [ ] Unit tests cover group/ungroup round trips and undo/redo.

**Dependencies:** T02, T08, T10

**Files likely touched:**
- `src/state/types.ts`
- `src/state/store.ts`
- `src/state/store.test.ts`
- `src/project/schema.ts`
- `src/project/schema.test.ts`

**Estimated scope:** M

## T13: Render and inspect grouped layers

**Description:** Make groups selectable, transformable, visible in the layer
tree, and editable through a minimal group inspector.

**Acceptance criteria:**
- [ ] Groups render children in order and transform as one Konva node.
- [ ] The layer list exposes expandable group children with correct accessibility roles.
- [ ] Group visibility, opacity, lock state, and naming work without bypassing child rules.

**Verification:**
- [ ] `npm run test:e2e -- --grep "group layers"`
- [ ] `npm run typecheck`
- [ ] Exported pixels before grouping and immediately after grouping are identical.

**Dependencies:** T11, T12

**Files likely touched:**
- `src/canvas/LayerNode.tsx`
- `src/canvas/EditorCanvas.tsx`
- `src/panels/LayersList.tsx`
- `src/panels/PropertiesPanel.tsx`
- `e2e/thumbnail.spec.ts`

**Estimated scope:** M

## T14: Add a foreground image layer and insertion flow

**Description:** Introduce an editable image layer distinct from the managed
background-image layer.

**Acceptance criteria:**
- [ ] Users can insert a supported local raster image as a foreground layer.
- [ ] Initial sizing preserves aspect ratio, fits within the document, and selects the new layer.
- [ ] The new layer is handled exhaustively by project files, layer removal/reorder, and alt-text generation.

**Verification:**
- [ ] `npm test -- src/state/store.test.ts src/export/altText.test.ts src/project/schema.test.ts`
- [ ] `npm run typecheck`
- [ ] Manual insertion check with portrait, landscape, transparent PNG, and invalid file.

**Dependencies:** T02

**Files likely touched:**
- `src/state/types.ts`
- `src/state/store.ts`
- `src/state/store.test.ts`
- `src/panels/LeftPanel.tsx`
- `src/export/altText.ts`

**Estimated scope:** M

## T15: Render foreground images with crop and focal-point properties

**Description:** Render image layers with cover/contain behavior and explicit
normalized focal-point data that scales with document resizing.

**Acceptance criteria:**
- [ ] Cover, contain, and stretch modes render predictably inside layer bounds.
- [ ] Focal X/Y values remain normalized and survive project round trips.
- [ ] Replace image preserves the layer’s geometry while updating natural dimensions safely.

**Verification:**
- [ ] `npm test -- src/canvas/imageGeometry.test.ts src/project/schema.test.ts`
- [ ] `npm run typecheck`
- [ ] Browser screenshot checks cover each fit mode and an off-center focal point.

**Dependencies:** T14

**Files likely touched:**
- `src/canvas/LayerNode.tsx`
- `src/canvas/imageGeometry.ts`
- `src/canvas/imageGeometry.test.ts`
- `src/panels/PropertiesPanel.tsx`
- `src/state/types.ts`

**Estimated scope:** M

## T16: Add interactive image crop mode

**Description:** Let authors reposition the source image within fixed layer
bounds while clearly distinguishing crop mode from normal layer transforms.

**Acceptance criteria:**
- [ ] Double-clicking an image enters crop mode; Escape/click-away exits and commits once.
- [ ] Crop handles and overlays live only in the guides layer.
- [ ] Undo restores the previous crop/focal point and exported pixels exclude crop UI.

**Verification:**
- [ ] `npm run test:e2e -- --grep "crop foreground image"`
- [ ] `npm run typecheck`
- [ ] Manual export comparison confirms zero crop chrome at all zoom levels.

**Dependencies:** T09, T15

**Files likely touched:**
- `src/canvas/EditorCanvas.tsx`
- `src/canvas/LayerNode.tsx`
- `src/canvas/ImageCropOverlay.tsx`
- `src/ui/uiStore.ts`
- `e2e/thumbnail.spec.ts`

**Estimated scope:** M

## Checkpoint B: Credible Design Editor

- [ ] T06–T16 acceptance criteria are complete.
- [ ] All project checks and browser tests pass.
- [ ] Every new layer/group branch is exhaustively handled.
- [ ] Human review approves the core editor interaction model.

## Phase 3: Quality and AGOL Context

## T17: Build the shared thumbnail quality-rule engine

**Description:** Produce deterministic, severity-ranked findings from a design
snapshot without depending on React, Konva, or browser state.

**Acceptance criteria:**
- [ ] Rules cover missing title, text density, text size, contrast, safe area, logo size, and image-load state.
- [ ] Findings include stable codes, affected layer IDs, severity, and corrective guidance.
- [ ] Representative good and bad snapshots are unit-tested with no subjective randomness.

**Verification:**
- [ ] `npm test -- src/quality/rules.test.ts`
- [ ] `npm run typecheck`
- [ ] Test fixtures cover each finding and its non-triggering boundary.

**Dependencies:** T02, T14

**Files likely touched:**
- `src/quality/types.ts`
- `src/quality/rules.ts`
- `src/quality/rules.test.ts`
- `src/brand/colorMath.ts`

**Estimated scope:** M

## T18: Surface quality findings in the export UI

**Description:** Add one compact review surface that combines existing dimension
warnings with the shared quality findings.

**Acceptance criteria:**
- [ ] Export shows error/warning/info counts and affected layer names.
- [ ] Selecting an actionable finding selects the corresponding editable layer.
- [ ] Findings never block export unless output would be invalid or inaccessible.

**Verification:**
- [ ] `npm test -- src/quality/rules.test.ts src/export/validation.test.ts`
- [ ] `npm run test:e2e -- --grep "quality findings"`
- [ ] Browser check confirms no duplicated/conflicting warning text.

**Dependencies:** T17

**Files likely touched:**
- `src/panels/QualityFindings.tsx`
- `src/panels/ExportPanel.tsx`
- `src/theme.css`
- `e2e/thumbnail.spec.ts`

**Estimated scope:** M

## T19: Add optional safe-area guides

**Description:** Visualize AGOL card crop/safe regions without adding anything to
the exported content layer.

**Acceptance criteria:**
- [ ] Authors can toggle safe-area and center guides independently.
- [ ] Guides scale with document/zoom and do not intercept canvas selection.
- [ ] Export comparison proves guides never change output bytes/pixels.

**Verification:**
- [ ] `npm run test:e2e -- --grep "safe area guides"`
- [ ] `npm test -- src/export/exportImage.test.ts`
- [ ] Manual check at every size preset.

**Dependencies:** T17

**Files likely touched:**
- `src/canvas/EditorCanvas.tsx`
- `src/canvas/SafeAreaGuides.tsx`
- `src/ui/uiStore.ts`
- `src/theme.css`

**Estimated scope:** M

## T20: Add AGOL context previews

**Description:** Preview the current thumbnail at realistic gallery, search, and
compact-list sizes with surrounding neutral item-card chrome.

**Acceptance criteria:**
- [ ] Preview modes reuse the export renderer and never add preview chrome to the design.
- [ ] Each mode shows representative title/type context and current quality findings.
- [ ] Preview refreshes after edits without creating editor history entries.

**Verification:**
- [ ] `npm run test:e2e -- --grep "AGOL context preview"`
- [ ] `npm run typecheck`
- [ ] Visual check at 100%, high-DPI, and 1024×768.

**Dependencies:** T17, T18

**Files likely touched:**
- `src/preview/AgolContextPreview.tsx`
- `src/preview/PreviewDialog.tsx`
- `src/panels/TopBar.tsx`
- `src/setupCalcite.ts`
- `src/theme.css`

**Estimated scope:** M

## T21: Close responsive and accessibility gaps in the editor shell

**Description:** Establish a coherent heading structure, reliable focus order,
accessible selection announcements, and minimum-viewport behavior.

**Acceptance criteria:**
- [ ] The application has one accessible H1 and ordered section headings.
- [ ] Selection, dialog, crop, and preview focus behavior is keyboard operable and restored on close.
- [ ] Primary actions remain visible at 1024×768; narrower behavior is explicitly constrained.

**Verification:**
- [ ] `npm run test:e2e -- --grep "accessibility|minimum viewport"`
- [ ] Browser accessibility-tree and keyboard-only walkthrough.
- [ ] Console contains no errors or warnings during the walkthrough.

**Dependencies:** T01, T09, T16, T20

**Files likely touched:**
- `src/App.tsx`
- `src/theme.css`
- `e2e/accessibility.spec.ts`

**Estimated scope:** M

## Checkpoint C: Reviewable Output

- [ ] T17–T21 acceptance criteria are complete.
- [ ] Quality findings agree across editor, preview, and export.
- [ ] Guides are absent from exact-pixel exports.
- [ ] Human review approves rule severity and wording.

## Phase 4: Administrator Branding and Theme Import

## T22: Add brand-kit v2 semantic roles and v1 migration

**Description:** Evolve the brand artifact from a loose color list into semantic
roles while preserving every valid v1 import.

**Acceptance criteria:**
- [ ] V2 supports primary, secondary, accent, surface, text, and optional status roles plus logo/name.
- [ ] V1 files migrate deterministically without altering the original input object.
- [ ] Unknown versions and unsafe logo sources are rejected atomically.

**Verification:**
- [ ] `npm test -- src/brand/parseColors.test.ts src/brand/brandStore.test.ts`
- [ ] `npm run typecheck`
- [ ] V1 and v2 round-trip fixtures remain in regression tests.

**Dependencies:** T02

**Files likely touched:**
- `src/brand/types.ts`
- `src/brand/parseColors.ts`
- `src/brand/parseColors.test.ts`
- `src/brand/brandStore.ts`
- `src/brand/brandStore.test.ts`

**Estimated scope:** M

## T23: Add semantic brand-role editing and contrast feedback

**Description:** Let administrators assign imported colors to roles and see
legibility results before applying them to templates.

**Acceptance criteria:**
- [ ] Every semantic role can be assigned, cleared, and previewed from the Brand panel.
- [ ] Text/surface and primary/on-primary pairs show WCAG contrast ratios and pass/fail guidance.
- [ ] Role edits persist only through the existing brand-kit store entry and export in v2.

**Verification:**
- [ ] `npm test -- src/brand/brandStore.test.ts src/brand/colorMath.test.ts`
- [ ] `npm run test:e2e -- --grep "semantic brand roles"`
- [ ] Browser check with light, dark, and intentionally failing palettes.

**Dependencies:** T01, T22

**Files likely touched:**
- `src/panels/BrandPanel.tsx`
- `src/panels/BrandRoleRow.tsx`
- `src/brand/colorMath.ts`
- `src/brand/colorMath.test.ts`
- `src/theme.css`

**Estimated scope:** M

## T24: Establish public ArcGIS theme fixtures and feasibility matrix

**Description:** Fail fast on the highest-risk integration by documenting which
anonymous portal responses expose usable organization/shared-theme data.

**Acceptance criteria:**
- [ ] Sanitized fixtures cover public AGOL, public Enterprise, private/limited, and malformed responses.
- [ ] A compatibility document records fields, CORS behavior, logo URLs, and fallback behavior.
- [ ] No test depends on a live organization or stores tokens/private response data.

**Verification:**
- [ ] Fixture JSON parses with the planned portal response validator.
- [ ] Security/privacy review confirms fixtures contain no credentials or personal data.
- [ ] Human reviews the compatibility matrix before T25–T27 implementation.

**Dependencies:** T22

**Files likely touched:**
- `docs/arcgis-theme-import.md`
- `src/agol/__fixtures__/portal-public-agol.json`
- `src/agol/__fixtures__/portal-public-enterprise.json`
- `src/agol/__fixtures__/portal-limited.json`
- `src/agol/__fixtures__/portal-malformed.json`

**Estimated scope:** M

## T25: Parse organization URLs and fetch anonymous portal metadata

**Description:** Accept an organization base/home URL and read only the supported
public portal endpoint with strict URL and response validation.

**Acceptance criteria:**
- [ ] AGOL and Enterprise sub-path URLs normalize to the correct public portal metadata endpoint.
- [ ] Non-HTTPS remote hosts, credential-bearing URLs, and unrelated domains are rejected.
- [ ] ArcGIS error, CORS, timeout, and malformed JSON responses return useful typed errors.

**Verification:**
- [ ] `npm test -- src/agol/parsePortalInput.test.ts src/agol/fetchPortalInfo.test.ts`
- [ ] `npm run typecheck`
- [ ] Tests use T24 fixtures and mocked fetch only.

**Dependencies:** T24

**Files likely touched:**
- `src/agol/parsePortalInput.ts`
- `src/agol/parsePortalInput.test.ts`
- `src/agol/fetchPortalInfo.ts`
- `src/agol/fetchPortalInfo.test.ts`

**Estimated scope:** M

## T26: Convert supported portal theme data into brand-kit v2

**Description:** Map public organization/theme fields into semantic brand roles
without retaining raw portal responses.

**Acceptance criteria:**
- [ ] Supported colors, organization name, and logo map deterministically into a proposed v2 kit.
- [ ] Logo retrieval uses blob/data-URL conversion and enforces image limits.
- [ ] Missing fields yield a partial proposal with explicit warnings, not invented colors.

**Verification:**
- [ ] `npm test -- src/agol/importPortalTheme.test.ts`
- [ ] `npm run typecheck`
- [ ] All T24 fixtures produce the documented proposal/warning result.

**Dependencies:** T23, T25

**Files likely touched:**
- `src/agol/importPortalTheme.ts`
- `src/agol/importPortalTheme.test.ts`
- `src/brand/image.ts`
- `src/brand/types.ts`

**Estimated scope:** M

## T27: Add the organization-theme import workflow

**Description:** Add a Brand-panel workflow that previews a proposed imported kit
before replacing or appending existing organization branding.

**Acceptance criteria:**
- [ ] Paste URL → Fetch → Preview → Apply is explicit and cancellable.
- [ ] Preview lists imported roles, logo, omissions, contrast issues, and replace/append impact.
- [ ] Apply creates one brand-store update and never changes the current design automatically.

**Verification:**
- [ ] `npm run test:e2e -- --grep "organization theme import"`
- [ ] `npm run typecheck`
- [ ] Browser check covers success, partial theme, CORS/private fallback, cancel, and retry.

**Dependencies:** T26

**Files likely touched:**
- `src/panels/OrganizationThemeDialog.tsx`
- `src/panels/BrandPanel.tsx`
- `src/ui/uiStore.ts`
- `src/setupCalcite.ts`
- `e2e/brand.spec.ts`

**Estimated scope:** M

## Checkpoint D: Public Organization Import

- [ ] T22–T27 acceptance criteria are complete.
- [ ] Anonymous-read and no-persistence constraints are verified in review.
- [ ] Import failures preserve the existing brand kit.
- [ ] Human approves the supported portal matrix.

## Phase 5: Governed Template Packs and Library Depth

## T28: Define and validate the template-pack format

**Description:** Create a versioned portable pack containing identity, templates,
slot/lock metadata, optional embedded assets, and approval state.

**Acceptance criteria:**
- [ ] The codec rejects duplicate IDs, invalid layer drafts, unsafe assets, unknown versions, and missing pack identity.
- [ ] Valid packs round trip without losing semantic brand-role references.
- [ ] Existing built-in templates adapt to the same normalized definition after validation.

**Verification:**
- [ ] `npm test -- src/templates/templatePack.test.ts src/templates/templates.test.ts`
- [ ] `npm run typecheck`
- [ ] Test fixtures cover valid, invalid, and future-version packs.

**Dependencies:** T02, T17, T22

**Files likely touched:**
- `src/templates/templatePack.ts`
- `src/templates/templatePack.test.ts`
- `src/templates/templateKit.ts`
- `src/templates/templates.ts`

**Estimated scope:** M

## T29: Save the current design as a reusable template

**Description:** Convert the current snapshot into a named template definition
with a generated preview and explicit author-editable slots.

**Acceptance criteria:**
- [ ] Save flow requires template name/category and at least one editable slot.
- [ ] Embedded imagery is made portable using the project asset codec.
- [ ] Saving does not alter the current design or editor history.

**Verification:**
- [ ] `npm test -- src/templates/createTemplate.test.ts`
- [ ] `npm run test:e2e -- --grep "save as template"`
- [ ] Manual application of the new template reproduces visible pixels before slot edits.

**Dependencies:** T03, T28

**Files likely touched:**
- `src/templates/createTemplate.ts`
- `src/templates/createTemplate.test.ts`
- `src/panels/SaveTemplateDialog.tsx`
- `src/ui/uiStore.ts`

**Estimated scope:** M

## T30: Import and export template packs

**Description:** Let administrators combine session templates into a portable
pack and let authors import validated packs into the current browser session.

**Acceptance criteria:**
- [ ] Pack export downloads one portable file with deterministic IDs/order.
- [ ] Pack import previews conflicts and supports skip or replace per template ID.
- [ ] Imported templates appear in the gallery for the session without new localStorage keys.

**Verification:**
- [ ] `npm test -- src/templates/templateRegistry.test.ts src/templates/templatePack.test.ts`
- [ ] `npm run test:e2e -- --grep "template pack import"`
- [ ] Reload confirms imported packs do not persist unless re-imported.

**Dependencies:** T29

**Files likely touched:**
- `src/templates/templateRegistry.ts`
- `src/templates/templateRegistry.test.ts`
- `src/panels/TemplatePackDialog.tsx`
- `src/panels/TemplateGallery.tsx`
- `src/ui/uiStore.ts`

**Estimated scope:** M

## T31: Enforce locked layers and editable slot roles

**Description:** Apply template governance to normal store/property operations
without introducing a second editor implementation.

**Acceptance criteria:**
- [ ] Slot metadata declares which content/properties authors may edit.
- [ ] Locked template properties are enforced in store actions and explained in the inspector.
- [ ] Applying an ungoverned built-in template retains current unrestricted behavior.

**Verification:**
- [ ] `npm test -- src/state/store.test.ts src/templates/templatePack.test.ts`
- [ ] `npm run test:e2e -- --grep "governed template"`
- [ ] Attempted keyboard, canvas, and property-panel bypasses are covered.

**Dependencies:** T11, T28, T30

**Files likely touched:**
- `src/state/types.ts`
- `src/state/store.ts`
- `src/state/store.test.ts`
- `src/panels/PropertiesPanel.tsx`
- `src/panels/LayersList.tsx`

**Estimated scope:** M

## T32: Show pack identity and approval status in the gallery

**Description:** Make it obvious which templates are built-in, imported,
organization-approved, or experimental.

**Acceptance criteria:**
- [ ] Gallery cards expose source pack, version, approval badge, and slot count accessibly.
- [ ] Filters support built-in/imported/approved plus existing item categories.
- [ ] Search includes pack name and template description without slowing initial render materially.

**Verification:**
- [ ] `npm test -- src/templates/templateRegistry.test.ts src/templates/templates.test.ts`
- [ ] `npm run test:e2e -- --grep "template source filters"`
- [ ] Browser visual check with at least two packs and conflicting categories.

**Dependencies:** T30, T31

**Files likely touched:**
- `src/panels/TemplateGallery.tsx`
- `src/templates/TemplateThumb.tsx`
- `src/templates/templateRegistry.ts`
- `src/templates/templates.test.ts`
- `src/theme.css`

**Estimated scope:** M

## T33: Expand map, layer, imagery, and dataset layout families

**Description:** Add meaningfully different GIS-first compositions rather than
color-only variants.

**Acceptance criteria:**
- [ ] Web map, feature layer, imagery, and dataset each have at least four layout families total.
- [ ] Layouts include photo/map-led, icon-led, minimal, and data-led compositions where appropriate.
- [ ] Every template passes icon-catalog, schema, preview, and quality-rule tests.

**Verification:**
- [ ] `npm test -- src/templates/templates.test.ts src/quality/rules.test.ts`
- [ ] `npm run test:e2e -- --grep "map template families"`
- [ ] Human visual review at card size, not only canvas size.

**Dependencies:** T28, T32

**Files likely touched:**
- `src/templates/templatesItemsA.ts`
- `src/templates/templatesItemsB.ts`
- `src/templates/templates.test.ts`
- `src/templates/TemplateThumb.tsx`

**Estimated scope:** M

## T34: Expand app, dashboard, and story layout families

**Description:** Add application-oriented templates emphasizing product identity,
key metrics, and narrative hierarchy.

**Acceptance criteria:**
- [ ] Apps, dashboards, and story maps each have at least four layout families total.
- [ ] Dashboard templates support concise metric/subject slots without implying live data rendering.
- [ ] Every template passes schema, preview, icon, and quality-rule tests.

**Verification:**
- [ ] `npm test -- src/templates/templates.test.ts src/quality/rules.test.ts`
- [ ] `npm run test:e2e -- --grep "app template families"`
- [ ] Human visual review at AGOL gallery/search sizes.

**Dependencies:** T28, T32

**Files likely touched:**
- `src/templates/templatesItemsA.ts`
- `src/templates/templatesItemsB.ts`
- `src/templates/templates.test.ts`
- `src/templates/TemplateThumb.tsx`

**Estimated scope:** M

## T35: Expand scene, survey, and essential layout families

**Description:** Complete library depth for 3D, field-data, and cross-item use
cases while keeping designs simple at thumbnail size.

**Acceptance criteria:**
- [ ] Scenes and surveys each have at least four layout families total.
- [ ] Essentials include reusable logo-corner, map-background, icon-badge, text-minimal, and data-highlight systems.
- [ ] Every template passes schema, preview, icon, and quality-rule tests.

**Verification:**
- [ ] `npm test -- src/templates/templates.test.ts src/quality/rules.test.ts`
- [ ] `npm run test:e2e -- --grep "scene survey essential templates"`
- [ ] Human visual review at AGOL gallery/search sizes.

**Dependencies:** T28, T32

**Files likely touched:**
- `src/templates/templatesItemsB.ts`
- `src/templates/templatesEssentials.ts`
- `src/templates/templates.test.ts`
- `src/templates/TemplateThumb.tsx`

**Estimated scope:** M

## Checkpoint E: Governed Self-Service

- [ ] T28–T35 acceptance criteria are complete.
- [ ] Imported packs are session-only and validated as untrusted files.
- [ ] Locks cannot be bypassed through supported editor operations.
- [ ] Human approves template depth and governance usability.

## Phase 6: Batch Production

## T36: Make AGOL generation return a pure design snapshot

**Description:** Separate metadata-to-design decisions from store mutation while
preserving the current From URL flow through a thin adapter.

**Acceptance criteria:**
- [ ] Pure builder accepts source info, template choice, brand snapshot, and options, then returns a design snapshot/result.
- [ ] Existing single-item generation produces equivalent layers, metadata, tinting, and optional background behavior.
- [ ] The pure path never reads or writes Zustand stores.

**Verification:**
- [ ] `npm test -- src/agol/buildFromAgol.test.ts src/agol/generateFromAgol.test.ts`
- [ ] `npm run typecheck`
- [ ] Snapshot equivalence test covers every mapping rule.

**Dependencies:** T02, T17, T28

**Files likely touched:**
- `src/agol/buildFromAgol.ts`
- `src/agol/buildFromAgol.test.ts`
- `src/agol/generateFromAgol.ts`
- `src/agol/generateFromAgol.test.ts`

**Estimated scope:** M

## T37: Render and export a snapshot without the visible stage

**Description:** Extract a model-driven offscreen renderer shared by single and
batch export while preserving `performExport` as the interactive entry point.

**Acceptance criteria:**
- [ ] Renderer accepts a validated snapshot and returns exact-size PNG/JPEG output.
- [ ] Alt metadata, fonts, image loading, background fill, and guide exclusion match current export.
- [ ] Offscreen stages and object URLs are destroyed on success and failure.

**Verification:**
- [ ] `npm test -- src/export/renderSnapshot.test.ts src/export/metadata.test.ts`
- [ ] `npm run test:e2e -- --grep "model-driven export"`
- [ ] Pixel/metadata regression compares existing interactive export with snapshot export.

**Dependencies:** T15, T17, T36

**Files likely touched:**
- `src/export/renderSnapshot.ts`
- `src/export/renderSnapshot.test.ts`
- `src/export/exportImage.ts`
- `src/export/exportNow.ts`

**Estimated scope:** M

## T38: Parse pasted IDs, URLs, and CSV batch inputs

**Description:** Normalize supported batch sources into ordered rows with stable
IDs and row-level validation errors.

**Acceptance criteria:**
- [ ] Parser supports one-per-line IDs/URLs and CSV columns for item, title override, template, and brand mode.
- [ ] Duplicate rows are identified without silently removing intentional duplicates.
- [ ] Input is capped at the configured limit before any network request begins.

**Verification:**
- [ ] `npm test -- src/batch/parseBatchInput.test.ts`
- [ ] `npm run typecheck`
- [ ] Fixtures cover quoted CSV, blank rows, duplicates, bad IDs, and mixed portals.

**Dependencies:** T25

**Files likely touched:**
- `src/batch/types.ts`
- `src/batch/parseBatchInput.ts`
- `src/batch/parseBatchInput.test.ts`

**Estimated scope:** M

## T39: Fetch batch metadata through a bounded cancellable queue

**Description:** Reuse public fetch logic with concurrency control, cancellation,
progress, and isolated row failures.

**Acceptance criteria:**
- [ ] Default concurrency is four and can be lowered without changing row order.
- [ ] Cancellation stops scheduling new requests and marks unfinished rows predictably.
- [ ] One timeout/private/error row does not fail successful rows.

**Verification:**
- [ ] `npm test -- src/batch/fetchQueue.test.ts`
- [ ] `npm run typecheck`
- [ ] Fake-timer tests cover concurrency, cancellation, timeout, retry, and stable ordering.

**Dependencies:** T38

**Files likely touched:**
- `src/batch/fetchQueue.ts`
- `src/batch/fetchQueue.test.ts`
- `src/agol/fetchInfo.ts`

**Estimated scope:** M

## T40: Orchestrate batch generation and quality evaluation

**Description:** Turn fetched rows into independent snapshots, previews, and
quality findings without touching visible editor state.

**Acceptance criteria:**
- [ ] Each successful row records source info, chosen template, snapshot, findings, and status.
- [ ] Regeneration after a row override affects only that row.
- [ ] Processing is deterministic for identical input, brand kit, and template registry.

**Verification:**
- [ ] `npm test -- src/batch/generateBatch.test.ts`
- [ ] `npm run typecheck`
- [ ] Unit test covers mixed success, partial theme, missing image, and override regeneration.

**Dependencies:** T36, T38, T39

**Files likely touched:**
- `src/batch/generateBatch.ts`
- `src/batch/generateBatch.test.ts`
- `src/batch/types.ts`
- `src/quality/rules.ts`

**Estimated scope:** M

## T41: Add the batch input and review workspace

**Description:** Add a lazy-loaded workspace for input, fetch progress, thumbnail
review, filtering, and row-level status.

**Acceptance criteria:**
- [ ] Users can paste/upload input, review parsed rows, start/cancel generation, and filter by status/finding.
- [ ] Progress is announced accessibly and the main editor remains responsive.
- [ ] Failed rows show retryable errors while successful rows retain previews.

**Verification:**
- [ ] `npm run test:e2e -- --grep "batch workspace"`
- [ ] `npm run typecheck`
- [ ] Browser check at 1024×768 and with 50 mocked rows.

**Dependencies:** T20, T40

**Files likely touched:**
- `src/batch/BatchWorkspace.tsx`
- `src/batch/BatchInput.tsx`
- `src/App.tsx`
- `src/ui/uiStore.ts`
- `src/theme.css`

**Estimated scope:** M

## T42: Add per-item overrides and editor handoff

**Description:** Let authors change a row’s layout/brand options or open one
snapshot in the full editor without losing the batch session.

**Acceptance criteria:**
- [ ] Template, title, thumbnail-background, and brand tint overrides regenerate only the selected row.
- [ ] “Edit in editor” loads one snapshot with a return-to-batch path and replacement confirmation.
- [ ] Returning updates only that row after explicit save-back confirmation.

**Verification:**
- [ ] `npm run test:e2e -- --grep "batch row override|editor handoff"`
- [ ] `npm test -- src/batch/generateBatch.test.ts`
- [ ] Manual undo/history check confirms batch changes do not pollute editor history.

**Dependencies:** T05, T31, T41

**Files likely touched:**
- `src/batch/BatchReviewGrid.tsx`
- `src/batch/BatchRowActions.tsx`
- `src/App.tsx`
- `src/ui/uiStore.ts`
- `src/batch/generateBatch.test.ts`

**Estimated scope:** M

## T43: Export a ZIP with images and an alt-text manifest

**Description:** Export successful reviewed rows as one deterministic archive
containing images and a machine/human-readable manifest.

**Acceptance criteria:**
- [ ] ZIP includes exact-size images plus CSV/JSON manifest fields for source ID, filename, alt text, status, and findings.
- [ ] Filename collisions are resolved deterministically and failures remain listed in the manifest.
- [ ] Archive generation reports progress, supports cancellation before download, and releases intermediate blobs.

**Verification:**
- [ ] `npm test -- src/batch/exportBatch.test.ts`
- [ ] `npm run test:e2e -- --grep "batch ZIP export"`
- [ ] Inspect a mixed archive for file count, metadata, filenames, and manifest encoding.

**Dependencies:** T37, T40, T41

**Files likely touched:**
- `src/batch/exportBatch.ts`
- `src/batch/exportBatch.test.ts`
- `src/batch/BatchWorkspace.tsx`
- `package.json`
- `package-lock.json`

**Estimated scope:** M

## T44: Verify batch limits, cleanup, and error recovery

**Description:** Add the adversarial coverage needed before treating the browser
as a production batch worker.

**Acceptance criteria:**
- [ ] Fifty-row run, cancellation, retry, corrupt image, timeout, and archive failure paths have automated coverage.
- [ ] Tests assert object URLs/stages are cleaned up after success and failure.
- [ ] Long-running UI remains interactive and reports progress without console errors.

**Verification:**
- [ ] `npm test -- src/batch src/export/renderSnapshot.test.ts`
- [ ] `npm run test:e2e -- --grep "batch resilience"`
- [ ] Browser performance trace of a 50-row mocked run is reviewed.

**Dependencies:** T39, T40, T43

**Files likely touched:**
- `src/batch/fetchQueue.test.ts`
- `src/batch/generateBatch.test.ts`
- `src/batch/exportBatch.test.ts`
- `e2e/batch.spec.ts`

**Estimated scope:** M

## Checkpoint F: Batch Release

- [ ] T36–T44 acceptance criteria are complete.
- [ ] Fifty-row mocked and representative public-item batches pass.
- [ ] Memory/object URL cleanup has evidence.
- [ ] Human approves batch limits and review ergonomics.

## Phase 7: Deterministic Design Assist and Performance

## T45: Score layout recommendations from metadata and design constraints

**Description:** Replace first-match-only recommendations with an explainable
scoring model over item type, tags, title length, imagery, brand roles, and rules.

**Acceptance criteria:**
- [ ] Scorer returns ranked template IDs with stable reason codes and scores.
- [ ] Existing mapping behavior remains the fallback when richer signals are absent.
- [ ] Identical inputs always yield identical order and explanations.

**Verification:**
- [ ] `npm test -- src/assist/scoreTemplates.test.ts src/agol/mapping.test.ts`
- [ ] `npm run typecheck`
- [ ] Fixtures cover long titles, no imagery, strong imagery, and every major item type.

**Dependencies:** T17, T28, T35, T36

**Files likely touched:**
- `src/assist/scoreTemplates.ts`
- `src/assist/scoreTemplates.test.ts`
- `src/agol/mapping.ts`
- `src/agol/mapping.test.ts`

**Estimated scope:** M

## T46: Generate four explainable branded variations

**Description:** Produce four distinct candidate snapshots from the top-ranked
compatible layout families without mutating the editor.

**Acceptance criteria:**
- [ ] Variations differ structurally, not only by color, and respect template governance.
- [ ] Each result includes its quality findings and a concise recommendation rationale.
- [ ] Generation is pure, deterministic, cancellable, and uses current brand roles.

**Verification:**
- [ ] `npm test -- src/assist/generateVariations.test.ts`
- [ ] `npm run typecheck`
- [ ] Snapshot tests cover item types, brand/no-brand, image/no-image, and long titles.

**Dependencies:** T23, T31, T37, T45

**Files likely touched:**
- `src/assist/generateVariations.ts`
- `src/assist/generateVariations.test.ts`
- `src/assist/types.ts`

**Estimated scope:** M

## T47: Add variation preview and apply interactions

**Description:** Present four candidate thumbnails with rationale, findings, and
one explicit apply action.

**Acceptance criteria:**
- [ ] Candidate previews show layout name, reason, and quality status at AGOL card size.
- [ ] Applying a variation replaces the current design through the T05 guard and creates one undoable change.
- [ ] Closing/cancelling leaves editor and history untouched.

**Verification:**
- [ ] `npm run test:e2e -- --grep "design variations"`
- [ ] `npm run typecheck`
- [ ] Browser keyboard/focus and 1024×768 checks pass.

**Dependencies:** T20, T46

**Files likely touched:**
- `src/assist/VariationDialog.tsx`
- `src/App.tsx`
- `src/ui/uiStore.ts`
- `src/theme.css`
- `e2e/assist.spec.ts`

**Estimated scope:** M

## T48: Split large lazy feature surfaces and record bundle budgets

**Description:** Keep the single-item editor fast as administrator, batch, and
assist features grow.

**Acceptance criteria:**
- [ ] Batch, theme-import, template-pack, preview, and assist workspaces load in separate chunks.
- [ ] Initial production JavaScript has a documented compressed budget and no oversized-chunk warning at the agreed threshold.
- [ ] Lazy loading preserves focus, error fallback, and offline behavior after initial asset caching.

**Verification:**
- [ ] `npm run build`
- [ ] Bundle sizes are recorded in `docs/performance-budget.md`.
- [ ] Browser cold-load check shows no console errors and editor shell remains functional before lazy chunks load.

**Dependencies:** T27, T32, T41, T47

**Files likely touched:**
- `src/App.tsx`
- `src/panels/LeftPanel.tsx`
- `vite.config.ts`
- `docs/performance-budget.md`

**Estimated scope:** M

## T49: Run the production-system release gate

**Description:** Complete full regression, accessibility, performance, security,
documentation, and human review before release.

**Acceptance criteria:**
- [ ] README/user documentation describes projects, theme support limits, governance, batch, assist, accessibility, and privacy accurately.
- [ ] Security review covers untrusted JSON/CSV/URLs/images, archive generation, and anonymous network boundaries.
- [ ] Full Definition of Done, browser matrix, performance budget, and rollback/release checklist are approved.

**Verification:**
- [ ] `npm run lint; npm run typecheck; npm test; npm run build; npm run test:e2e`
- [ ] Accessibility-tree, keyboard-only, 1024×768, and representative export walkthroughs pass.
- [ ] Human signs off before merge/deployment.

**Dependencies:** T21, T27, T35, T44, T47, T48

**Files likely touched:**
- `README.md`
- `docs/architecture.md`
- `docs/security-and-privacy.md`
- `docs/release-checklist.md`
- `e2e/accessibility.spec.ts`

**Estimated scope:** M

## Checkpoint G: Production-System Release

- [ ] T45–T49 acceptance criteria are complete.
- [ ] Every earlier checkpoint remains green.
- [ ] No new persistence, authentication, or ArcGIS writes exist.
- [ ] Human approves merge and deployment.
