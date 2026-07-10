"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AIDesignPrompt } from "@/components/AIDesignPrompt";
import { BrandLogo } from "@/components/BrandLogo";
import { ProjectImage } from "@/components/ProjectImage";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge, Tag } from "@/components/ui/Badge";
import { buttonClassName, Button } from "@/components/ui/Button";
import { getProject } from "@/data/projects";
import { resolveDesignRequest } from "@/lib/ai";
import { normalizePrompt, readSavedDesignRequests, saveDesignRequest } from "@/lib/ai/savedRequests";

function templateHref(projectHref: string, prefill: { material?: string; dimensions: Record<string, number> }) {
  const params = new URLSearchParams();
  Object.entries(prefill.dimensions).forEach(([key, value]) => params.set(key, String(value)));
  if (prefill.material) params.set("material", prefill.material);
  params.set("source", "design");
  return `${projectHref}?${params}`;
}

export function DesignWorkspace({ initialPrompt }: { initialPrompt: string }) {
  const prompt = initialPrompt;
  const [saved, setSaved] = useState(false);
  const resolution = useMemo(() => prompt ? resolveDesignRequest(prompt) : null, [prompt]);
  const project = resolution?.match ? getProject(resolution.match.projectId) : null;
  useEffect(() => {
    const timer = window.setTimeout(() => setSaved(readSavedDesignRequests().some((idea) => normalizePrompt(idea.prompt) === normalizePrompt(prompt))), 0);
    return () => window.clearTimeout(timer);
  }, [prompt]);
  return <main className="page-enter min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]"><div className="ds-container flex items-center justify-between py-4"><BrandLogo /><Link href="/#catalog" className={buttonClassName("ghost")}>Browse projects</Link></div></header>
    <section className="ds-container ds-section">
      <div className="mx-auto max-w-5xl">
        <p className="ds-eyebrow">Sawly Design Studio</p>
        <h1 className="ds-heading mt-3">Turn an idea into a buildable starting point.</h1>
        <div className="mt-8"><AIDesignPrompt compact initialValue={prompt} /></div>
      </div>
      {!resolution ? <div className="ds-empty mx-auto mt-10 max-w-5xl"><h2 className="ds-subheading">Describe a project to begin</h2><p className="ds-body mt-2">Include its use, approximate size, material, or style. Sawly will look for a compatible existing plan.</p></div> : project && resolution.match ? (
        <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)]"><ProjectImage asset={project.images.lifestyleHero} sizes="(min-width: 1024px) 60vw, 100vw" priority className="aspect-[4/3]" /></div>
          <aside className="ds-card p-6 sm:p-8">
            <Badge tone="success">Template match</Badge><h2 className="ds-heading mt-5">{project.name}</h2><p className="ds-body mt-4">{project.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">{resolution.request.material && <Tag>{resolution.request.material === "treated" ? "Pressure-treated" : resolution.request.material}</Tag>}{Object.entries(resolution.match.prefill.dimensions).map(([key, value]) => <Tag key={key}>{key}: {value} in</Tag>)}{resolution.request.style && <Tag>{resolution.request.style}</Tag>}</div>
            <dl className="mt-7 grid grid-cols-2 gap-4 border-y border-[var(--color-border)] py-5"><div><dt className="ds-caption">Difficulty</dt><dd className="mt-1 font-semibold">{project.difficulty}</dd></div><div><dt className="ds-caption">Estimated cost</dt><dd className="mt-1 font-semibold">{project.cost}</dd></div></dl>
            <p className="ds-caption mt-5">Matched from: {resolution.match.reasons.join(" · ")}. Review every prefilled dimension before generating the plan.</p>
            <Link href={templateHref(project.href, resolution.match.prefill)} className={buttonClassName("primary", "mt-7 w-full")}>Customize this plan</Link>
          </aside>
          <section className="lg:col-span-2"><p className="ds-eyebrow">Ready in the design studio</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["Live project gallery", "Dimension controls", "Shopping and cut lists", "Build and print plans"].map((item) => <div key={item} className="ds-card p-5 font-semibold">{item}</div>)}</div></section>
        </div>
      ) : (
        <div className="mx-auto mt-12 max-w-3xl rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-md)] sm:p-10">
          <Badge tone="clay">Future project</Badge><h2 className="ds-heading mt-5">We don&apos;t have this project yet.</h2><p className="ds-body mt-4">Sawly can understand parts of your request, but there is no compatible verified template today. Future AI providers will use this same request format to create custom plans.</p>
          <div className="mt-6 flex flex-wrap gap-2">{resolution.request.projectType !== "unknown" && <Tag>{resolution.request.projectType}</Tag>}{resolution.request.material && <Tag>{resolution.request.material}</Tag>}{resolution.request.keywords.slice(0, 6).map((word) => <Tag key={word}>{word}</Tag>)}</div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button variant="primary" disabled={saved} onClick={() => { saveDesignRequest({ prompt: resolution.request.raw, parsed: resolution.request }); setSaved(true); }}>{saved ? "Idea saved" : "Save this idea"}</Button><Link href="/#catalog" className={buttonClassName("secondary")}>Browse available projects</Link></div>
          {saved && <div className="ds-success mt-5" role="status"><strong>Idea saved.</strong> It is stored locally on this device and appears in Saved Ideas on the homepage.</div>}
        </div>
      )}
    </section><SiteFooter />
  </main>;
}
