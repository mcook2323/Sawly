import { BrandLogo } from "@/components/BrandLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="ds-container grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div><BrandLogo /><p className="ds-caption mt-4 max-w-md">Practical, configurable DIY plans for homeowners who want to build with more confidence.</p></div>
        <div className="text-left sm:text-right"><p className="ds-caption">Verify every measurement before cutting.</p><p className="ds-caption mt-1">© 2026 Sawly</p></div>
      </div>
    </footer>
  );
}
