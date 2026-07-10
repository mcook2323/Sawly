import type { ReactNode } from "react";
import type { CostRange } from "@/calculations/materials";
import { BackButton } from "@/components/BackButton";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
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
    <main className="print-root page-enter min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className="print-page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="print-hide">
          <div className="mb-8 grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[var(--color-border)] pb-5 sm:grid-cols-[1fr_auto_1fr]">
            <BackButton />
            <BrandLogo />
            <div className="col-span-2 flex justify-end sm:col-span-1">{headerAction}</div>
          </div>
          <ProjectSummary projectName={projectName} estimatedCostRange={estimatedCostRange} isReady={isReady} materialLabel={materialLabel} details={summaryDetails} />
          {gallery}
          {configuration}
        </div>
        {children}
      </div>
      <div className="print-hide mt-16"><SiteFooter /></div>
    </main>
  );
}
