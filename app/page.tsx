"use client";

import { useMemo, useState } from "react";
import { ProjectImage } from "@/components/ProjectImage";
import { AIDesignPrompt } from "@/components/AIDesignPrompt";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackedProjectLink } from "@/components/TrackedProjectLink";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName, Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SavedProjectsPanel } from "@/components/SavedProjectsPanel";
import { SavedIdeasPanel } from "@/components/SavedIdeasPanel";
import { useSavedProjects } from "@/hooks/useSavedProjects";
import { useSavedDesignRequests } from "@/hooks/useSavedDesignRequests";
import { projects } from "@/data/projects";
import type { CatalogCategory } from "@/types/project";

const categories: Array<"All" | CatalogCategory> = [
  "All", "Outdoor", "Indoor", "Garage", "Garden", "Storage",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const saved = useSavedProjects();
  const savedIdeas = useSavedDesignRequests();
  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory = category === "All" || project.category === category;
      const matchesQuery = !term || `${project.name} ${project.description} ${project.category}`.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);
  const featured = projects[0];

  function focusSearch() {
    document.getElementById("catalog-search")?.focus();
  }

  return (
    <main className="page-enter min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color:rgba(255,254,250,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <BrandLogo />
          <nav className="flex items-center gap-4 text-sm font-semibold text-[var(--color-ink-muted)] sm:gap-6" aria-label="Homepage">
            <a href="#catalog" className="transition-colors hover:text-[var(--color-brand)]">Projects</a>
            {(saved.projects.length > 0 || savedIdeas.ideas.length > 0) && <a href={saved.projects.length > 0 ? "#saved-projects" : "#saved-ideas"} className="hidden transition-colors hover:text-[var(--color-brand)] sm:inline">Saved</a>}
            <a href="#how-it-works" className="hidden transition-colors hover:text-[var(--color-brand)] md:inline">How It Works</a>
            <Button type="button" variant="secondary" onClick={focusSearch} aria-label="Go to project search" className="h-10 min-h-0 w-10 p-0">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            </Button>
          </nav>
        </div>
      </header>

      <section className="ai-hero px-5 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="ds-eyebrow">A clearer way from idea to build</p>
          <h1 className="ds-display mx-auto mt-5 max-w-4xl">Design what fits your home.</h1>
          <p className="ds-body mx-auto mt-6 max-w-2xl text-lg">Describe what you want to make. Sawly will organize the idea and connect it to a practical, customizable project when a verified template exists.</p>
          <div className="mt-10 text-left"><AIDesignPrompt /></div>
        </div>
        {featured && <div className="pointer-events-none absolute right-[4%] top-16 hidden w-56 rotate-3 opacity-20 xl:block"><ProjectImage asset={featured.images.cardThumbnail} sizes="224px" priority className="aspect-[4/3] rounded-[var(--radius-xl)]" /></div>}
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[{ eyebrow: "Describe", title: "Start with an idea", text: "Use everyday language to describe the project, size, material, or style.", href: "#design-prompt" }, { eyebrow: "Search", title: "Find a known project", text: "Search the current collection by title, description, or category.", href: "#catalog-search" }, { eyebrow: "Browse", title: "Explore the collection", text: "Compare available templates and projects planned for later.", href: "#catalog" }].map((path) => <a key={path.eyebrow} href={path.href} className="ds-card ds-card-interactive p-6"><span className="ds-eyebrow">{path.eyebrow}</span><h2 className="ds-subheading mt-3">{path.title}</h2><p className="ds-body mt-2">{path.text}</p></a>)}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#e6ddd1] bg-[#fffdf9] px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="ds-eyebrow">How it works</p>
            <h2 className="ds-heading mt-3">From idea to a plan you can use</h2>
          </div>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-12">
            {[
              ["01", "Choose a project", "Start with a practical design made for a real home, patio, or workshop."],
              ["02", "Make it fit", "Set exact dimensions and choose the outdoor material that suits your project."],
              ["03", "Take the plan to the shop", "Use the shopping list, cut list, build steps, and printable plan as you work."],
            ].map(([number, title, description]) => (
              <li key={number} className="border-t border-[#d8ccbd] pt-5">
                <span className="text-sm font-semibold text-[#a05f47]">{number}</span>
                <h3 className="ds-subheading mt-4">{title}</h3>
                <p className="ds-body mt-3">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <SavedProjectsPanel projects={saved.projects} onDelete={saved.deleteProject} />
      <SavedIdeasPanel ideas={savedIdeas.ideas} onDelete={savedIdeas.deleteIdea} />

      <section id="catalog" className="border-t border-[#e6ddd1] bg-[#f2ece3] px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="ds-eyebrow">Project collection</p>
            <h2 className="ds-heading mt-3">Find your next weekend project</h2>
          </div>

          <div className="mt-8 rounded-2xl border border-[#ddd2c4] bg-white p-3 shadow-sm">
            <label htmlFor="catalog-search" className="sr-only">Search projects</label>
            <Input id="catalog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by project, description, or category" />
          </div>

          <div className="mt-4 flex min-h-6 items-center justify-between gap-4 text-sm text-[#786c62]" aria-live="polite">
            <span>{filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"} shown</span>
            {(query || category !== "All") && <button type="button" onClick={() => { setQuery(""); setCategory("All"); }} className="cursor-pointer font-semibold text-[#59664a] hover:underline">Clear filters</button>}
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter projects by category">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${category === item ? "bg-[#667154] text-white" : "border border-[#d8ccbd] bg-[#f8f4ed] text-[#75695f]"}`}>{item}</button>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <EmptyState title="No matching projects yet" description="Try another title, description, or category. More project types are coming later; custom project creation is not available today." action={<Button type="button" variant="ghost" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</Button>} />
          ) : (
            <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <article key={project.id} className="ds-card ds-card-interactive group overflow-hidden">
                  <div className="relative">
                    <ProjectImage asset={project.images.cardThumbnail} sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="aspect-[4/3]" />
                    <Badge tone={project.available ? "success" : "muted"} className="absolute right-4 top-4">{project.available ? "Available" : "Coming soon"}</Badge>
                  </div>
                  <div className="p-6">
                    <p className="ds-eyebrow">{project.category}</p>
                    <h3 className="ds-subheading mt-2">{project.name}</h3>
                    <p className="ds-body mt-3 min-h-20">{project.description}</p>
                    <dl className="my-5 grid grid-cols-3 border-y border-[#e7ded2] py-4 text-sm">
                      {[["Cost", project.cost], ["Time", project.buildTime], ["Skill", project.difficulty]].map(([label, value]) => <div key={label}><dt className="text-xs text-[#9a8e83]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
                    </dl>
                    {project.available ? <TrackedProjectLink href={project.href} className={buttonClassName("primary", "w-full")}>Customize</TrackedProjectLink> : <div className="ds-button w-full cursor-not-allowed bg-[var(--color-canvas-muted)] text-[var(--color-ink-subtle)]">Coming soon</div>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#667154] px-5 py-14 text-[#fffdf9] sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e8c8b8]">Built for practical planning</p>
            <h2 className="editorial-title mt-3 text-4xl sm:text-5xl">Useful detail, without false certainty</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              ["Exact configuration", "Plans use the dimensions and material you choose."],
              ["Approximate costs", "Material ranges are planning estimates, not store quotes."],
              ["Printable shop plan", "Cuts, hardware, tools, and steps stay together on paper."],
              ["Beginner-readable guidance", "Clear sequencing, alignment checks, and finishing notes."],
            ].map(([title, description]) => <div key={title}><h3 className="font-semibold">{title}</h3><p className="mt-2 leading-7 text-[#e4e8dd]">{description}</p></div>)}
          </div>
          <p className="lg:col-start-2 text-sm leading-6 text-[#d7ddcf]">Always verify measurements before cutting. Nominal and actual lumber dimensions can differ. Use tools safely and apply appropriate structural judgment; Sawly plans are not engineering certification.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
