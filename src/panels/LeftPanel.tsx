import { useCallback, useRef } from "react";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";
import { ColorSwatch } from "./ColorSwatch";
import { TemplateGallery } from "./TemplateGallery";
import { PaletteRow } from "./PaletteRow";
import { BrandPanel } from "./BrandPanel";
import { useBrandStore } from "../brand/brandStore";
import { ICON_CATALOG } from "../icons/generated/iconData";
import { TEXT_PRESETS } from "../templates/textPresets";
import type { FitMode } from "../state/types";

const QUICK_ICONS = [
  "map",
  "layers",
  "pin",
  "dashboard",
  "graphBar",
  "book",
  "globe",
  "applications",
  "table",
  "formField",
  "compass",
  "calendar",
];

function readFileAsImage(
  file: File,
): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(`"${file.name}" is not an image file.`));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({ url, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}".`));
    };
    image.src = url;
  });
}

function ElementsTab() {
  const addRectangle = useEditorStore((s) => s.addRectangle);
  const addIcon = useEditorStore((s) => s.addIcon);
  const openIconPicker = useUIStore((s) => s.openIconPicker);
  const brandLogo = useBrandStore((s) => s.logo);
  const brandName = useBrandStore((s) => s.name);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const onLogoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      const pushAlert = useUIStore.getState().pushAlert;
      try {
        const measured = await readFileAsImage(file);
        useEditorStore.getState().addLogo(measured.url, measured.width, measured.height);
      } catch (error) {
        pushAlert("danger", "Upload failed", (error as Error).message);
      }
    },
    [],
  );

  return (
    <div className="tab-body">
      <h3 className="section-title">Elements</h3>
      <div className="add-grid add-grid-loose">
        <button
          type="button"
          className="add-tile"
          aria-label="Add text layer"
          onClick={() => useEditorStore.getState().addText()}
        >
          <span className="add-tile-glyph glyph-text" aria-hidden="true">T</span>
          Text
        </button>
        <button
          type="button"
          className="add-tile"
          aria-label="Add rectangle layer"
          onClick={() => addRectangle()}
        >
          <span className="add-tile-glyph glyph-shape" aria-hidden="true" />
          Shape
        </button>
        <button
          type="button"
          className="add-tile"
          aria-label="Add logo from file"
          onClick={() => logoFileRef.current?.click()}
        >
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M2 12.5 6 8l3 3 2-2.5 3 4v1H2z" fill="currentColor" opacity="0.85" />
            <circle cx="5.2" cy="5.2" r="1.4" fill="#e8400d" />
          </svg>
          Logo
        </button>
        <button
          type="button"
          className="add-tile"
          aria-label="Browse all icons"
          onClick={() => openIconPicker()}
        >
          <span className="add-tile-glyph glyph-icon" aria-hidden="true">✦</span>
          Icons…
        </button>
      </div>
      {brandLogo ? (
        <div className="add-grid add-grid-loose brand-logo-tile-row">
          <button
            type="button"
            className="add-tile add-tile-brand"
            aria-label="Add brand logo to canvas"
            title={`${brandName || "Brand"} logo`}
            onClick={() =>
              useEditorStore
                .getState()
                .addLogo(brandLogo.src, brandLogo.width, brandLogo.height)
            }
          >
            <img
              src={brandLogo.src}
              alt=""
              height={18}
              style={{ width: "auto", maxWidth: 28, objectFit: "contain" }}
            />
            Brand logo
          </button>
        </div>
      ) : null}
      <input
        ref={logoFileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onLogoUpload}
      />

      <h3 className="section-title section-title-gap">Popular icons</h3>
      <div className="quick-icons">
        {QUICK_ICONS.map((iconId) => (
          <QuickIconButton key={iconId} iconId={iconId} onAdd={addIcon} />
        ))}
      </div>
    </div>
  );
}

function QuickIconButton({
  iconId,
  onAdd,
}: {
  iconId: string;
  onAdd: (iconId: string) => void;
}) {
  const definition = ICON_CATALOG.find((i) => i.id === iconId);
  if (!definition) return null;
  return (
    <button
      type="button"
      className="quick-icon"
      aria-label={`Add ${definition.label} icon`}
      title={definition.label}
      onClick={() => onAdd(iconId)}
    >
      <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
        {definition.paths.map((path, index) => (
          <path
            key={index}
            d={path.d}
            fill="currentColor"
            opacity={path.opacity !== undefined ? parseFloat(path.opacity) : 1}
          />
        ))}
      </svg>
    </button>
  );
}

function TextTab() {
  const addTextPreset = useEditorStore((s) => s.addTextPreset);
  return (
    <div className="tab-body">
      <h3 className="section-title">Text styles</h3>
      <div className="text-preset-list">
        {TEXT_PRESETS.map((preset) => (
          <button
            key={preset.kind}
            type="button"
            className="text-preset-row"
            aria-label={`Add ${preset.label}`}
            onClick={() => addTextPreset(preset.kind)}
          >
            <span className="text-preset-sample" style={preset.previewStyle}>
              {preset.kind === "impact" ? "Aa" : preset.label}
            </span>
            <span className="template-text">
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BackgroundTab() {
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const layers = useEditorStore((s) => s.layers);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const backgroundLayer = layers.find((l) => l.type === "backgroundImage");

  const bgFitRef = useDomEvents([
    [
      "calciteSelectChange",
      (event) => {
        if (backgroundLayer?.type !== "backgroundImage") return;
        const value = (event.target as unknown as { value: FitMode }).value;
        useEditorStore
          .getState()
          .updateLayer(backgroundLayer.id, { fit: value });
      },
    ],
  ]);

  const onBackgroundUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      const pushAlert = useUIStore.getState().pushAlert;
      try {
        const measured = await readFileAsImage(file);
        useEditorStore.getState().setBackgroundImage(measured.url);
      } catch (error) {
        pushAlert("danger", "Upload failed", (error as Error).message);
      }
    },
    [],
  );

  return (
    <div className="tab-body">
      <h3 className="section-title">Color</h3>
      <ColorSwatch
        label="Background color"
        value={backgroundColor}
        onCommit={(hex) => useEditorStore.getState().setBackgroundColor(hex)}
      />
      <PaletteRow
        ariaLabel="Quick background colors"
        value={backgroundColor}
        onCommit={(hex) => useEditorStore.getState().setBackgroundColor(hex)}
      />

      <h3 className="section-title section-title-gap">Photo</h3>
      <input
        ref={bgFileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onBackgroundUpload}
      />
      <div className="field-row">
        <calcite-button
          scale="s"
          appearance="outline-fill"
          icon-start="upload"
          width="full"
          onClick={() => bgFileRef.current?.click()}
        >
          Upload photo
        </calcite-button>
        {backgroundLayer ? (
          <calcite-button
            scale="s"
            kind="danger"
            appearance="transparent"
            icon-start="trash"
            aria-label="Remove background image"
            onClick={() => useEditorStore.getState().removeBackgroundImage()}
          />
        ) : null}
      </div>

      {backgroundLayer && backgroundLayer.type === "backgroundImage" ? (
        <div className="field">
          <label className="field-label" htmlFor="bg-fit">
            Image fit
          </label>
          <calcite-select
            id="bg-fit"
            ref={bgFitRef}
            scale="s"
            value={backgroundLayer.fit}
            label="Background image fit mode"
          >
            <calcite-option value="cover">Fill and crop</calcite-option>
            <calcite-option value="contain">Fit inside</calcite-option>
            <calcite-option value="stretch">Stretch</calcite-option>
          </calcite-select>
        </div>
      ) : null}

      <p className="field-hint">
        Tip: you can also drop an image straight onto the canvas.
      </p>
    </div>
  );
}

export function LeftPanel() {
  const leftTab = useUIStore((s) => s.leftTab);

  return (
    <div className="rail-content">
      {leftTab === "templates" ? <TemplateGallery /> : null}
      {leftTab === "brand" ? <BrandPanel /> : null}
      {leftTab === "elements" ? <ElementsTab /> : null}
      {leftTab === "text" ? <TextTab /> : null}
      {leftTab === "background" ? <BackgroundTab /> : null}
    </div>
  );
}
