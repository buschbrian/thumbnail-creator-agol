import { useMemo, useState } from "react";
import { TEMPLATES, templateCategories } from "../templates/templates";
import { TemplateThumb } from "../templates/TemplateThumb";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";

export function TemplateGallery() {
  const doc = useEditorStore((s) => s.doc);
  const applyTemplate = useEditorStore((s) => s.applyTemplate);
  const pushAlert = useUIStore((s) => s.pushAlert);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(() => ["All", ...templateCategories()], []);

  const searchRef = useDomEvents([
    [
      "calciteInputTextInput",
      (event) => setQuery((event.target as HTMLInputElement).value),
    ],
  ]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle)
      );
    });
  }, [query, category]);

  return (
    <div className="gallery">
      <calcite-input-text
        ref={searchRef}
        scale="s"
        placeholder="Search templates…"
        aria-label="Search templates"
        icon="search"
      />

      <div className="chip-row" role="group" aria-label="Filter by item type">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`filter-chip${category === c ? " is-active" : ""}`}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {visible.map((template) => (
          <button
            key={template.id}
            type="button"
            className="gallery-card"
            aria-label={`Apply template ${template.name}`}
            onClick={() => {
              applyTemplate(template.id);
              pushAlert("success", "Template applied", template.name);
            }}
          >
            <span className="gallery-thumb">
              <TemplateThumb drafts={template.build(doc)} doc={doc} />
            </span>
            <span className="gallery-meta">
              <strong>{template.name}</strong>
              <small>{template.category}</small>
            </span>
          </button>
        ))}
        {visible.length === 0 ? (
          <p className="empty-hint">No templates match “{query}”.</p>
        ) : null}
      </div>

      <p className="field-hint">
        Templates replace current layers and set the item type used for alt
        text. Everything stays editable.
      </p>
    </div>
  );
}
