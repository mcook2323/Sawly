export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`ds-skeleton ${className}`} />;
}
