# ArcGIS Thumbnail Maker

A fast, client-side tool for creating consistent, professional thumbnails for
ArcGIS Online items. Built for GIS staff who need good-looking 600 × 400 (and
other preset) thumbnails without firing up a design tool.

**No backend. No uploads. Everything runs in your browser.**

**Use it:** <https://buschbrian.github.io/thumbnail-creator-agol/>

## Features

- **Canva-style editing surface** — icon rail (Templates / Brand / Elements /
  Text / Canvas), drag-and-drop canvas with snapping, zoom controls, double-click to
  edit, arrow-key nudging, and drop-an-image-to-set-background.
- **AGOL item-type templates** — preloaded designs for Web maps, Feature
  layers, Dashboards, Story maps, Apps, Scenes, Surveys and Datasets, plus
  essential layouts. The gallery shows live-rendered previews and filters by
  item type; templates set the item type used for alt text.
- **Accessibility built in** — alt text is auto-generated from the design
  (item type, title, composition), embedded into the exported file's metadata
  (PNG `Description` / `Alt Text` chunks, JPEG `COM`), editable with an
  override, and copyable for ArcGIS Online's item Alt Text field.
- **Generate from ArcGIS** — paste a public ArcGIS Online / Enterprise item
  URL, a bare item ID, or an ArcGIS Server service URL. The app reads the
  item's public metadata, picks a matching template, and fills in the title,
  summary, and item type. It can optionally reuse the item's existing
  thumbnail as the background and tint the design with your brand kit. Only
  anonymous, read-only requests are made, so the item must be shared
  publicly.
- **Brand kit** — save a brand name, logo, and palette (up to 64 colors).
  Import colors from a file or pasted text (hex lists, `rgb()`, CSS/SCSS
  variables, JSON palettes, GIMP `.gpl`, Coolors URLs), extract colors from
  the logo, and share the kit as a `.brandkit.json` file. The kit is saved in
  your browser's localStorage; nothing else is.
- **Presets** — ArcGIS Online 600 × 400 (default), Square 400 × 400,
  High-res 1200 × 800, plus custom sizes (existing layers rescale).
- **Elements** — styled text presets (heading, impact, label chip…), logo
  upload, shapes, and a searchable picker with ~420 ArcGIS-style icons.
- **Editing** — drag, resize, and rotate with center snap guides; layer list
  with reorder, visibility, and delete; per-layer properties.
- **Undo / redo** — full history (Ctrl+Z / Ctrl+Y), Ctrl+S to export.
- **Export** — PNG (default) or JPEG with quality slider, rendered at exact
  pixel dimensions regardless of editor zoom. Guides and selection handles
  are never included. Warns on unusual sizes and extreme aspect ratios and
  suggests a sensible filename (`my-map-title_600x400.png`).
- **Editable project download** — saves a validated, versioned
  `.thumbnail.json` file with local PNG/JPEG/WebP assets embedded for
  portability. Large project files require confirmation before download.
  (Opening a project file back in the app is not built yet.)

## Getting started

```bash
npm install     # also copies Calcite assets + generates the icon catalog
npm run dev     # http://localhost:5173/thumbnail-creator-agol/
```

Requires Node 20.19+ or 22.12+ (Vite 8's minimum). CI builds with Node 22.
Run `npx playwright install chromium` once before `npm run test:e2e`.

## Scripts

| Command             | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Start the dev server                           |
| `npm run build`     | Generate icons, typecheck, build to `dist/`    |
| `npm run preview`   | Serve the production build locally             |
| `npm run lint`      | ESLint                                         |
| `npm run typecheck` | TypeScript project check                       |
| `npm run test`      | Vitest unit tests                              |
| `npm run test:e2e`  | Playwright end-to-end tests (Chromium)         |

## Tech stack

- Vite + React 19 + TypeScript (strict)
- Konva.js / react-konva — canvas editing
- Zustand (+ zundo) — state and undo/redo history
- Esri Calcite Design System v5 (`@esri/calcite-components`) — UI chrome,
  used directly as web components (React 19 custom-element support)
- `@esri/calcite-ui-icons` — icon artwork for the picker
- Vitest + Playwright

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every
push to `main`; the live site is
<https://buschbrian.github.io/thumbnail-creator-agol/>.

To deploy your own fork, set **Settings → Pages → Build and deployment →
Source** to **GitHub Actions**. The Vite `base` path is set to
`/thumbnail-creator-agol/`; if you rename the repo, update `base` in
`vite.config.ts` to match.

## Licensing notes

- All project code here: MIT.
- The UI uses the **Esri Calcite Design System** and **Calcite UI Icons**
  (npm packages `@esri/calcite-components`, `@esri/calcite-ui-icons`),
  which are © Esri and provided under the [Esri Master Agreement
  terms](https://developers.arcgis.com/calcite-design-system/resources/licensing/).
  Use of this app therefore assumes an ArcGIS Online, ArcGIS Enterprise, or
  free ArcGIS Location Platform account. Icon path data is generated at build
  time from the npm dependency and is not committed to this repository.

## Project layout

```
src/
  agol/        ArcGIS URL parsing, public metadata fetch, generate-from-item
  brand/       brand kit store, color parsing, logo theme extraction
  canvas/      Konva stage, layer renderers, snapping, fit-to-viewport
  export/      offscreen export rendering, filename + validation logic
  hooks/       DOM event binding, keyboard shortcuts, history flags
  icons/       generated icon catalog (from @esri/calcite-ui-icons)
  panels/      left controls, layers/properties/export panels, dialogs
  presets/     size presets
  project/     portable project schema, asset codec, and file operations
  state/       Zustand store, layer types, undo/redo
  templates/   template definitions (layer factories)
  ui/          UI-only state (panels, alerts, export settings)
scripts/       asset copying (postinstall) + icon catalog generation
e2e/           Playwright smoke tests
tasks/         roadmap (plan.md) and task checklist (todo.md)
```

Contributor and coding-agent conventions are in [`AGENTS.md`](AGENTS.md).
