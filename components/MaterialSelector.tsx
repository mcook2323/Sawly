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
      <legend className="text-sm font-semibold text-[#4b4139]">
        Wood material
      </legend>
      <p className="mt-1 text-xs leading-5 text-[#94887d]">
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
                  ? "border-[#778461] bg-[#edf1e7] shadow-[0_5px_18px_rgba(91,70,49,0.08)]"
                  : "border-[#ded4c7] bg-[#fbf8f2] hover:border-[#bbaa96] hover:bg-[#f7f1e8]"
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
                      ? "border-[#667154] bg-[#667154]"
                      : "border-[#b9ad9f] bg-white"
                  }`}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#443a32]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#7d7268]">
                    {option.description}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[#a05f47]">
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
