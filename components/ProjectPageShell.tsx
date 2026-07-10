import type { ReactNode } from "react";
import type { CostRange } from "@/calculations/materials";
import { BackButton } from "@/components/BackButton";
import { ProjectSummary } from "@/components/ProjectSummary";

interface ProjectPageShellProps {
  projectName: string;
  materialLabel: string;
  estimatedCostRange: CostRange | null;
  isReady: boolean;
  summaryDetails: Array<{ label: string; value: string }>;
  headerAction?: ReactNode;
  gallery: ReactNode;
  configuration: ReactNode;
  children: ReactNode;
}

export function ProjectPageShell({ projectName, materialLabel, estimatedCostRange, isReady, summaryDetails, headerAction, gallery, configuration, children }: ProjectPageShellProps) {
  return (
    <main className="print-root min-h-screen bg-[#f7f3eb] text-[#332b25]">
      <div className="print-page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="print-hide">
          <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
            <BackButton />
            {headerAction}
          </div>
          <ProjectSummary projectName={projectName} estimatedCostRange={estimatedCostRange} isReady={isReady} materialLabel={materialLabel} details={summaryDetails} />
          {gallery}
          {configuration}
        </div>
        {children}
      </div>
    </main>
  );
}
