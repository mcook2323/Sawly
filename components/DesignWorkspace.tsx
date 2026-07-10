"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AIDesignPrompt } from "@/components/AIDesignPrompt";
import { BrandLogo } from "@/components/BrandLogo";
import { ProjectImage } from "@/components/ProjectImage";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge, Tag } from "@/components/ui/Badge";
import { buttonClassName, Button } from "@/components/ui/Button";
import { getProject } from "@/data/projects";
import { getConversationQuestions, updateConversationAnswer } from "@/lib/ai/conversation";
import { scoreDesignProfile } from "@/lib/ai/guidedMatcher";
import { parseDesignRequest } from "@/lib/ai/parser";
import { buildDesignProfile } from "@/lib/ai/profile";
import { saveDesignRequest } from "@/lib/ai/savedRequests";
import { normalizePrompt } from "@/lib/ai/savedRequests";
import { decideConversationSubmission, readConversationSnapshots, removeConversationSnapshot, restartAllowed, writeConversationSnapshot, type ConversationSnapshot } from "@/lib/ai/conversationSession";
import type { DesignAnswers, DesignAnswerValue, DesignQuestion, DesignQuestionId, RankedTemplateMatch } from "@/types/ai";

function templateHref(projectHref: string, match: RankedTemplateMatch) {
  const params = new URLSearchParams();
  Object.entries(match.prefill.dimensions).forEach(([key, value]) => params.set(key, String(value)));
  if (match.prefill.material) params.set("material", match.prefill.material);
  params.set("source", "design");
  return `${projectHref}?${params}`;
}

function answerLabel(question: DesignQuestion, value: DesignAnswerValue) {
  return question.options?.find((option) => option.value === String(value))?.label ?? String(value);
}

function withoutAnswer(answers: DesignAnswers, id: DesignQuestionId) {
  return Object.fromEntries(Object.entries(answers).filter(([key]) => key !== id)) as DesignAnswers;
}

function AnswerControl({ question, onAnswer }: { question: DesignQuestion; onAnswer: (value: DesignAnswerValue) => void }) {
  const [value, setValue] = useState("");
  if (question.type === "choice") return <div className="grid gap-3 sm:grid-cols-2">{question.options?.map((option) => <Button key={option.value} variant="secondary" className="justify-start text-left" onClick={() => onAnswer(option.value)}>{option.label}</Button>)}</div>;
  return <form onSubmit={(event) => { event.preventDefault(); const next = question.type === "number" ? Number(value) : value.trim(); if (next !== "" && (!Number.isNaN(next))) onAnswer(next); }}><label className="sr-only" htmlFor={`answer-${question.id}`}>{question.prompt}</label><input id={`answer-${question.id}`} type={question.type === "number" ? "number" : "text"} min={question.type === "number" ? 1 : undefined} value={value} onChange={(event) => setValue(event.target.value)} placeholder={question.type === "dimensions" ? "72 × 36 × 30" : "Tell us in a few words"} className="ds-input" autoFocus /><div className="mt-4 flex gap-3"><Button type="submit" variant="primary" disabled={!value.trim()}>Continue</Button>{!question.required && <Button type="button" variant="ghost" onClick={() => onAnswer("skip")}>Not sure</Button>}</div></form>;
}

export function DesignWorkspace({ initialPrompt }: { initialPrompt: string }) {
  const router = useRouter();
  const [activePrompt, setActivePrompt] = useState(() => normalizePrompt(initialPrompt));
  const [answers, setAnswers] = useState<DesignAnswers>({});
  const [answerOrder, setAnswerOrder] = useState<DesignQuestionId[]>([]);
  const [editing, setEditing] = useState<DesignQuestionId | null>(null);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const request = useMemo(() => parseDesignRequest(activePrompt), [activePrompt]);
  const profile = useMemo(() => buildDesignProfile(request, answers), [request, answers]);
  const pending = getConversationQuestions(profile, answers);
  const editingAnswers = editing ? withoutAnswer(answers, editing) : answers;
  const editingQuestion = editing ? getConversationQuestions(buildDesignProfile(request, editingAnswers), editingAnswers).find((question) => question.id === editing) : null;
  const question = editingQuestion ?? pending[0] ?? null;
  const complete = !question;
  const resolution = complete ? scoreDesignProfile(profile) : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const snapshot = readConversationSnapshots().find((item) => item.normalizedPrompt === normalizePrompt(initialPrompt));
      if (snapshot) { setActivePrompt(snapshot.prompt); setAnswers(snapshot.answers); setAnswerOrder(snapshot.answerOrder); }
      else { setActivePrompt(initialPrompt.trim().replace(/\s+/g, " ")); setAnswers({}); setAnswerOrder([]); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialPrompt]);

  useEffect(() => {
    if (!hydrated || !activePrompt) return;
    writeConversationSnapshot({ prompt: activePrompt, normalizedPrompt: normalizePrompt(activePrompt), answers, answerOrder, completed: complete, updatedAt: new Date().toISOString() });
  }, [activePrompt, answerOrder, answers, complete, hydrated]);

  function answer(value: DesignAnswerValue) {
    if (!question) return;
    const updated = updateConversationAnswer(answers, answerOrder, question.id, value);
    setAnswers(updated.answers);
    setAnswerOrder(updated.order);
    setEditing(null);
  }

  function submitIdea(prompt: string) {
    const current: ConversationSnapshot | null = activePrompt ? { prompt: activePrompt, normalizedPrompt: normalizePrompt(activePrompt), answers, answerOrder, completed: complete, updatedAt: new Date().toISOString() } : null;
    const next = decideConversationSubmission(current, prompt, readConversationSnapshots());
    if (next.snapshot) {
      setActivePrompt(next.snapshot.prompt); setAnswers(next.snapshot.answers); setAnswerOrder(next.snapshot.answerOrder);
    } else {
      setActivePrompt(prompt); setAnswers({}); setAnswerOrder([]);
    }
    setEditing(null); setSaved(false);
    if (normalizePrompt(prompt) !== normalizePrompt(activePrompt)) router.replace(`/design?prompt=${encodeURIComponent(prompt)}`);
  }

  function restart() {
    const confirmed = answerOrder.length === 0 || window.confirm("Restart this design? Your answers will be discarded.");
    if (!restartAllowed(answerOrder.length, confirmed)) return;
    removeConversationSnapshot(activePrompt); setAnswers({}); setAnswerOrder([]); setEditing(null); setSaved(false);
  }

  return <main className="page-enter min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]"><div className="ds-container flex items-center justify-between py-4"><BrandLogo /><Link href="/#catalog" className={buttonClassName("ghost")}>Browse projects</Link></div></header>
    <section className="ds-container ds-section">
      <div className="mx-auto max-w-6xl"><p className="ds-eyebrow">Guided AI Designer</p><h1 className="ds-heading mt-3">Let&apos;s shape the right project together.</h1><p className="ds-body mt-3 max-w-2xl">Sawly asks a few practical questions, builds a design profile, and compares it with verified templates. No external AI service is used yet.</p><div className="mt-8 max-w-5xl"><AIDesignPrompt key={activePrompt || "empty"} compact initialValue={activePrompt} onPromptSubmit={submitIdea} /></div></div>
      {!activePrompt ? null : <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="ds-card p-5"><p className="ds-caption font-semibold">Your idea</p><p className="mt-2 font-semibold">“{activePrompt}”</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--color-canvas-muted)]"><div className="h-full rounded-full bg-[var(--color-brand)] transition-all" style={{ width: `${complete ? 100 : Math.max(12, Math.round(answerOrder.length / Math.max(answerOrder.length + pending.length, 1) * 100))}%` }} /></div><div className="mt-2 flex items-center justify-between gap-3"><p className="ds-caption">{complete ? "Profile complete" : `${answerOrder.length} answers added`}</p><button type="button" onClick={restart} className="text-xs font-semibold text-[var(--color-danger)] hover:underline">Restart design</button></div></div>
          {answerOrder.length > 0 && <div className="mt-4 space-y-2" aria-label="Conversation history">{answerOrder.map((id) => { const value = answers[id]; if (value === undefined) return null; const prior = withoutAnswer(answers, id); const q = getConversationQuestions(buildDesignProfile(request, prior), prior).find((item) => item.id === id); return <div key={id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><p className="ds-caption">{q?.prompt ?? id}</p><div className="mt-1 flex items-center justify-between gap-3"><p className="text-sm font-semibold">{q ? answerLabel(q, value) : String(value)}</p><button type="button" onClick={() => setEditing(id)} className="text-xs font-semibold text-[var(--color-brand)] hover:underline">Edit</button></div></div>; })}</div>}
        </aside>
        <div>
          {!complete && question ? <section className="ds-card p-6 shadow-[var(--shadow-md)] sm:p-8" aria-live="polite"><Badge tone="clay">Sawly asks</Badge><h2 className="ds-subheading mt-5">{question.prompt}</h2>{question.helpText && <p className="ds-body mt-2">{question.helpText}</p>}<div className="mt-6"><AnswerControl key={`${question.id}-${editing ?? "new"}`} question={question} onAnswer={answer} /></div></section> : resolution && <DesignRecommendations resolution={resolution} saved={saved} onSave={() => { saveDesignRequest({ prompt: request.raw, parsed: request, designProfile: profile }); setSaved(true); }} />}
        </div>
      </div>}
    </section><SiteFooter />
  </main>;
}

function DesignRecommendations({ resolution, saved, onSave }: { resolution: ReturnType<typeof scoreDesignProfile>; saved: boolean; onSave: () => void }) {
  const percent = Math.round(resolution.confidence * 100);
  return <section><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge tone={resolution.band === "high" ? "success" : resolution.band === "medium" ? "clay" : "muted"}>{resolution.band} confidence · {percent}%</Badge><h2 className="ds-heading mt-4">{resolution.band === "high" ? "Our recommended starting point" : resolution.band === "medium" ? "A few directions could work" : "This needs a custom plan"}</h2><p className="ds-body mt-3 max-w-2xl">{resolution.explanation}</p></div><Tag>{resolution.profile.completeness}% profile complete</Tag></div>
    {resolution.matches.length > 0 ? <div className="mt-8 grid gap-6 md:grid-cols-2">{resolution.matches.map((match) => { const project = getProject(match.projectId); if (!project) return null; return <article key={match.projectId} className="ds-card overflow-hidden"><ProjectImage asset={project.images.cardThumbnail} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/9]" /><div className="p-6"><div className="flex items-center justify-between gap-3"><Badge tone={match.band === "high" ? "success" : "clay"}>{Math.round(match.score * 100)}% match</Badge><span className="ds-caption">{project.difficulty}</span></div><h3 className="ds-subheading mt-4">{project.name}</h3><p className="ds-body mt-2">{project.description}</p><div className="mt-4 flex flex-wrap gap-2">{Object.entries(match.prefill.dimensions).map(([key, value]) => <Tag key={key}>{key}: {value} in</Tag>)}</div><Link href={templateHref(project.href, match)} className={buttonClassName("primary", "mt-6 w-full")}>Customize this plan</Link></div></article>; })}</div> : <div className="ds-card mt-8 p-7"><h3 className="ds-subheading">We don&apos;t have a verified match yet.</h3><p className="ds-body mt-3">Save this profile so the idea remains available when Sawly supports more custom project types.</p><Button className="mt-6" variant="primary" disabled={saved} onClick={onSave}>{saved ? "Idea saved" : "Save this idea"}</Button>{saved && <div role="status" className="ds-success mt-4"><strong>Idea saved.</strong> You can find it in Saved Ideas on the homepage.</div>}</div>}
    <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"><p className="ds-caption font-semibold">Design profile</p><div className="mt-3 flex flex-wrap gap-2"><Tag>{resolution.profile.projectType}</Tag>{resolution.profile.environment && <Tag>{resolution.profile.environment}</Tag>}{resolution.profile.material && <Tag>{resolution.profile.material}</Tag>}{resolution.profile.style && <Tag>{resolution.profile.style}</Tag>}{resolution.profile.capacity && <Tag>Seats {resolution.profile.capacity}</Tag>}</div></div>
  </section>;
}
