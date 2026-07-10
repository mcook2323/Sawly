import type { BuildStep } from "@/data/buildSteps";

interface BuildStepsPanelProps {
  steps: BuildStep[];
  title?: string;
  description?: string;
}

export function BuildStepsPanel({
  steps,
  title = "Build steps",
  description = "Work through the project in order and verify each stage before continuing.",
}: BuildStepsPanelProps) {
  return (
    <section>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a05f47]">
          Step by step
        </p>
        <h2 className="editorial-title mt-2 text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d7268]">
          {description}
        </p>
      </div>

      <ol className="space-y-4">
        {steps.map((step) => (
          <li
            key={step.number}
            className="build-step-card rounded-2xl border border-[#e2d8cc] bg-[#fcfaf6] p-5 sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#667154] font-semibold text-white">
                {step.number}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#443a32]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6f655c]">
                  {step.instructions}
                </p>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d8176]">
                    Parts and supplies
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {step.parts.map((part) => (
                      <li
                        key={part}
                        className="rounded-full border border-[#ddd1c3] bg-[#f3ece2] px-3 py-1.5 text-xs text-[#665b51]"
                      >
                        {part}
                      </li>
                    ))}
                  </ul>
                </div>

                {step.note && (
                  <aside
                    className={`mt-4 rounded-xl border p-3 text-sm leading-6 ${
                      step.note.type === "caution"
                        ? "border-[#dfb1a7] bg-[#f8e7e2] text-[#7f493f]"
                        : "border-[#c7d0ba] bg-[#edf1e7] text-[#5d684f]"
                    }`}
                  >
                    <span className="font-semibold">
                      {step.note.type === "caution" ? "Caution: " : "Helpful tip: "}
                    </span>
                    {step.note.text}
                  </aside>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
