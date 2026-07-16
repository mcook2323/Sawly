"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge, Tag } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { deleteSavedCustomConcept, duplicateSavedCustomConcept, readConceptWorkspace, readSavedCustomConcepts, saveCustomConceptPackage, storeConceptWorkspace } from "@/lib/concepts/browserStorage";
import type { CustomConceptOption, CustomConceptPackage, SavedCustomConcept } from "@/types/customConcept";
import { getVerifiedConceptHref } from "@/lib/concepts/verifiedConversion";
import { requestConceptImage } from "@/lib/concepts/clientGeneration";
import { allInitialImageJobIds, selectedImageJobIds } from "@/lib/concepts/imageJobs";
import type { SawlyAIMode } from "@/lib/ai/mode";

function getSession() { let value = sessionStorage.getItem("sawly.browser-session"); if (!value) { value = crypto.randomUUID(); sessionStorage.setItem("sawly.browser-session", value); } return value; }
function packageStatus(concepts: CustomConceptOption[]): CustomConceptPackage["generationStatus"] { return concepts.every((item) => item.imageStatus === "ready") ? "images-ready" : concepts.some((item) => item.imageStatus === "ready" || item.imageStatus === "failed") ? "images-partial" : "text-ready"; }

export function CustomConceptWorkspace({ id, aiMode }: { id: string; aiMode: SawlyAIMode }) {
  const aiEnabled = aiMode === "openai";
  const [pack, setPack] = useState<CustomConceptPackage | null>(null);
  const packRef = useRef<CustomConceptPackage | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revisionBusy, setRevisionBusy] = useState(false);
  const [revision, setRevision] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedCustomConcept[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const timer = setTimeout(() => {
      const workspace = readConceptWorkspace(id); const stored = readSavedCustomConcepts(); const savedItem = stored.find((item) => item.package.id === id);
      const found = workspace ?? savedItem?.package ?? null; setSaved(stored); setPack(found); packRef.current = found; setSelected(savedItem?.selectedConceptId ?? found?.concepts[0]?.id ?? null);
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => () => { controllers.current.forEach((controller) => controller.abort()); }, []);

  function commit(next: CustomConceptPackage) { packRef.current = next; setPack(next); storeConceptWorkspace(next); }
  function patchConcept(conceptId: string, patch: Partial<CustomConceptOption>) {
    const current = packRef.current; if (!current) return;
    const concepts = current.concepts.map((item) => item.id === conceptId ? { ...item, ...patch } : item);
    commit({ ...current, concepts, generationStatus: packageStatus(concepts) });
  }

  async function generateImage(conceptId: string) {
    const current = packRef.current; const target = current?.concepts.find((item) => item.id === conceptId);
    if (!aiEnabled || !current || !target || target.imageStatus === "ready" || controllers.current.has(conceptId) || target.imageAttempts >= 3) return;
    const attempt = target.imageAttempts + 1; const controller = new AbortController(); controllers.current.set(conceptId, controller); setNotice(null);
    const attemptedAt = new Date().toISOString();
    patchConcept(conceptId, { imageStatus: "generating", imageAttempts: attempt, imageError: null, imageLastAttemptedAt: attemptedAt });
    try {
      const imageUrl = await requestConceptImage({ packageId: current.id, concept: { ...target, imageStatus: "generating", imageAttempts: attempt, imageError: null, imageLastAttemptedAt: attemptedAt }, sessionId: getSession(), idempotencyKey: `${current.id}:${conceptId}:attempt:${attempt}`, signal: controller.signal });
      patchConcept(conceptId, { imageUrl, imageStatus: "ready", imageError: null });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message = error instanceof Error ? error.message : "Image generation failed. Your concept text is still available.";
      patchConcept(conceptId, { imageStatus: "failed", imageError: message });
    } finally { controllers.current.delete(conceptId); }
  }

  async function generateSelectedImage() { const current = packRef.current; if (!current) return; await Promise.allSettled(selectedImageJobIds(current, selected).map(generateImage)); }
  async function generateAllImages() {
    const current = packRef.current; if (!current) return;
    await Promise.allSettled(allInitialImageJobIds(current).map(generateImage));
  }

  const concept = pack?.concepts.find((item) => item.id === selected) ?? null;
  const verifiedHref = concept ? getVerifiedConceptHref(concept) : null;
  const renderingCount = pack?.concepts.filter((item) => item.imageStatus === "generating").length ?? 0;
  const queuedCount = pack?.concepts.filter((item) => item.imageStatus === "queued").length ?? 0;

  function updateConcept(patch: Partial<CustomConceptOption>) { if (concept) patchConcept(concept.id, patch); }
  async function revise() {
    if (!pack || !concept || !revision.trim() || revisionBusy) return; setRevisionBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/design/concepts", { method: "POST", headers: { "Content-Type": "application/json", "X-Sawly-Session": getSession(), "X-Idempotency-Key": `${pack.id}:${concept.id}:revision:${history.length + 1}` }, body: JSON.stringify({ prompt: pack.originalPrompt, revision: revision.trim(), existingConcept: concept }) });
      const value = await response.json() as { package?: CustomConceptPackage; error?: string }; if (!response.ok || !value.package) throw new Error(value.error);
      const replacement = value.package.concepts[0]; patchConcept(concept.id, { ...replacement, id: concept.id, imageUrl: concept.imageUrl, imageStatus: concept.imageStatus, imageAttempts: concept.imageAttempts, imageError: concept.imageError, imageLastAttemptedAt: concept.imageLastAttemptedAt });
      setHistory((items) => [...items, revision.trim()]); setRevision("");
    } catch { setNotice("Revision failed. Your current concept has not changed."); }
    finally { setRevisionBusy(false); }
  }

  if (!pack) return <main className="min-h-screen bg-[var(--color-canvas)]"><div className="ds-container py-20"><h1 className="ds-heading">Concept not found</h1><p className="ds-body mt-3">This concept may only exist in another browser.</p><Link href="/design" className={buttonClassName("primary", "mt-6")}>Back to designer</Link></div></main>;

  return <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]"><div className="ds-container flex items-center justify-between py-4"><BrandLogo /><Link href="/design" className={buttonClassName("ghost")}>Back to designer</Link></div></header>
    <section className="ds-container ds-section">
      <Badge tone="clay">{aiEnabled ? "AI Concept — Not Yet Build-Verified" : "Saved AI concept · deterministic mode"}</Badge><h1 className="ds-heading mt-4">Concept directions for “{pack.originalPrompt}”</h1><p className="ds-body mt-3 max-w-3xl">{aiEnabled ? "All three directions are ready to explore. Images render independently; these concepts still require dimensional, structural, trade, and safety verification." : "This previously saved concept remains available to inspect and save. Paid AI image generation and revisions are disabled in this deployment."}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3" aria-live="polite"><Tag>Text concepts ready</Tag>{aiEnabled && renderingCount > 0 && <Tag>Rendering {renderingCount} image{renderingCount === 1 ? "" : "s"}</Tag>}{aiEnabled && queuedCount > 0 && <Button variant="secondary" onClick={generateAllImages}>Generate all three images</Button>}</div>
      <div id="concepts" className="mt-8 grid gap-5 md:grid-cols-3">{pack.concepts.map((item) => <button key={item.id} onClick={() => setSelected(item.id)} className={`ds-card overflow-hidden text-left ${selected === item.id ? "ring-2 ring-[var(--color-brand)]" : ""}`}><ConceptImage concept={item} /><div className="p-5"><h2 className="font-semibold">{item.title}</h2><p className="ds-caption mt-2">{item.budget} · {item.buildTime}</p><ImageStatus concept={item} /></div></button>)}</div>
      {concept && <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"><div><ConceptImage concept={concept} large /><div className="mt-4 flex flex-wrap gap-3"><a href="#concepts" className={buttonClassName("ghost")}>Back to Concepts</a>{aiEnabled && concept.imageStatus !== "ready" && <Button onClick={concept.imageStatus === "failed" ? () => generateImage(concept.id) : generateSelectedImage} disabled={concept.imageStatus === "generating" || concept.imageAttempts >= 3} variant="secondary">{concept.imageStatus === "failed" ? "Retry this image" : concept.imageStatus === "generating" ? "Rendering image…" : "Generate selected image"}</Button>}<Button onClick={() => { const value = saveCustomConceptPackage(pack, concept.id, history); setSaved(readSavedCustomConcepts()); setNotice(`Saved concept ${value.id.slice(0, 6)}.`); }}>Save Concept</Button>{verifiedHref && <Link href={verifiedHref} className={buttonClassName("secondary")}>Convert to Verified Sawly Plan</Link>}</div>{concept.imageError && <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">{concept.imageError}{concept.imageAttempts >= 3 ? " Retry limit reached." : ""}</p>}{concept.imageLastAttemptedAt && <p className="ds-caption mt-2">Last image attempt: {new Date(concept.imageLastAttemptedAt).toLocaleString()}</p>}{verifiedHref && <p className="ds-caption mt-3">Verified dimensions and material will be passed to Sawly’s deterministic generator, which remains the source of all calculations.</p>}</div>
        <article className="ds-card p-6"><h2 className="ds-subheading">{concept.title}</h2><p className="ds-body mt-3">{concept.description}</p><div className="mt-5 flex flex-wrap gap-2"><Tag>{concept.difficulty}</Tag><Tag>{concept.budget}</Tag><Tag>{concept.buildTime}</Tag></div><EditableConcept concept={concept} update={updateConcept} /><Section title="Assumptions" items={concept.assumptions} /><Section title="Unresolved questions" items={concept.unresolvedQuestions} /><Section title="Safety limitations" items={concept.safetyLimitations} />{aiEnabled && <div className="mt-6 border-t border-[var(--color-border)] pt-6"><label className="font-semibold" htmlFor="revision">Revise this direction</label><textarea id="revision" className="ds-input mt-2 min-h-24" value={revision} onChange={(event) => setRevision(event.target.value)} placeholder="Make it smaller, switch to cedar, remove the sink…" /><Button className="mt-3" onClick={revise} disabled={revisionBusy || !revision.trim()}>{revisionBusy ? "Updating…" : "Update concept"}</Button><p className="ds-caption mt-2">Text revisions never regenerate images automatically.</p></div>}</article></div>}
      {notice && <div className="ds-success mt-6" role="status">{notice}</div>}
      {saved.length > 0 && <section className="mt-12 border-t border-[var(--color-border)] pt-8"><h2 className="ds-subheading">Saved custom concepts</h2><div className="mt-4 flex flex-wrap gap-3">{saved.map((item) => <div key={item.id} className="ds-card p-4"><p className="font-semibold">{item.package.originalPrompt}</p><div className="mt-3 flex gap-3"><button onClick={() => { commit(item.package); setSelected(item.selectedConceptId); }} className="text-sm font-semibold text-[var(--color-brand)]">Reopen</button><button onClick={() => { duplicateSavedCustomConcept(item.id); setSaved(readSavedCustomConcepts()); }} className="text-sm font-semibold">Duplicate</button><button onClick={() => { deleteSavedCustomConcept(item.id); setSaved(readSavedCustomConcepts()); }} className="text-sm font-semibold text-[var(--color-danger)]">Delete</button></div></div>)}</div></section>}
    </section><SiteFooter />
  </main>;
}

function ImageStatus({ concept }: { concept: CustomConceptOption }) { const label = concept.imageStatus === "queued" ? "Queued" : concept.imageStatus === "generating" ? "Rendering image" : concept.imageStatus === "ready" ? "Image ready" : "Image failed"; return <p className={`mt-3 text-xs font-semibold ${concept.imageStatus === "failed" ? "text-[var(--color-danger)]" : "text-[var(--color-ink-muted)]"}`}>{label}</p>; }
function ConceptImage({ concept, large = false }: { concept: CustomConceptOption; large?: boolean }) { return <div className={`relative grid place-items-center overflow-hidden bg-[var(--color-canvas-muted)] ${large ? "aspect-[16/10] rounded-[var(--radius-xl)]" : "aspect-[16/10]"}`}>{concept.imageStatus === "ready" && concept.imageUrl ? <Image src={concept.imageUrl} alt={`${concept.title} AI concept`} fill sizes={large ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 768px) 33vw, 100vw"} className="page-enter object-cover" /> : <div className="absolute inset-0 grid place-items-center"><div className={`absolute inset-0 bg-gradient-to-br from-[var(--color-canvas-muted)] to-[var(--color-sand)] ${concept.imageStatus === "generating" ? "animate-pulse" : ""}`} /><div className="relative p-6 text-center"><p className="font-semibold">{concept.imageStatus === "generating" ? "Rendering concept image…" : concept.imageStatus === "failed" ? "Image unavailable" : "Image ready to generate"}</p><p className="ds-caption mt-2">No fake image has been substituted.</p></div></div>}</div>; }
function Section({ title, items }: { title: string; items: string[] }) { return <section className="mt-6"><h3 className="font-semibold">{title}</h3><ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">{items.map((item) => <li key={item}>• {item}</li>)}</ul></section>; }
function EditableConcept({ concept, update }: { concept: CustomConceptOption; update: (patch: Partial<CustomConceptOption>) => void }) { const dimension = (key: keyof CustomConceptOption["approximateDimensions"], value: string) => update({ approximateDimensions: { ...concept.approximateDimensions, [key]: value } }); return <div className="mt-6 grid gap-3"><div className="grid grid-cols-3 gap-2">{(["width", "depth", "height"] as const).map((key) => <label key={key} className="ds-caption capitalize">{key}<input className="ds-input mt-1" value={concept.approximateDimensions[key]} onChange={(event) => dimension(key, event.target.value)} /></label>)}</div><label className="ds-caption">Style<input className="ds-input mt-1" value={concept.style} onChange={(event) => update({ style: event.target.value })} /></label><label className="ds-caption">Material direction<input className="ds-input mt-1" value={concept.suggestedMaterials.join(", ")} onChange={(event) => update({ suggestedMaterials: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} /></label><label className="ds-caption">Finish / color<input className="ds-input mt-1" value={concept.finishDirection} onChange={(event) => update({ finishDirection: event.target.value })} /></label><label className="ds-caption">Major features<textarea className="ds-input mt-1 min-h-20" value={concept.majorFeatures.join("\n")} onChange={(event) => update({ majorFeatures: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label><label className="ds-caption">Budget<select className="ds-input mt-1" value={concept.budget} onChange={(event) => update({ budget: event.target.value as CustomConceptOption["budget"] })}><option value="under-250">Under $250</option><option value="250-750">$250–$750</option><option value="750-2000">$750–$2,000</option><option value="over-2000">Over $2,000</option></select></label></div>; }
