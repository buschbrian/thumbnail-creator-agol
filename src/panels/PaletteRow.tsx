import { useBrandStore } from "../brand/brandStore";
import { QUICK_PALETTE } from "../constants";

interface PaletteRowProps {
  value?: string;
  onCommit: (hex: string) => void;
  ariaLabel: string;
}

/**
 * Brand-aware quick palette: imported brand colors come first, then the
 * built-in fallbacks. Used by the canvas tab and every color property field.
 */
export function PaletteRow({
  value,
  onCommit,
  ariaLabel,
}: PaletteRowProps): React.ReactElement {
  const brandColors = useBrandStore((s) => s.colors);

  const entries = brandColors.map((color) => ({
    hex: color.hex,
    name: color.name,
  }));
  const seen = new Set(entries.map((e) => e.hex.toLowerCase()));
  for (const hex of QUICK_PALETTE) {
    if (!seen.has(hex.toLowerCase())) entries.push({ hex, name: undefined });
  }

  return (
    <div className="palette-row" role="group" aria-label={ariaLabel}>
      {entries.map(({ hex, name }) => (
        <button
          key={hex}
          type="button"
          className={`palette-dot${
            value && value.toLowerCase() === hex.toLowerCase() ? " is-active" : ""
          }`}
          style={{ background: hex }}
          title={name ? `${name} · ${hex}` : hex}
          aria-label={`Use color ${name ?? hex}`}
          onClick={() => onCommit(hex)}
        />
      ))}
    </div>
  );
}
