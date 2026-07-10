import type { ShoppingList } from "@/calculations/materials";
import type { GeneratedTablePlan } from "@/calculations/table";
import { getMaterialLabel } from "@/calculations/materialCatalog";
import type { BuildStep } from "@/data/buildSteps";
import { BuildStepsPanel } from "@/components/BuildStepsPanel";

interface PrintablePlanProps {
  plan: GeneratedTablePlan;
  shoppingList: ShoppingList;
  buildSteps: BuildStep[];
}

export function PrintablePlan({
  plan,
  shoppingList,
  buildSteps,
}: PrintablePlanProps) {
  return (
    <section className="printable-plan rounded-[2rem] border border-[#ddd2c4] bg-[#fffdf9] p-5 text-[#332b25] shadow-[0_18px_55px_rgba(91,70,49,0.09)] sm:p-8">
      <div className="print-hide mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#a05f47]">
            Printable Plan
          </p>
          <p className="mt-1 text-[#7d7268]">
            A clean shop copy of your generated plan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="cursor-pointer rounded-full bg-[#667154] px-5 py-3 font-semibold text-white shadow-lg shadow-[#667154]/15 transition-all hover:-translate-y-0.5 hover:bg-[#566146] hover:shadow-xl"
        >
          Print Plan
        </button>
      </div>

      <div className="print-plan-content rounded-2xl border border-[#e2d8cc] bg-[#fcfaf6] p-5 sm:p-8">
        <header className="print-plan-header border-b border-[#d8ccbd] pb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#a05f47]">
            Sawly Project Plan
          </p>
          <h2 className="editorial-title mt-2 text-4xl">{plan.projectName}</h2>
          <p className="mt-2 text-[#7d7268]">
            {plan.inputs.length}&quot; L × {plan.inputs.width}&quot; W ×{" "}
            {plan.inputs.height}&quot; H · {getMaterialLabel(plan.inputs.wood)}
          </p>
        </header>

        <div className="print-plan-grid mt-8 grid gap-8 lg:grid-cols-2">
          <section className="print-plan-section">
            <h3 className="mb-3 text-xl font-bold">Shopping List</h3>
            <div className="space-y-2">
              {shoppingList.lumber.map((item) => (
                <div
                  key={`${item.material}-${item.dimensions}`}
                  className="print-plan-row flex items-start justify-between gap-4 border-b border-[#e2d8cc] py-2"
                >
                  <span>{item.name}</span>
                  <span className="shrink-0 text-[#7d7268]">
                    Qty {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="print-plan-section">
            <h3 className="mb-3 text-xl font-bold">Cut List</h3>
            <div className="space-y-2">
              {plan.cutList.map((piece) => (
                <div
                  key={piece.name}
                  className="print-plan-row border-b border-[#e2d8cc] py-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span>{piece.name}</span>
                    <span className="shrink-0 text-[#7d7268]">
                      Qty {piece.quantity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#7d7268]">
                    {piece.thickness}&quot; × {piece.width}&quot; ×{" "}
                    {piece.length}&quot; · {getMaterialLabel(piece.material)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="print-plan-section">
            <h3 className="mb-3 text-xl font-bold">Hardware</h3>
            <div className="space-y-2">
              {plan.hardware.map((item) => (
                <div
                  key={item.name}
                  className="print-plan-row flex items-start justify-between gap-4 border-b border-[#e2d8cc] py-2"
                >
                  <span>{item.name}</span>
                  <span className="shrink-0 text-[#7d7268]">
                    Qty {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="print-plan-section">
            <h3 className="mb-3 text-xl font-bold">Tools Required</h3>
            <ul className="grid list-inside list-disc gap-x-6 gap-y-2 sm:grid-cols-2">
              {shoppingList.tools.map((tool) => (
                <li key={tool.name}>{tool.name}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="print-plan-note mt-8 rounded-xl border border-[#c7d0ba] bg-[#edf1e7] p-4">
          <h3 className="font-bold">Verify before cutting</h3>
          <p className="mt-1 text-sm text-[#66705b]">
            Confirm all measurements against your actual materials before
            making cuts. Wear appropriate eye and hearing protection, secure
            each workpiece, and follow the manufacturer instructions for your
            tools.
          </p>
        </aside>

        <div className="print-build-steps mt-8 border-t border-[#d8ccbd] pt-8">
          <BuildStepsPanel
            steps={buildSteps}
            title="Build steps"
            description="Complete each stage in order and verify your work before moving ahead."
          />
        </div>
      </div>
    </section>
  );
}
