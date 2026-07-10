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
        <p className="ds-eyebrow">
          Step by step
        </p>
        <h2 className="ds-heading mt-3">{title}</h2>
        <p className="ds-body mt-3 max-w-2xl text-sm">
          {description}
        </p>
      </div>

      <ol className="space-y-4">
        {steps.map((step) => (
          <li
            key={step.number}
            className="build-step-card ds-card p-5 sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand)] font-semibold text-white">
                {step.number}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
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
                        className="ds-tag"
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
                        ? "border-[#dfb1a7] bg-[var(--color-clay-soft)] text-[var(--color-danger)]"
                        : "border-[#c7d0ba] bg-[var(--color-brand-soft)] text-[var(--color-success)]"
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
