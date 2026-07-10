import type { GeneratedTablePlan } from "@/calculations/table";
import { getMaterialLabel } from "@/calculations/materialCatalog";

interface CutListPanelProps {
  plan: GeneratedTablePlan;
}

export function CutListPanel({ plan }: CutListPanelProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a05f47]">
            Fabrication
          </p>
          <h2 className="editorial-title mt-2 text-3xl">Cut list</h2>
          <p className="mt-2 text-sm text-[#7d7268]">
            Finished dimensions for every part in the build.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e2d8cc]">
          {plan.cutList.map((piece, index) => (
            <div
              key={piece.name}
              className={`group grid gap-3 bg-[#fcfaf6] p-4 transition-colors hover:bg-[#f5efe6] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5 ${
                index !== plan.cutList.length - 1
                  ? "border-b border-[#e8dfd4]"
                  : ""
              }`}
            >
              <div>
                <h3 className="font-semibold text-[#443a32]">{piece.name}</h3>
                <p className="mt-1 text-sm capitalize text-[#94887d]">
                  {getMaterialLabel(piece.material)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                <span className="text-sm font-medium text-[#665b51]">
                  {piece.thickness}&quot; × {piece.width}&quot; × {piece.length}&quot;
                </span>
                <span className="rounded-full border border-[#d8ccbd] bg-[#f1e9de] px-3 py-1 text-xs font-semibold text-[#6f6257]">
                  Qty {piece.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a05f47]">
            Assembly
          </p>
          <h2 className="editorial-title mt-2 text-3xl">Hardware</h2>
          <p className="mt-2 text-sm text-[#7d7268]">
            Fasteners and supplies required to assemble the table.
          </p>
        </div>

        <div className="space-y-3">
          {plan.hardware.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#e2d8cc] bg-[#fcfaf6] p-4 transition-all hover:-translate-y-0.5 hover:border-[#cdbdaa] hover:bg-[#f7f1e8]"
            >
              <span className="text-sm font-medium text-[#4b4139]">
                {item.name}
              </span>
              <span className="shrink-0 text-sm text-[#94887d]">
                Qty {item.quantity}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
