import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface CustomConceptEntryProps {
  aiEnabled: boolean;
  request: string;
  saved: boolean;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  onSave: () => void;
  onEdit: () => void;
}

export function CustomConceptEntry({ aiEnabled, request, saved, generating, error, onGenerate, onSave, onEdit }: CustomConceptEntryProps) {
  return <section className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-ink)] text-[var(--color-surface)] shadow-[var(--shadow-lg)]" aria-live="polite">
    <div className="p-7 sm:p-10">
      <Badge tone="clay">{aiEnabled ? "AI Concept — Not Yet Build-Verified" : "Deterministic mode · custom AI disabled"}</Badge>
      <p className="ds-caption mt-6 text-[var(--color-sand)]">Your request</p>
      <h2 className="ds-heading mt-2 text-[var(--color-surface)]">“{request}”</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-sand)]">Sawly does not currently have a verified plan for this category. {aiEnabled ? "It can generate three distinct visual concept directions to help you explore layout, materials, budget, and style." : "Custom AI concept generation is disabled in this deployment."}</p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-sand)]">{aiEnabled ? "These concepts are design explorations—not construction plans—and require dimensional, structural, trade, and safety verification before building." : "You can save this idea locally and continue using Sawly’s verified Outdoor Table and Outdoor Bench planners without paid AI."}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {aiEnabled && <Button variant="primary" disabled={generating} onClick={onGenerate}>{generating ? "Generating 3 custom concepts…" : "Generate 3 Custom Concepts"}</Button>}
        <Button variant="secondary" disabled={saved || generating} onClick={onSave}>{saved ? "Idea saved" : "Save Idea"}</Button>
        <Button variant="ghost" disabled={generating} onClick={onEdit} className="text-[var(--color-surface)]">Edit request</Button>
      </div>
      {aiEnabled && generating && <div className="mt-6" role="status"><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-2/3 animate-pulse rounded-full bg-[var(--color-clay)]" /></div><ul className="mt-4 grid gap-2 text-sm text-[var(--color-sand)]"><li>Understanding your idea</li><li>Creating three design directions</li><li>Opening your design workspace</li></ul><p className="mt-3 text-xs text-[var(--color-sand)]">The workspace opens as soon as the structured concepts are ready. Images are optional and generated separately.</p></div>}
      {error && <div className="mt-6 rounded-[var(--radius-md)] border border-red-300/40 bg-red-950/30 p-4" role="alert"><p className="text-sm leading-6">{error}</p><Button variant="secondary" className="mt-3" disabled={generating} onClick={onGenerate}>Retry generation</Button></div>}
    </div>
  </section>;
}
