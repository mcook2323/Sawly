import type { CostRange, ShoppingList } from "@/calculations/materials";

interface ShoppingListPanelProps {
  shoppingList: ShoppingList;
}

function formatCurrency(cents: number) {
  return `$${Math.round(cents / 100)}`;
}

function formatCostRange(costRange: CostRange) {
  return `${formatCurrency(costRange.minCents)}-${formatCurrency(
    costRange.maxCents
  )}`;
}

export function ShoppingListPanel({
  shoppingList,
}: ShoppingListPanelProps) {
  return (
    <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Shopping List</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Buy these generic sizes, then cut them to the plan.
          </p>
        </div>

        <div className="rounded-lg bg-neutral-800 px-3 py-2 text-right">
          <div className="text-xs text-neutral-500">Est. Waste</div>
          <div className="font-semibold">
            {shoppingList.estimatedWastePercent}%
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
        <div className="text-sm font-semibold text-amber-300">
          Approximate Materials Cost
        </div>
        <div className="mt-1 text-2xl font-bold">
          {formatCostRange(shoppingList.estimatedCostRangeCents)}
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          Estimate uses average material prices only. Tools are listed as
          required but are not included in this range.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
            Lumber
          </h3>
          <div className="space-y-3">
            {shoppingList.lumber.map((item) => (
              <div
                key={`${item.material}-${item.dimensions}`}
                className="rounded-lg bg-neutral-800 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Covers {item.totalCutLengthInches}&quot; of cuts with
                      about {item.estimatedWastePercent}% waste.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-neutral-400">Qty {item.quantity}</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      {formatCostRange(item.estimatedLineCostRangeCents)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
            Hardware
          </h3>
          <div className="space-y-3">
            {shoppingList.hardware.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 rounded-lg bg-neutral-800 p-4"
              >
                <div>
                  <div>{item.name}</div>
                  <div className="mt-1 text-sm text-neutral-500">
                    Qty {item.quantity}
                  </div>
                </div>
                <span className="text-sm text-neutral-400">
                  {formatCostRange(item.estimatedLineCostRangeCents)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
            Tools Required
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {shoppingList.tools.map((item) => (
              <div key={item.name} className="rounded-lg bg-neutral-800 p-4">
                <div>{item.name}</div>
                <div className="mt-1 text-sm text-neutral-500">Required</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
