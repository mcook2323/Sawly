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
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="ds-eyebrow">
            Materials
          </p>
          <h2 className="ds-heading mt-3">
            Shopping list
          </h2>
          <p className="mt-2 text-sm text-[#7d7268]">
            Buy these generic sizes, then cut them to the plan.
          </p>
        </div>

        <div className="rounded-xl border border-[#d7cbbd] bg-[#f2ebe1] px-3 py-2 text-right">
          <div className="text-xs text-[#94887d]">Est. Waste</div>
          <div className="font-semibold">
            {shoppingList.estimatedWastePercent}%
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-3 rounded-2xl border border-[#d4c3ad] bg-[#f1e5d4] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
        <div>
          <div className="text-sm font-semibold text-[#8d543e]">
            Approximate Materials Cost
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#766a60]">
            Estimate uses average material prices only. Tools are listed as
            required but are not included in this range.
          </p>
        </div>
        <div className="text-3xl font-semibold tracking-tight text-[#4a3d34] sm:text-right">
          {formatCostRange(shoppingList.estimatedCostRangeCents)}
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#6f7b5b]">
            Lumber
          </h3>
          <div className="space-y-3">
            {shoppingList.lumber.map((item) => (
              <div
                key={`${item.material}-${item.dimensions}`}
                className="ds-card ds-card-interactive p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="mt-1 text-sm text-[#94887d]">
                      Covers {item.totalCutLengthInches}&quot; of cuts with
                      about {item.estimatedWastePercent}% waste.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#766a60]">Qty {item.quantity}</div>
                    <div className="mt-1 text-sm text-[#94887d]">
                      {formatCostRange(item.estimatedLineCostRangeCents)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#6f7b5b]">
            Hardware
          </h3>
          <div className="space-y-3">
            {shoppingList.hardware.map((item) => (
              <div
                key={item.name}
                className="ds-card ds-card-interactive flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <div>{item.name}</div>
                  <div className="mt-1 text-sm text-[#94887d]">
                    Qty {item.quantity}
                  </div>
                </div>
                <span className="text-sm text-[#766a60]">
                  {formatCostRange(item.estimatedLineCostRangeCents)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#6f7b5b]">
            Tools Required
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {shoppingList.tools.map((item) => (
              <div
                key={item.name}
                className="ds-card p-4 transition-colors hover:border-[var(--color-border-strong)]"
              >
                <div>{item.name}</div>
                <div className="mt-1 text-sm text-[#94887d]">Required</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
