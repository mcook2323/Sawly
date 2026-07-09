import type { ShoppingList } from "@/calculations/materials";
import type { GeneratedTablePlan } from "@/calculations/table";

interface PrintablePlanProps {
  plan: GeneratedTablePlan;
  shoppingList: ShoppingList;
}

export function PrintablePlan({
  plan,
  shoppingList,
}: PrintablePlanProps) {
  return (
    <section className="printable-plan mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8">
      <div className="print-hide mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Printable Plan
          </p>
          <p className="mt-1 text-neutral-400">
            A clean shop copy of your generated plan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="cursor-pointer rounded-lg bg-amber-400 px-5 py-3 font-semibold text-neutral-950 transition-colors hover:bg-amber-300"
        >
          Print Plan
        </button>
      </div>

      <div className="print-plan-content rounded-xl bg-neutral-800 p-6 sm:p-8">
        <header className="print-plan-header border-b border-neutral-600 pb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Sawly Project Plan
          </p>
          <h2 className="mt-2 text-3xl font-bold">{plan.projectName}</h2>
          <p className="mt-2 text-neutral-400">
            {plan.inputs.length}&quot; L × {plan.inputs.width}&quot; W ×{" "}
            {plan.inputs.height}&quot; H
          </p>
        </header>

        <div className="print-plan-grid mt-8 grid gap-8 lg:grid-cols-2">
          <section className="print-plan-section">
            <h3 className="mb-3 text-xl font-bold">Shopping List</h3>
            <div className="space-y-2">
              {shoppingList.lumber.map((item) => (
                <div
                  key={`${item.material}-${item.dimensions}`}
                  className="print-plan-row flex items-start justify-between gap-4 border-b border-neutral-700 py-2"
                >
                  <span>{item.name}</span>
                  <span className="shrink-0 text-neutral-400">
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
                  className="print-plan-row border-b border-neutral-700 py-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span>{piece.name}</span>
                    <span className="shrink-0 text-neutral-400">
                      Qty {piece.quantity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-400">
                    {piece.thickness}&quot; × {piece.width}&quot; ×{" "}
                    {piece.length}&quot; · {piece.material}
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
                  className="print-plan-row flex items-start justify-between gap-4 border-b border-neutral-700 py-2"
                >
                  <span>{item.name}</span>
                  <span className="shrink-0 text-neutral-400">
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

        <aside className="print-plan-note mt-8 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
          <h3 className="font-bold">Verify before cutting</h3>
          <p className="mt-1 text-sm text-neutral-300">
            Confirm all measurements against your actual materials before
            making cuts. Wear appropriate eye and hearing protection, secure
            each workpiece, and follow the manufacturer instructions for your
            tools.
          </p>
        </aside>
      </div>
    </section>
  );
}
