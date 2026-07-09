"use client";

import Link from "next/link";
import { useState } from "react";
import { generateTablePlan } from "@/calculations/table";
import { generateShoppingList } from "@/calculations/materials";
import { PrintablePlan } from "@/components/PrintablePlan";
import { ShoppingListPanel } from "@/components/ShoppingListPanel";
import { TablePreview } from "@/components/TablePreview";

const DIMENSION_RULES = {
  length: {
    label: "Length",
    min: 36,
    max: 144,
  },
  width: {
    label: "Width",
    min: 24,
    max: 60,
  },
  height: {
    label: "Height",
    min: 18,
    max: 42,
  },
};

function validateDimension(
  value: string,
  rule: (typeof DIMENSION_RULES)[keyof typeof DIMENSION_RULES]
) {
  if (value.trim() === "") {
    return `${rule.label} is required.`;
  }

  const measurement = Number(value);

  if (!Number.isFinite(measurement)) {
    return `${rule.label} must be a number.`;
  }

  if (measurement < rule.min || measurement > rule.max) {
    return `${rule.label} must be ${rule.min}-${rule.max} inches.`;
  }

  return null;
}

export default function OutdoorTablePage() {
  const [lengthInput, setLengthInput] = useState("72");
  const [widthInput, setWidthInput] = useState("36");
  const [heightInput, setHeightInput] = useState("30");

  const length = Number(lengthInput) || 0;
  const width = Number(widthInput) || 0;
  const height = Number(heightInput) || 0;

  const validationErrors = [
    validateDimension(lengthInput, DIMENSION_RULES.length),
    validateDimension(widthInput, DIMENSION_RULES.width),
    validateDimension(heightInput, DIMENSION_RULES.height),
  ].filter((error): error is string => error !== null);

  const isValidPlan = validationErrors.length === 0;

  const plan = isValidPlan
    ? generateTablePlan({
        length,
        width,
        height,
        wood: "pine",
        style: "modern",
      })
    : null;

  const shoppingList = plan
    ? generateShoppingList(plan.cutList, plan.hardware)
    : null;

  return (
    <main className="print-root min-h-screen bg-neutral-950 text-white">
      <div className="print-page-shell mx-auto max-w-6xl px-6 py-12">
        <div className="print-hide">
          <Link
            href="/"
            className="mb-8 inline-block text-amber-400 hover:text-amber-300"
          >
            ← Back to Projects
          </Link>

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <TablePreview length={length} width={width} height={height} />

              <h1 className="mb-3 mt-6 text-4xl font-bold">
                Modern Outdoor Table
              </h1>

              <p className="mb-8 text-neutral-300">
                Customize the dimensions below and Sawly will instantly
                generate your cut list, materials, and hardware list.
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    Length (in)
                  </label>
                  <input
                    type="number"
                    min={DIMENSION_RULES.length.min}
                    max={DIMENSION_RULES.length.max}
                    value={lengthInput}
                    onChange={(e) => setLengthInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                  />
                  {validateDimension(lengthInput, DIMENSION_RULES.length) && (
                    <p className="mt-2 text-sm text-red-300">
                      {validateDimension(lengthInput, DIMENSION_RULES.length)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    Width (in)
                  </label>
                  <input
                    type="number"
                    min={DIMENSION_RULES.width.min}
                    max={DIMENSION_RULES.width.max}
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                  />
                  {validateDimension(widthInput, DIMENSION_RULES.width) && (
                    <p className="mt-2 text-sm text-red-300">
                      {validateDimension(widthInput, DIMENSION_RULES.width)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    Height (in)
                  </label>
                  <input
                    type="number"
                    min={DIMENSION_RULES.height.min}
                    max={DIMENSION_RULES.height.max}
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                  />
                  {validateDimension(heightInput, DIMENSION_RULES.height) && (
                    <p className="mt-2 text-sm text-red-300">
                      {validateDimension(heightInput, DIMENSION_RULES.height)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              {!plan || !shoppingList ? (
                <div className="rounded-2xl border border-red-900/60 bg-neutral-900 p-6">
                  <h2 className="mb-3 text-2xl font-bold">Check dimensions</h2>
                  <p className="text-neutral-300">
                    Enter dimensions within the supported range to generate the
                    shopping list, cut list, and hardware.
                  </p>
                </div>
              ) : (
                <>
                  <ShoppingListPanel shoppingList={shoppingList} />

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
                    <h2 className="mb-6 text-2xl font-bold">Cut List</h2>

                    <div className="space-y-4">
                      {plan.cutList.map((piece) => (
                        <div
                          key={piece.name}
                          className="rounded-xl bg-neutral-800 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                              {piece.name}
                            </h3>
                            <span className="rounded-full bg-neutral-700 px-3 py-1 text-sm">
                              Qty {piece.quantity}
                            </span>
                          </div>

                          <p className="mt-2 text-neutral-300">
                            {piece.thickness}&quot; × {piece.width}&quot; ×{" "}
                            {piece.length}&quot;
                          </p>

                          <p className="text-sm capitalize text-neutral-500">
                            {piece.material}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {plan && shoppingList && (
          <PrintablePlan plan={plan} shoppingList={shoppingList} />
        )}
      </div>
    </main>
  );
}
