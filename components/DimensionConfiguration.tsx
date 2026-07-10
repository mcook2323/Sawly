import type { WoodMaterial } from "@/calculations/materialCatalog";
import { MaterialSelector } from "@/components/MaterialSelector";

export interface DimensionField {
  key: string;
  label: string;
  value: string;
  min: number;
  max: number;
  error: string | null;
  onChange: (value: string) => void;
}

interface DimensionConfigurationProps {
  fields: DimensionField[];
  material: WoodMaterial;
  onMaterialChange: (material: WoodMaterial) => void;
}

export function DimensionConfiguration({ fields, material, onMaterialChange }: DimensionConfigurationProps) {
  return (
    <section className="ds-card mt-8 p-5 sm:p-7 lg:p-8">
      <div className="grid gap-7 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <div>
          <p className="ds-eyebrow">Design studio</p>
          <h2 className="ds-subheading mt-3">Project details</h2>
          <p className="ds-body mt-3 text-sm">Adjust dimensions or material and every plan section updates instantly.</p>
        </div>
        <div>
          <div className="grid gap-4 sm:grid-cols-3">
            {fields.map((field) => (
              <div key={field.key}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor={`${field.key}-input`} className="text-sm font-semibold text-[#4b4139]">{field.label}</label>
                  <span className="text-xs text-[#9a8e83]">inches</span>
                </div>
                <div className="relative">
                  <input id={`${field.key}-input`} type="number" min={field.min} max={field.max} value={field.value} aria-invalid={Boolean(field.error)} aria-describedby={field.error ? `${field.key}-error` : `${field.key}-range`} onChange={(event) => field.onChange(event.target.value)} className="ds-input pr-12 font-semibold" />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#9a8e83]">in</span>
                </div>
                <p id={field.error ? `${field.key}-error` : `${field.key}-range`} className={`mt-2 text-xs ${field.error ? "text-[#a44f40]" : "text-[#a79b90]"}`}>{field.error ?? `${field.min}–${field.max} in`}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[#e4dacd] pt-6">
            <MaterialSelector value={material} onChange={onMaterialChange} layout="grid" />
          </div>
        </div>
      </div>
    </section>
  );
}
