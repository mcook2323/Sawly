"use client";

import Link from "next/link";
import { useState } from "react";
import { generateTablePlan } from "@/calculations/table";
import { TablePreview } from "@/components/TablePreview";

export default function OutdoorTablePage() {
  const [lengthInput, setLengthInput] = useState("72");
  const [widthInput, setWidthInput] = useState("36");
  const [heightInput, setHeightInput] = useState("30");

  const length = Number(lengthInput) || 0;
  const width = Number(widthInput) || 0;
  const height = Number(heightInput) || 0;

  const plan = generateTablePlan({
    length,
    width,
    height,
    wood: "pine",
    style: "modern",
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/" className="mb-8 inline-block text-amber-400 hover:text-amber-300">
          ← Back to Projects
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <TablePreview length={length} width={width} height={height} />

            <h1 className="mb-3 mt-6 text-4xl font-bold">Modern Outdoor Table</h1>

            <p className="mb-8 text-neutral-300">
              Customize the dimensions below and Sawly will instantly generate your cut list and hardware list.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-2 block text-sm text-neutral-400">Length (in)</label>
                <input
                  type="number"
                  value={lengthInput}
                  onChange={(e) => setLengthInput(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">Width (in)</label>
                <input
                  type="number"
                  value={widthInput}
                  onChange={(e) => setWidthInput(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">Height (in)</label>
                <input
                  type="number"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-6 text-2xl font-bold">Cut List</h2>

              <div className="space-y-4">
                {plan.cutList.map((piece) => (
                  <div key={piece.name} className="rounded-xl bg-neutral-800 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{piece.name}</h3>
                      <span className="rounded-full bg-neutral-700 px-3 py-1 text-sm">
                        Qty {piece.quantity}
                      </span>
                    </div>

                    <p className="mt-2 text-neutral-300">
                      {piece.thickness}" × {piece.width}" × {piece.length}"
                    </p>

                    <p className="text-sm capitalize text-neutral-500">{piece.material}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">Hardware</h2>

              <div className="space-y-3">
                {plan.hardware.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg bg-neutral-800 p-4">
                    <span>{item.name}</span>
                    <span className="text-neutral-400">Qty {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}