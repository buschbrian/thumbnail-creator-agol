import { describe, expect, it } from "vitest";
import { TEMPLATES, findTemplate } from "./templates";
import { findIcon } from "../icons/generated/iconData";

const DOC = { width: 600, height: 400, title: "Test" };

describe("templates", () => {
  it("has unique ids", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers common ArcGIS Online item types", () => {
    const categories = new Set(TEMPLATES.map((t) => t.category));
    for (const category of [
      "Web map",
      "Feature layer",
      "Dashboard",
      "Story map",
      "App",
      "Scene",
      "Survey",
      "Dataset",
      "Essentials",
    ]) {
      expect(categories.has(category), `missing category ${category}`).toBe(true);
    }
  });

  it("finds templates by id", () => {
    expect(findTemplate("webmap-hero")?.name).toBeTruthy();
    expect(findTemplate("missing")).toBeUndefined();
  });

  it("blank template produces no layers", () => {
    expect(findTemplate("blank")?.build(DOC)).toEqual([]);
  });

  it("only references icons that exist in the catalog", () => {
    for (const template of TEMPLATES) {
      if (template.iconId) {
        expect(findIcon(template.iconId), `${template.id} iconId`).toBeDefined();
      }
      const drafts = template.build(DOC);
      for (const draft of drafts) {
        if (draft.type === "icon") {
          expect(
            findIcon(draft.iconId),
            `${template.id} layer icon ${draft.iconId}`,
          ).toBeDefined();
        }
      }
    }
  });

  it.each(TEMPLATES.map((t) => [t.id] as const))(
    "%s keeps every layer inside the document",
    (id) => {
      const template = findTemplate(id);
      if (!template || template.id === "blank") return;
      const drafts = template.build(DOC);
      expect(drafts.length).toBeGreaterThan(0);
      for (const draft of drafts) {
        expect(Number.isFinite(draft.x)).toBe(true);
        expect(Number.isFinite(draft.y)).toBe(true);
        expect(draft.x).toBeGreaterThanOrEqual(-Math.round(DOC.width * 0.25));
        expect(draft.y).toBeGreaterThanOrEqual(-Math.round(DOC.height * 0.25));
        if ("width" in draft && typeof draft.width === "number") {
          expect(draft.width).toBeLessThanOrEqual(DOC.width + 1);
        }
        if ("height" in draft && typeof draft.height === "number") {
          expect(draft.height).toBeLessThanOrEqual(DOC.height + 1);
        }
      }
    },
  );
});
