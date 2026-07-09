"use client";

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
    <main className="max-w-5xl mx-auto p-10">

      <h1 className="text-4xl font-bold mb-8">
        Outdoor Table Generator
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div>

          <label>Length</label>

          <input
            className="border p-2 w-full"
            type="number"
            value={length}
            onChange={(e) =>
              setLength(Number(e.target.value))
            }
          />

        </div>

        <div>

          <label>Width</label>

          <input
            className="border p-2 w-full"
            type="number"
            value={width}
            onChange={(e) =>
              setWidth(Number(e.target.value))
            }
          />

        </div>

        <div>

          <label>Height</label>

          <input
            className="border p-2 w-full"
            type="number"
            value={height}
            onChange={(e) =>
              setHeight(Number(e.target.value))
            }
          />

        </div>

      </div>

      <div className="mt-12">

        <h2 className="text-2xl font-bold mb-4">
          Cut List
        </h2>

        {plan.cutList.map((piece) => (
          <div
            key={piece.name}
            className="border rounded p-4 mb-3"
          >
            <strong>{piece.name}</strong>

            <div>Qty: {piece.quantity}</div>

            <div>
              {piece.thickness}" × {piece.width}" × {piece.length}"
            </div>

            <div>{piece.material}</div>

          </div>
        ))}

      </div>

    </main>
  );
}