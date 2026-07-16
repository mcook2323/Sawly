import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface CustomConceptEntryProps {
  request: string;
  saved: boolean;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  onSave: () => void;
  onEdit: () => void;
}

export function CustomConceptEntry({ request, saved, generating, error, onGenerate, onSave, onEdit }: CustomConceptEntryProps) {
  return <section className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-ink)] text-[var(--color-surface)] shadow-[var(--shadow-lg)]" aria-live="polite">
    <div className="p-7 sm:p-10">
      <Badge tone="clay">AI Concept — Not Yet Build-Verified</Badge>
      <p className="ds-caption mt-6 text-[var(--color-sand)]">Your request</p>
      <h2 className="ds-heading mt-2 text-[var(--color-surface)]">“{request}”</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-sand)]">Sawly does not currently have a verified plan for this category. It can generate three distinct visual concept directions to help you explore layout, materials, budget, and style.</p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-sand)]">These concepts are design explorations—not construction plans—and require dimensional, structural, trade, and safety verification before building.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="primary" disabled={generating} onClick={onGenerate}>{generating ? "Generating 3 custom concepts…" : "Generate 3 Custom Concepts"}</Button>
        <Button variant="secondary" disabled={saved || generating} onClick={onSave}>{saved ? "Idea saved" : "Save Idea"}</Button>
        <Button variant="ghost" disabled={generating} onClick={onEdit} className="text-[var(--color-surface)]">Edit request</Button>
      </div>
      {generating && <div className="mt-6" role="status"><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-2/3 animate-pulse rounded-full bg-[var(--color-clay)]" /></div><p className="mt-3 text-sm text-[var(--color-sand)]">Creating three specifications and their concept imagery. This may take a moment.</p></div>}
      {error && <div className="mt-6 rounded-[var(--radius-md)] border border-red-300/40 bg-red-950/30 p-4" role="alert"><p className="text-sm leading-6">{error}</p><Button variant="secondary" className="mt-3" disabled={generating} onClick={onGenerate}>Retry generation</Button></div>}
    </div>
  </section>;
}
