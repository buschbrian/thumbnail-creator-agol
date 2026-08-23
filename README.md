# ArcGIS Thumbnail Maker

A fast, client-side tool for creating consistent, professional thumbnails for
ArcGIS Online items. Built for GIS staff who need good-looking 600 × 400 (and
other preset) thumbnails without firing up a design tool.

**No backend. No uploads. Everything runs in your browser.**

## Features

- **Canva-style editing surface** — icon rail (Templates / Elements / Text /
  Canvas), drag-and-drop canvas with snapping, zoom controls, double-click to
  edit, arrow-key nudging, and drop-an-image-to-set-background.
- **AGOL item-type templates** — preloaded designs for Web maps, Feature
  layers, Dashboards, Story maps, Apps, Scenes, Surveys and Datasets, plus
  essential layouts. The gallery shows live-rendered previews and filters by
  item type; templates set the item type used for alt text.
- **Accessibility built in** — alt text is auto-generated from the design
  (item type, title, composition), embedded into the exported file's metadata
  (PNG `Description` / `Alt Text` chunks, JPEG `COM`), editable with an
  override, and copyable for ArcGIS Online's item Alt Text field.
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

## Getting started

```bash
npm install     # also copies Calcite assets + generates the icon catalog
npm run dev     # http://localhost:5173/thumbnail-creator-agol/
```

Requires Node 20+.

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

A workflow at `.github/workflows/deploy.yml` builds and deploys on every push
to `main`. One-time setup after creating the GitHub repo:

```bash
git remote add origin https://github.com/<you>/thumbnail-creator-agol.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source:
GitHub Actions**. The site will be served at
`https://<you>.github.io/thumbnail-creator-agol/`.

The Vite `base` path is already set to `/thumbnail-creator-agol/`; if you
rename the repo, update `base` in `vite.config.ts` to match.

## Licensing notes

- All project code here: MIT (see below).
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
  canvas/      Konva stage, layer renderers, snapping, fit-to-viewport
  export/      offscreen export rendering, filename + validation logic
  hooks/       DOM event binding, keyboard shortcuts, history flags
  icons/       generated icon catalog (from @esri/calcite-ui-icons)
  panels/      left controls, layers/properties/export panels, dialogs
  presets/     size presets
  state/       Zustand store, layer types, undo/redo
  templates/   template definitions (layer factories)
scripts/       asset copying (postinstall) + icon catalog generation
e2e/           Playwright smoke tests
```
