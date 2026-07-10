import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" aria-label="Sawly home" className="group inline-flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[0.6rem] bg-[var(--color-brand)] text-white shadow-sm">
        <span className="absolute inset-x-1.5 top-2 h-px rotate-[-18deg] bg-white/45" />
        <span className="text-sm font-bold tracking-[-0.08em]">S</span>
      </span>
      <span className="text-xl font-semibold tracking-[-0.035em] text-[var(--color-ink)]">Sawly</span>
    </Link>
  );
}
