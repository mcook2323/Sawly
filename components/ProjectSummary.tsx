import type { CostRange } from "@/calculations/materials";

interface ProjectSummaryProps {
  projectName: string;
  estimatedCostRange: CostRange | null;
  isReady: boolean;
  materialLabel: string;
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
}: ProjectSummaryProps) {
  const cost = estimatedCostRange
    ? `${formatCurrency(estimatedCostRange.minCents)}–${formatCurrency(
        estimatedCostRange.maxCents
      )}`
    : "—";

  return (
    <header>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a05f47]">
            <span className="h-px w-6 bg-[#a05f47]/70" />
            Custom project plan
          </div>
          <h1 className="editorial-title max-w-3xl text-4xl leading-[1.02] tracking-[-0.035em] text-[#332b25] sm:text-6xl lg:text-7xl">
            {projectName}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#71675f] sm:text-base">
            Configure the footprint, preview the proportions, and take a
            complete materials plan into the shop.
          </p>
          <p className="mt-3 text-sm font-semibold text-[#6f7b5b]">
            Planned in {materialLabel}
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

      <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#ddd2c4] bg-[#fffdf9] shadow-[0_10px_35px_rgba(91,70,49,0.06)] sm:grid-cols-3 lg:grid-cols-5">
        <div className="border-b border-r border-[#e5dbce] bg-[#f2e8da] p-4 sm:p-5 lg:border-b-0">
          <dt className="text-xs font-medium uppercase tracking-wider text-[#8a7e73]">
            Estimated cost
          </dt>
          <dd className="mt-2 text-lg font-semibold text-[#8d543e]">{cost}</dd>
        </div>
        {PROJECT_DETAILS.map((detail, index) => (
          <div
            key={detail.label}
            className={`p-4 sm:p-5 ${
              index < 3 ? "border-b border-[#e5dbce] lg:border-b-0" : ""
            } ${index !== PROJECT_DETAILS.length - 1 ? "border-r border-[#e5dbce]" : ""}`}
          >
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
