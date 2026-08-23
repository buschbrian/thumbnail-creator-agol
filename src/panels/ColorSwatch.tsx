import { useCallback, useState } from "react";
import { useDomEvents } from "../hooks/useDomEvents";

interface ColorSwatchProps {
  label: string;
  value: string;
  onLive?: (hex: string) => void;
  onCommit: (hex: string) => void;
}

export function ColorSwatch({
  label,
  value,
  onLive,
  onCommit,
}: ColorSwatchProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const handleEvent = useCallback(
    (event: Event) => {
      const hex = (event.target as HTMLInputElement).value;
      if (event.type === "calciteColorPickerInput") {
        onLive?.(hex);
        onCommit(hex);
      } else {
        onCommit(hex);
      }
    },
    [onLive, onCommit],
  );

  const pickerRef = useDomEvents([
    ["calciteColorPickerInput", handleEvent],
    ["calciteColorPickerChange", handleEvent],
  ]);

  return (
    <div className="color-swatch-field">
      <button
        type="button"
        className={`swatch-btn${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="swatch-color" style={{ background: value }} />
        <span className="swatch-hex">{value.toUpperCase()}</span>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d={open ? "M3.5 10 8 5.5l4.5 4.5" : "M3.5 6.5 8 11l4.5-4.5"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <calcite-color-picker
          ref={pickerRef}
          className="swatch-picker"
          scale="s"
          value={value}
          hide-hex-input
          aria-label={label}
        />
      ) : null}
    </div>
  );
}
