import { useCallback } from "react";
import { useDomEvents } from "../hooks/useDomEvents";

export interface PatchTools {
  live: (patch: Record<string, unknown>) => void;
  commit: (patch: Record<string, unknown>) => void;
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps): React.ReactElement {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </div>
  );
}

export function NameField({
  name,
  tools,
}: {
  name: string;
  tools: PatchTools;
}) {
  const onCommit = useCallback(
    (event: Event) =>
      tools.commit({ name: (event.target as HTMLInputElement).value }),
    [tools],
  );
  const ref = useDomEvents([
    ["calciteInputTextChange", onCommit],
  ]);
  return (
    <Field label="Name">
      <calcite-input-text
        ref={ref}
        scale="s"
        value={name}
        aria-label="Layer name"
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  patchKey,
  tools,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  patchKey: string;
  tools: PatchTools;
}) {
  const onCommit = useCallback(
    (event: Event) => {
      const parsed = Number((event.target as HTMLInputElement).value);
      if (Number.isFinite(parsed)) tools.commit({ [patchKey]: parsed });
    },
    [tools, patchKey],
  );
  const ref = useDomEvents([
    ["calciteInputNumberChange", onCommit],
  ]);
  return (
    <Field label={label}>
      <calcite-input-number
        ref={ref}
        scale="s"
        value={String(value)}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      />
    </Field>
  );
}

export function ColorField({
  label,
  value,
  patchKey,
  tools,
}: {
  label: string;
  value: string;
  patchKey: string;
  tools: PatchTools;
}) {
  const onLive = useCallback(
    (event: Event) => {
      const next = (event.target as HTMLInputElement).value;
      tools.live({ [patchKey]: next });
    },
    [tools, patchKey],
  );
  const onCommit = useCallback(
    (event: Event) => {
      const next = (event.target as HTMLInputElement).value;
      tools.commit({ [patchKey]: next });
    },
    [tools, patchKey],
  );
  const ref = useDomEvents([
    ["calciteColorPickerInput", onLive],
    ["calciteColorPickerChange", onCommit],
  ]);
  return (
    <Field label={label}>
      <calcite-color-picker
        ref={ref}
        scale="s"
        value={value}
        aria-label={label}
        hide-hex-input
      />
    </Field>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  patchKey,
  formatValue,
  tools,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  patchKey: string;
  formatValue?: (v: number) => number;
  tools: PatchTools;
}) {
  const onLive = useCallback(
    (event: Event) => {
      const raw = Number((event.target as HTMLInputElement).value);
      if (!Number.isFinite(raw)) return;
      tools.live({ [patchKey]: formatValue ? formatValue(raw) : raw });
    },
    [tools, patchKey, formatValue],
  );
  const onCommit = useCallback(
    (event: Event) => {
      const raw = Number((event.target as HTMLInputElement).value);
      if (!Number.isFinite(raw)) return;
      tools.commit({ [patchKey]: formatValue ? formatValue(raw) : raw });
    },
    [tools, patchKey, formatValue],
  );
  const ref = useDomEvents([
    ["calciteSliderInput", onLive],
    ["calciteSliderChange", onCommit],
  ]);
  return (
    <Field label={`${label} (${Math.round(value * 100) / 100})`}>
      <calcite-slider
        ref={ref}
        scale="s"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
      />
    </Field>
  );
}

export function SegmentedField({
  label,
  value,
  options,
  patchKey,
  parse,
  tools,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  patchKey: string;
  parse?: (value: string) => unknown;
  tools: PatchTools;
}) {
  const onChange = useCallback(
    (event: Event) => {
      const target = event.target as HTMLInputElement & { value?: string };
      const next = target.value ?? target.getAttribute("value") ?? "";
      if (next !== "") {
        tools.commit({ [patchKey]: parse ? parse(next) : next });
      }
    },
    [tools, patchKey, parse],
  );
  const ref = useDomEvents([
    ["calciteSegmentedControlChange", onChange],
  ]);
  return (
    <Field label={label}>
      <calcite-segmented-control
        ref={ref}
        scale="s"
        value={value}
        aria-label={label}
      >
        {options.map((option) => (
          <calcite-segmented-control-item
            key={option.value}
            value={option.value}
          >
            {option.label}
          </calcite-segmented-control-item>
        ))}
      </calcite-segmented-control>
    </Field>
  );
}

export function SwitchField({
  label,
  checked,
  patchKey,
  tools,
}: {
  label: string;
  checked: boolean;
  patchKey: string;
  tools: PatchTools;
}) {
  const onChange = useCallback(
    (event: Event) =>
      tools.commit({
        [patchKey]: (event.target as HTMLInputElement).checked,
      }),
    [tools, patchKey],
  );
  const ref = useDomEvents([["calciteSwitchChange", onChange]]);
  return (
    <div className="field switch-field">
      <span className="field-label">{label}</span>
      <calcite-switch ref={ref} scale="s" checked={checked} aria-label={label} />
    </div>
  );
}
