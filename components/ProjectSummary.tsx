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
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a05f47]">
            <span className="h-px w-6 bg-[#a05f47]/70" />
            Custom project plan
            <span className="text-[#a99c90]">·</span>
            <span className="text-[#6f7b5b]">{materialLabel}</span>
          </div>
          <h1 className="editorial-title max-w-3xl text-4xl leading-[1.02] tracking-[-0.035em] text-[#332b25] sm:text-6xl lg:text-7xl">
            {projectName}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#71675f] sm:text-base">
            Configure the footprint, preview the proportions, and take a
            complete materials plan into the shop.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm ${
            isReady
              ? "border-[#aeb99e] bg-[#e8eddf] text-[#596348]"
              : "border-[#dfb1a7] bg-[#f8e7e2] text-[#8a4b3f]"
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

      <dl className="mt-9 grid grid-cols-2 gap-x-5 gap-y-6 border-y border-[#ddd2c4] py-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-[#8a7e73]">
            Estimated cost
          </dt>
          <dd className="mt-2 text-lg font-semibold text-[#8d543e]">{cost}</dd>
        </div>
        {details.map((detail) => (
          <div key={detail.label}>
            <dt className="text-xs font-medium uppercase tracking-wider text-[#998d82]">
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
