"use client";

import Link from "next/link";
import { useState } from "react";
import { generateTablePlan } from "@/calculations/table";

export default function OutdoorTablePage() {
  const [length, setLength] = useState(72);
  const [width, setWidth] = useState(36);
  const [height, setHeight] = useState(30);

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
        <Link
          href="/"
          className="mb-8 inline-block text-amber-400 hover:text-amber-300"
        >
          ← Back to Projects
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Side */}
          <div>
            <div className="mb-6 h-80 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500">
              Outdoor Table Preview
            </div>

            <h1 className="mb-3 text-4xl font-bold">
              Modern Outdoor Table
            </h1>

            <p className="mb-8 text-neutral-300">
              Customize the dimensions below and Sawly will instantly generate
              your cut list and hardware list.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Length (in)
                </label>

                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Width (in)
                </label>

                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Height (in)
                </label>

                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3"
                />
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div>
            <div className="rounded-2xl bg-neutral-900 p-6 border border-neutral-800">
              <h2 className="mb-6 text-2xl font-bold">
                Cut List
              </h2>

              <div className="space-y-4">
                {plan.cutList.map((piece) => (
                  <div
                    key={piece.name}
                    className="rounded-xl bg-neutral-800 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        {piece.name}
                      </h3>

                      <span className="rounded-full bg-neutral-700 px-3 py-1 text-sm">
                        Qty {piece.quantity}
                      </span>
                    </div>

                    <p className="mt-2 text-neutral-300">
                      {piece.thickness}" × {piece.width}" ×{" "}
                      {piece.length}"
                    </p>

                    <p className="text-sm text-neutral-500 capitalize">
                      {piece.material}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-neutral-900 p-6 border border-neutral-800">
              <h2 className="mb-4 text-2xl font-bold">
                Hardware
              </h2>

              <div className="space-y-3">
                {plan.hardware.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-neutral-800 p-4"
                  >
                    <span>{item.name}</span>

                    <span className="text-neutral-400">
                      Qty {item.quantity}
                    </span>
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