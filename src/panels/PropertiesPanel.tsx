import { useCallback } from "react";
import { FONT_OPTIONS } from "../constants";
import { useDomEvents } from "../hooks/useDomEvents";
import { pauseHistory, resumeHistory, useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import {
  ColorField,
  Field,
  NameField,
  NumberField,
  SegmentedField,
  SliderField,
  SwitchField,
} from "./propertyFields";
import type { PatchTools } from "./propertyFields";
import type {
  IconLayer,
  Layer,
  ShapeLayer,
  TextLayer,
} from "../state/types";

function TextProperties({
  layer,
  tools,
}: {
  layer: TextLayer;
  tools: PatchTools;
}) {
  const onTextEvent = useCallback(
    (event: Event) => {
      const value = (event.target as HTMLTextAreaElement).value;
      if (event.type === "calciteTextAreaInput") tools.live({ text: value });
      else tools.commit({ text: value });
    },
    [tools],
  );
  const areaRef = useDomEvents([
    ["calciteTextAreaInput", onTextEvent],
    ["calciteTextAreaChange", onTextEvent],
  ]);

  const onFontChange = useCallback(
    (event: Event) => {
      const next = (event.target as unknown as { value: string }).value;
      tools.commit({ fontId: next });
    },
    [tools],
  );
  const fontRef = useDomEvents([["calciteSelectChange", onFontChange]]);

  return (
    <>
      <Field label="Content">
        <calcite-text-area
          ref={areaRef}
          scale="s"
          rows={3}
          value={layer.text}
          aria-label="Text content"
        />
      </Field>

      <Field label="Font">
        <calcite-select
          ref={fontRef}
          scale="s"
          value={layer.fontId}
          label="Font family"
        >
          {FONT_OPTIONS.map((font) => (
            <calcite-option key={font.id} value={font.id}>
              {font.label}
            </calcite-option>
          ))}
        </calcite-select>
      </Field>

      <SegmentedField
        label="Weight"
        value={String(layer.fontWeight)}
        patchKey="fontWeight"
        parse={(v) => (Number(v) === 700 ? 700 : 400)}
        options={[
          { value: "400", label: "Regular" },
          { value: "700", label: "Bold" },
        ]}
        tools={tools}
      />

      <SwitchField
        label="Italic"
        checked={layer.italic}
        patchKey="italic"
        tools={tools}
      />

      <NumberField
        label="Size"
        value={layer.fontSize}
        min={8}
        max={400}
        patchKey="fontSize"
        tools={tools}
      />

      <ColorField
        label="Color"
        value={layer.color}
        patchKey="color"
        tools={tools}
      />

      <SegmentedField
        label="Alignment"
        value={layer.align}
        patchKey="align"
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
        tools={tools}
      />

      <NumberField
        label="Letter spacing"
        value={layer.letterSpacing}
        min={-10}
        max={100}
        step={0.5}
        patchKey="letterSpacing"
        tools={tools}
      />

      <SliderField
        label="Line height"
        value={layer.lineHeight}
        min={0.8}
        max={2}
        step={0.05}
        patchKey="lineHeight"
        tools={tools}
      />

      <NumberField
        label="Wrap width"
        value={layer.width}
        min={20}
        max={2000}
        patchKey="width"
        tools={tools}
      />
    </>
  );
}

function ShapeProperties({
  layer,
  tools,
}: {
  layer: ShapeLayer;
  tools: PatchTools;
}) {
  return (
    <>
      <ColorField
        label="Fill"
        value={layer.fill}
        patchKey="fill"
        tools={tools}
      />
      <NumberField
        label="Width"
        value={layer.width}
        min={4}
        max={2000}
        patchKey="width"
        tools={tools}
      />
      <NumberField
        label="Height"
        value={layer.height}
        min={4}
        max={2000}
        patchKey="height"
        tools={tools}
      />
      <SliderField
        label="Corner radius"
        value={layer.cornerRadius}
        min={0}
        max={120}
        patchKey="cornerRadius"
        tools={tools}
      />
    </>
  );
}

function LogoProperties() {
  return (
    <p className="field-hint">
      Drag the corner handles to resize while keeping the logo aspect.
    </p>
  );
}

function IconProperties({
  layer,
  tools,
}: {
  layer: IconLayer;
  tools: PatchTools;
}) {
  const openIconPicker = useUIStore((s) => s.openIconPicker);
  return (
    <>
      <Field label="Icon" hint={`Selected icon: ${layer.iconId}`}>
        <calcite-button
          scale="s"
          appearance="outline-fill"
          icon-start="apps"
          width="full"
          aria-label={`Replace ${layer.iconId} icon`}
          onClick={() => openIconPicker(layer.id)}
        >
          Replace icon
        </calcite-button>
      </Field>
      <NumberField
        label="Size"
        value={layer.size}
        min={12}
        max={800}
        patchKey="size"
        tools={tools}
      />
      <ColorField
        label="Color"
        value={layer.color}
        patchKey="color"
        tools={tools}
      />
    </>
  );
}

export function PropertiesPanel() {
  const layers = useEditorStore((s) => s.layers);
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const layer: Layer | undefined = layers.find((l) => l.id === selectedId);

  const live = useCallback(
    (patch: Record<string, unknown>) => {
      pauseHistory();
      if (selectedId) updateLayer(selectedId, patch);
    },
    [selectedId, updateLayer],
  );

  const commit = useCallback(
    (patch: Record<string, unknown>) => {
      if (selectedId) updateLayer(selectedId, patch);
      resumeHistory();
    },
    [selectedId, updateLayer],
  );

  if (!layer || layer.type === "backgroundImage") {
    return (
      <div className="properties-body">
        <p className="empty-hint">Select a layer to edit its properties.</p>
      </div>
    );
  }

  const tools: PatchTools = { live, commit };

  return (
    <div className="properties-body">
      <NameField name={layer.name} tools={tools} />

      <SliderField
        label="Opacity %"
        value={Math.round(layer.opacity * 100)}
        min={0}
        max={100}
        step={1}
        patchKey="opacity"
        formatValue={(v) => v / 100}
        tools={tools}
      />

      <SwitchField
        label="Visible"
        checked={layer.visible}
        patchKey="visible"
        tools={tools}
      />

      <hr className="divider" />

      {layer.type === "text" ? (
        <TextProperties layer={layer} tools={tools} />
      ) : null}
      {layer.type === "shape" ? (
        <ShapeProperties layer={layer} tools={tools} />
      ) : null}
      {layer.type === "logo" ? <LogoProperties /> : null}
      {layer.type === "icon" ? (
        <IconProperties layer={layer} tools={tools} />
      ) : null}
    </div>
  );
}
