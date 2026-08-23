import type { TemplateDefinition } from "./templateKit";
import { ESSENTIAL_TEMPLATES } from "./templatesEssentials";
import { ITEM_TEMPLATES_A } from "./templatesItemsA";
import { ITEM_TEMPLATES_B } from "./templatesItemsB";

export type { TemplateDefinition } from "./templateKit";

export const TEMPLATES: readonly TemplateDefinition[] = [
  ...ITEM_TEMPLATES_A,
  ...ITEM_TEMPLATES_B,
  ...ESSENTIAL_TEMPLATES,
];

export function findTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function templateCategories(): string[] {
  const seen: string[] = [];
  for (const t of TEMPLATES) {
    if (!seen.includes(t.category)) seen.push(t.category);
  }
  return seen;
}
