import {
  MATERIAL_OPTIONS,
  type MaterialOption,
  type WoodMaterial,
} from "@/calculations/materialCatalog";

interface MaterialSelectorProps {
  value: WoodMaterial;
  onChange: (material: WoodMaterial) => void;
  options?: MaterialOption[];
  layout?: "stacked" | "grid";
}

export function MaterialSelector({
  value,
  onChange,
  options = MATERIAL_OPTIONS,
  layout = "stacked",
}: MaterialSelectorProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[var(--color-ink)]">
        Wood material
      </legend>
      <p className="ds-caption mt-1">
        Material changes the shopping list labels and approximate cost range.
      </p>

      <div
        className={`mt-3 grid gap-2 ${
          layout === "grid" ? "sm:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-1"
        }`}
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                isSelected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-[var(--shadow-sm)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-canvas)]"
              }`}
            >
              <input
                type="radio"
                name="wood-material"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                      : "border-[var(--color-border-strong)] bg-white"
                  }`}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--color-ink)]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[var(--color-ink-muted)]">
                    {option.description}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-clay)]">
                    {option.priceNote}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
