"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AI_EXAMPLE_PROMPTS } from "@/data/aiExamples";
import { Button } from "@/components/ui/Button";

interface AIDesignPromptProps { compact?: boolean; initialValue?: string; }

export function AIDesignPrompt({ compact = false, initialValue = "" }: AIDesignPromptProps) {
  const [prompt, setPrompt] = useState(initialValue);
  const router = useRouter();
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = prompt.trim();
    if (value) router.push(`/design?prompt=${encodeURIComponent(value)}`);
  }
  return (
    <form onSubmit={submit} className={compact ? "" : "ai-prompt-shell"}>
      <label htmlFor={compact ? "design-prompt-compact" : "design-prompt"} className="ds-caption font-semibold text-[var(--color-ink)]">What would you like to build?</label>
      <div className={`mt-3 flex gap-3 ${compact ? "flex-col sm:flex-row" : "flex-col lg:flex-row"}`}>
        <textarea id={compact ? "design-prompt-compact" : "design-prompt"} rows={compact ? 2 : 3} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the project, dimensions, material, or style…" className="ds-input min-h-24 flex-1 resize-none text-base leading-7 sm:text-lg" />
        <Button type="submit" variant="primary" disabled={!prompt.trim()} className="self-stretch px-7 lg:self-end">Explore design</Button>
      </div>
      {!compact && <div className="mt-5 flex flex-wrap gap-2" aria-label="Example project ideas">{AI_EXAMPLE_PROMPTS.map((example) => <button key={example} type="button" onClick={() => setPrompt(example)} className="ds-tag cursor-pointer transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]">{example}</button>)}</div>}
      <p className="ds-caption mt-4">Sawly currently matches your idea to supported project templates. Custom AI-generated plans are coming later.</p>
    </form>
  );
}
