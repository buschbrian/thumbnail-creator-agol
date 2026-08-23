# AGENTS.md

## Project

This project is ArcGIS Thumbnail Maker, a client-side web app for creating thumbnails for ArcGIS Online content.

The app lets users:
- Upload background images
- Add text
- Add logos
- Add ArcGIS/Esri-style icons
- Use footer/sidebar templates
- Export PNG/JPEG thumbnails

The target user is GIS staff creating consistent ArcGIS Online thumbnails quickly.

## Stack

Use:
- Next.js
- React
- TypeScript
- Esri Calcite Design System
- Zustand
- Konva.js / react-konva
- Vitest
- Playwright

Prefer client-side functionality. Do not introduce a backend unless explicitly requested.

## Design direction

The UI should feel:
- Simple
- Modern
- Esri-adjacent
- Professional
- Clean
- Accessible

Prefer Calcite components for app chrome and controls.

Avoid making the app feel like a full Canva clone.

## Current priority

The app already exists and runs. Do not rebuild from scratch.

Focus on:
1. Refinement
2. Stability
3. UI polish
4. Export correctness
5. Template quality
6. Accessibility
7. Test coverage

## Core product requirements

The app should support:
- 600 x 400 default ArcGIS Online thumbnail preset
- 400 x 400 square preset
- 1200 x 800 high-res preset
- Custom size preset
- Background upload
- Logo upload
- Text layers
- Footer/sidebar templates
- ArcGIS-style icon picker
- PNG export
- JPEG export
- Export validation warnings
- Undo/redo where practical

## Engineering rules

Before making changes:
- Inspect the existing codebase.
- Identify the current architecture.
- Preserve working functionality.
- Make small, reviewable changes.
- Do not rewrite working systems without a clear reason.
- Prefer improving existing components over replacing them.
- Keep TypeScript strict and readable.

After making changes:
- Run lint if available.
- Run tests if available.
- Run build.
- Report what changed, what was tested, and what remains.

## Commands

First inspect package.json and use the actual project commands.

Common commands may be:
- npm install
- npm run dev
- npm run lint
- npm run test
- npm run build

Do not assume pnpm, yarn, or npm until package manager files are inspected.

## Accessibility

Use accessible labels for:
- Icon buttons
- Upload controls
- Export controls
- Template buttons
- Layer controls

Use Calcite alerts/notices for errors and warnings.

## Export behavior

Export should:
- Hide canvas guides and selection handles
- Export the canvas exactly as shown
- Default to PNG
- Support JPEG with quality control
- Warn on unusual dimensions
- Warn on unusual aspect ratio
- Use a sensible filename

## Do not do

Do not:
- Add authentication in the MVP
- Add ArcGIS Online API integration yet
- Add a database yet
- Add server-side image processing yet
- Replace Calcite with a custom design system
- Import massive icon libraries unnecessarily
- Break the current running app
