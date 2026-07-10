import type { CostRange } from "@/calculations/materials";

interface ProjectSummaryProps {
  projectName: string;
  estimatedCostRange: CostRange | null;
  isReady: boolean;
  materialLabel: string;
  details?: Array<{ label: string; value: string }>;
}

function formatCurrency(cents: number) {
  return `$${Math.round(cents / 100)}`;
}

const PROJECT_DETAILS = [
  { label: "Build time", value: "6–8 hours" },
  { label: "Difficulty", value: "Intermediate" },
  { label: "Seats", value: "6 people" },
  { label: "Skill level", value: "Confident beginner" },
];

export function ProjectSummary({
  projectName,
  estimatedCostRange,
  isReady,
  materialLabel,
  details = PROJECT_DETAILS,
}: ProjectSummaryProps) {
  const cost = estimatedCostRange
    ? `${formatCurrency(estimatedCostRange.minCents)}–${formatCurrency(
        estimatedCostRange.maxCents
      )}`
    : "—";

  return (
    <header className="pt-2">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="ds-eyebrow mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="h-px w-6 bg-[var(--color-clay)]/70" />
            Custom project plan
            <span className="text-[#a99c90]">·</span>
            <span className="text-[#6f7b5b]">{materialLabel}</span>
          </div>
          <h1 className="ds-display max-w-4xl">
            {projectName}
          </h1>
          <p className="ds-body mt-5 max-w-2xl">
            Configure the footprint, preview the proportions, and take a
            complete materials plan into the shop.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm ${
            isReady
              ? "border-[#cbd8c2] bg-[var(--color-brand-soft)] text-[var(--color-success)]"
              : "border-[#dfb1a7] bg-[var(--color-clay-soft)] text-[var(--color-danger)]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isReady ? "bg-[#71805f]" : "bg-[#b75d4b]"
            }`}
          />
          {isReady ? "Plan ready" : "Check dimensions"}
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-5 gap-y-6 border-y border-[var(--color-border)] py-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8">
        <div>
          <dt className="ds-caption font-semibold uppercase tracking-wider">
            Estimated cost
          </dt>
          <dd className="mt-2 text-lg font-semibold text-[var(--color-clay)]">{cost}</dd>
        </div>
        {details.map((detail) => (
          <div key={detail.label}>
            <dt className="ds-caption font-semibold uppercase tracking-wider">
              {detail.label}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-[#4b4139] sm:text-base">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
