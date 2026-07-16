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
import { storeConceptWorkspace } from "@/lib/concepts/browserStorage";
import { requestCustomConcepts } from "@/lib/concepts/clientGeneration";
import { classifyDesignProfile } from "@/lib/ai/requestRouting";
import { CustomConceptEntry } from "@/components/CustomConceptEntry";
import { normalizePrompt } from "@/lib/ai/savedRequests";
import { decideConversationSubmission, readConversationSnapshots, removeConversationSnapshot, restartAllowed, writeConversationSnapshot, type ConversationSnapshot } from "@/lib/ai/conversationSession";
import type { DesignAnswers, DesignAnswerValue, DesignProfile, DesignQuestion, DesignQuestionId, GuidanceMode, GuidedDesignResolution, ProviderConversationResponse, RankedTemplateMatch } from "@/types/ai";

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
  const [remoteQuestion, setRemoteQuestion] = useState<DesignQuestion | null | undefined>(undefined);
  const [remoteProfile, setRemoteProfile] = useState<DesignProfile | null>(null);
  const [remoteResolution, setRemoteResolution] = useState<GuidedDesignResolution | null>(null);
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>("deterministic-fallback");
  const [thinking, setThinking] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [conceptGenerating, setConceptGenerating] = useState(false);
  const [conceptError, setConceptError] = useState<string | null>(null);
  const request = useMemo(() => parseDesignRequest(activePrompt), [activePrompt]);
  const profile = useMemo(() => buildDesignProfile(request, answers), [request, answers]);
  const requestRoute = classifyDesignProfile(profile);
  const pending = getConversationQuestions(profile, answers);
  const editingAnswers = editing ? withoutAnswer(answers, editing) : answers;
  const editingQuestion = editing ? getConversationQuestions(buildDesignProfile(request, editingAnswers), editingAnswers).find((question) => question.id === editing) : null;
  const localQuestion = pending[0] ?? null;
  const question = requestRoute === "custom-concept" ? null : editingQuestion ?? (remoteQuestion !== undefined ? remoteQuestion : localQuestion);
  const complete = !question;
  const effectiveProfile = remoteProfile ?? profile;
  const resolution = complete ? remoteResolution ?? scoreDesignProfile(effectiveProfile) : null;

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

  useEffect(() => {
    if (!hydrated || !activePrompt || editing || requestRoute === "custom-concept") return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setThinking(true); setProviderError(null);
      try {
        let session = window.sessionStorage.getItem("sawly.browser-session");
        if (!session) { session = crypto.randomUUID(); window.sessionStorage.setItem("sawly.browser-session", session); }
        const response = await fetch("/api/design/conversation", { method: "POST", headers: { "Content-Type": "application/json", "X-Sawly-Session": session }, body: JSON.stringify({ prompt: activePrompt, answers, profile, action: retryCount ? "retry" : "continue" }), signal: controller.signal });
        if (response.status === 429) { const value = await response.json() as { retryAfterSeconds?: number }; setProviderError(`You’re moving quickly. Try again in ${value.retryAfterSeconds ?? "a few"} seconds.`); return; }
        if (!response.ok) { setProviderError("AI-enhanced guidance is temporarily unavailable. Verified guidance is still working."); return; }
        const value = await response.json() as ProviderConversationResponse; setRemoteQuestion(value.nextQuestion); setRemoteProfile(value.profile); setRemoteResolution(value.resolution); setGuidanceMode(value.mode);
      } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setProviderError("AI-enhanced guidance is temporarily unavailable. Verified guidance is still working."); }
      finally { if (!controller.signal.aborted) setThinking(false); }
    }, 120);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [activePrompt, answers, editing, hydrated, profile, requestRoute, retryCount]);

  function answer(value: DesignAnswerValue) {
    if (!question) return;
    const updated = updateConversationAnswer(answers, answerOrder, question.id, value);
    setRemoteQuestion(undefined); setRemoteProfile(null); setRemoteResolution(null);
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
    setEditing(null); setSaved(false); setRemoteQuestion(undefined); setRemoteProfile(null); setRemoteResolution(null);
    if (normalizePrompt(prompt) !== normalizePrompt(activePrompt)) router.replace(`/design?prompt=${encodeURIComponent(prompt)}`);
  }

  function restart() {
    const confirmed = answerOrder.length === 0 || window.confirm("Restart this design? Your answers will be discarded.");
    if (!restartAllowed(answerOrder.length, confirmed)) return;
    removeConversationSnapshot(activePrompt); setAnswers({}); setAnswerOrder([]); setEditing(null); setSaved(false); setRemoteQuestion(undefined); setRemoteProfile(null); setRemoteResolution(null);
  }

  async function generateCustomConcepts() {
    if (conceptGenerating) return; setConceptGenerating(true); setConceptError(null);
    try { let session = sessionStorage.getItem("sawly.browser-session"); if (!session) { session=crypto.randomUUID();sessionStorage.setItem("sawly.browser-session",session); } const {projectType,projectTypeExplicitlyOther,environment,dimensions,capacity,budget,material,style,intendedUse,keywords,completeness}=effectiveProfile; await requestCustomConcepts({prompt:activePrompt,profile:{projectType,projectTypeExplicitlyOther,environment,dimensions,capacity,budget,material,style,intendedUse,keywords,completeness},sessionId:session},{store:storeConceptWorkspace,navigate:(href)=>router.push(href)}); }
    catch(error) { setConceptError(error instanceof Error&&error.message?error.message:"Custom concept generation is temporarily unavailable."); }
    finally { setConceptGenerating(false); }
  }

  function saveCurrentIdea() {
    saveDesignRequest({ prompt: request.raw, parsed: request, designProfile: effectiveProfile });
    setSaved(true);
  }

  function editRequest() {
    document.querySelector<HTMLTextAreaElement>("#design-prompt-compact")?.focus();
  }

  return <main className="page-enter min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]"><div className="ds-container flex items-center justify-between py-4"><BrandLogo /><Link href="/#catalog" className={buttonClassName("ghost")}>Browse projects</Link></div></header>
    <section className="ds-container ds-section">
      <div className="mx-auto max-w-6xl"><p className="ds-eyebrow">Guided AI Designer</p><h1 className="ds-heading mt-3">Let&apos;s shape the right project together.</h1><p className="ds-body mt-3 max-w-2xl">Sawly combines AI-enhanced project discovery with verified, deterministic project generators. Recommendations never replace construction calculations.</p><div className="mt-8 max-w-5xl"><AIDesignPrompt key={activePrompt || "empty"} compact initialValue={activePrompt} onPromptSubmit={submitIdea} /></div></div>
      {!activePrompt ? null : <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="ds-card p-5"><p className="ds-caption font-semibold">Your idea</p><p className="mt-2 font-semibold">“{activePrompt}”</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--color-canvas-muted)]"><div className="h-full rounded-full bg-[var(--color-brand)] transition-all" style={{ width: `${complete ? 100 : Math.max(12, Math.round(answerOrder.length / Math.max(answerOrder.length + pending.length, 1) * 100))}%` }} /></div><div className="mt-2 flex items-center justify-between gap-3"><p className="ds-caption">{complete ? "Profile complete" : `${answerOrder.length} answers added`}</p><button type="button" onClick={restart} className="text-xs font-semibold text-[var(--color-danger)] hover:underline">Restart design</button></div></div>
          {answerOrder.length > 0 && <div className="mt-4 space-y-2" aria-label="Conversation history">{answerOrder.map((id) => { const value = answers[id]; if (value === undefined) return null; const prior = withoutAnswer(answers, id); const q = getConversationQuestions(buildDesignProfile(request, prior), prior).find((item) => item.id === id); return <div key={id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><p className="ds-caption">{q?.prompt ?? id}</p><div className="mt-1 flex items-center justify-between gap-3"><p className="text-sm font-semibold">{q ? answerLabel(q, value) : String(value)}</p><button type="button" onClick={() => setEditing(id)} className="text-xs font-semibold text-[var(--color-brand)] hover:underline">Edit</button></div></div>; })}</div>}
        </aside>
        <div>
          {requestRoute !== "custom-concept" && <div className="mb-4 flex flex-wrap items-center gap-3" aria-live="polite"><Badge tone={guidanceMode === "ai-enhanced" ? "success" : "muted"}>{guidanceMode === "ai-enhanced" ? "AI-enhanced guidance" : "Verified fallback guidance"}</Badge>{thinking && <span className="ds-caption animate-pulse">Considering your project…</span>}{providerError && <div className="flex items-center gap-3 text-sm text-[var(--color-danger)]"><span>{providerError}</span><button type="button" onClick={() => setRetryCount((count) => count + 1)} className="font-semibold underline">Retry</button></div>}</div>}
          {requestRoute === "custom-concept" ? <CustomConceptEntry request={activePrompt} saved={saved} generating={conceptGenerating} error={conceptError} onGenerate={generateCustomConcepts} onSave={saveCurrentIdea} onEdit={editRequest} /> : !complete && question ? <section className="ds-card p-6 shadow-[var(--shadow-md)] sm:p-8" aria-live="polite"><Badge tone="clay">Sawly asks</Badge><h2 className="ds-subheading mt-5">{question.prompt}</h2>{question.helpText && <p className="ds-body mt-2">{question.helpText}</p>}<div className="mt-6"><AnswerControl key={`${question.id}-${editing ?? "new"}`} question={question} onAnswer={answer} /></div></section> : resolution && <DesignRecommendations resolution={resolution} saved={saved} onSave={saveCurrentIdea} onGenerate={generateCustomConcepts} generating={conceptGenerating} generationError={conceptError} />}
        </div>
      </div>}
    </section><SiteFooter />
  </main>;
}

function DesignRecommendations({ resolution, saved, onSave, onGenerate, generating, generationError }: { resolution: ReturnType<typeof scoreDesignProfile>; saved: boolean; onSave: () => void; onGenerate: () => void; generating: boolean; generationError: string | null }) {
  const percent = Math.round(resolution.confidence * 100);
  return <section><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge tone={resolution.band === "high" ? "success" : resolution.band === "medium" ? "clay" : "muted"}>{resolution.band} confidence · {percent}%</Badge><h2 className="ds-heading mt-4">{resolution.band === "high" ? "Our recommended starting point" : resolution.band === "medium" ? "A few directions could work" : "This needs a custom plan"}</h2><p className="ds-body mt-3 max-w-2xl">{resolution.explanation}</p></div><Tag>{resolution.profile.completeness}% profile complete</Tag></div>
    {resolution.matches.length > 0 ? <div className="mt-8 grid gap-6 md:grid-cols-2">{resolution.matches.map((match) => { const project = getProject(match.projectId); if (!project) return null; return <article key={match.projectId} className="ds-card overflow-hidden"><ProjectImage asset={project.images.cardThumbnail} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/9]" /><div className="p-6"><div className="flex items-center justify-between gap-3"><Badge tone={match.band === "high" ? "success" : "clay"}>{Math.round(match.score * 100)}% match</Badge><span className="ds-caption">{project.difficulty}</span></div><h3 className="ds-subheading mt-4">{project.name}</h3><p className="ds-body mt-2">{project.description}</p><div className="mt-4 flex flex-wrap gap-2">{Object.entries(match.prefill.dimensions).map(([key, value]) => <Tag key={key}>{key}: {value} in</Tag>)}</div><Link href={templateHref(project.href, match)} className={buttonClassName("primary", "mt-6 w-full")}>Customize this plan</Link></div></article>; })}</div> : <div className="ds-card mt-8 p-7"><Badge tone="clay">AI Concept — Not Yet Build-Verified</Badge><h3 className="ds-subheading mt-4">Generate three custom concept directions</h3><p className="ds-body mt-3">Sawly can create visual, high-level design options for this idea. Concepts are not construction plans and must be verified before building.</p><div className="mt-6 flex flex-wrap gap-3"><Button variant="primary" disabled={generating} onClick={onGenerate}>{generating?"Generating custom concepts…":"Generate custom concepts"}</Button><Button variant="ghost" disabled={saved} onClick={onSave}>{saved?"Idea saved":"Save idea"}</Button></div>{generationError&&<div className="mt-4 text-sm text-[var(--color-danger)]" role="alert">{generationError}</div>}</div>}
    <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"><p className="ds-caption font-semibold">Design profile</p><div className="mt-3 flex flex-wrap gap-2"><Tag>{resolution.profile.projectType}</Tag>{resolution.profile.environment && <Tag>{resolution.profile.environment}</Tag>}{resolution.profile.material && <Tag>{resolution.profile.material}</Tag>}{resolution.profile.style && <Tag>{resolution.profile.style}</Tag>}{resolution.profile.capacity && <Tag>Seats {resolution.profile.capacity}</Tag>}</div></div>
  </section>;
}
