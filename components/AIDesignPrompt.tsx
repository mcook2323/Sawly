"use client";

import { useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AI_EXAMPLE_PROMPTS } from "@/data/aiExamples";
import { Button } from "@/components/ui/Button";
import { shouldSubmitIdeaKey } from "@/lib/ai/promptSubmission";

interface AIDesignPromptProps { compact?: boolean; initialValue?: string; onPromptSubmit?: (prompt: string) => void; }

export function AIDesignPrompt({ compact = false, initialValue = "", onPromptSubmit }: AIDesignPromptProps) {
  const [prompt, setPrompt] = useState(initialValue);
  const [submitting, startSubmission] = useTransition();
  const router = useRouter();
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = prompt.trim().replace(/\s+/g, " ");
    if (!value || submitting) return;
    startSubmission(() => {
      if (onPromptSubmit) onPromptSubmit(value);
      else router.push(`/design?prompt=${encodeURIComponent(value)}`);
    });
  }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!shouldSubmitIdeaKey(event.key, event.shiftKey)) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
  return (
    <form onSubmit={submit} className={compact ? "" : "ai-prompt-shell"}>
      <label htmlFor={compact ? "design-prompt-compact" : "design-prompt"} className="ds-caption font-semibold text-[var(--color-ink)]">What would you like to build?</label>
      <div className={`mt-3 flex gap-3 ${compact ? "flex-col sm:flex-row" : "flex-col lg:flex-row"}`}>
        <textarea id={compact ? "design-prompt-compact" : "design-prompt"} rows={compact ? 2 : 3} value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={keyDown} placeholder="Describe the project, dimensions, material, or style…" className="ds-input min-h-24 flex-1 resize-none text-base leading-7 sm:text-lg" />
        <Button type="submit" variant="primary" disabled={!prompt.trim() || submitting} className="self-stretch px-7 lg:self-end">{submitting ? "Opening…" : "Explore design"}</Button>
      </div>
      {!compact && <div className="mt-5 flex flex-wrap gap-2" aria-label="Example project ideas">{AI_EXAMPLE_PROMPTS.map((example) => <button key={example} type="button" onClick={() => setPrompt(example)} className="ds-tag cursor-pointer transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]">{example}</button>)}</div>}
      <p className="ds-caption mt-4">Sawly matches supported ideas to verified plans. Unsupported ideas can be saved for later.</p>
    </form>
  );
}
