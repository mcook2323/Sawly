"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectImage } from "@/components/ProjectImage";
import { TrackedProjectLink } from "@/components/TrackedProjectLink";
import { SavedProjectsPanel } from "@/components/SavedProjectsPanel";
import { useSavedProjects } from "@/hooks/useSavedProjects";
import { projects } from "@/data/projects";
import type { CatalogCategory } from "@/types/project";

const categories: Array<"All" | CatalogCategory> = [
  "All", "Outdoor", "Indoor", "Garage", "Garden", "Storage",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const saved = useSavedProjects();
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
    <main className="min-h-screen bg-[#f8f5ef] text-[#332b25]">
      <header className="border-b border-[#e6ddd1] bg-[#fcfaf6]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="editorial-title text-2xl">Sawly</Link>
          <nav className="flex items-center gap-4 text-sm font-semibold text-[#665b51] sm:gap-6" aria-label="Homepage">
            <a href="#catalog" className="hover:text-[#59664a]">Projects</a>
            {saved.projects.length > 0 && <a href="#saved-projects" className="hidden hover:text-[#59664a] sm:inline">Saved Projects</a>}
            <a href="#how-it-works" className="hidden hover:text-[#59664a] md:inline">How It Works</a>
            <button type="button" onClick={focusSearch} aria-label="Go to project search" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d8ccbd] bg-white hover:border-[#a99b89]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a05f47]">Plans made for your space</p>
          <h1 className="editorial-title mt-5 text-5xl leading-[0.96] tracking-[-0.045em] sm:text-7xl">Build with confidence. Make it yours.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#71675f]">Customize approachable DIY projects, then take a clear materials list, cut plan, and step-by-step guide into the shop.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#catalog" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#667154] px-6 font-semibold text-white hover:bg-[#566146]">Browse Projects</a>
            <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d5c9ba] bg-white px-6 font-semibold">How It Works</a>
          </div>
        </div>
        {featured && (
          <div className="relative">
            <ProjectImage asset={featured.images.lifestyleHero} sizes="(min-width: 1024px) 52vw, 100vw" priority className="aspect-[4/3] rounded-[2rem] shadow-[0_30px_80px_rgba(85,67,48,0.18)]" />
            <div className="absolute bottom-5 left-5 rounded-xl bg-[#fffdf9]/90 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#a05f47]">Featured</p>
              <p className="editorial-title mt-1 text-2xl">{featured.name}</p>
            </div>
          </div>
        )}
      </section>

      <section id="how-it-works" className="border-y border-[#e6ddd1] bg-[#fffdf9] px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a05f47]">How it works</p>
            <h2 className="editorial-title mt-3 text-4xl sm:text-5xl">From idea to a plan you can use</h2>
          </div>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-12">
            {[
              ["01", "Choose a project", "Start with a practical design made for a real home, patio, or workshop."],
              ["02", "Make it fit", "Set exact dimensions and choose the outdoor material that suits your project."],
              ["03", "Take the plan to the shop", "Use the shopping list, cut list, build steps, and printable plan as you work."],
            ].map(([number, title, description]) => (
              <li key={number} className="border-t border-[#d8ccbd] pt-5">
                <span className="text-sm font-semibold text-[#a05f47]">{number}</span>
                <h3 className="editorial-title mt-4 text-2xl">{title}</h3>
                <p className="mt-3 leading-7 text-[#71675f]">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <SavedProjectsPanel projects={saved.projects} onDelete={saved.deleteProject} />

      <section id="catalog" className="border-t border-[#e6ddd1] bg-[#f2ece3] px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a05f47]">Project collection</p>
            <h2 className="editorial-title mt-3 text-4xl sm:text-5xl">Find your next weekend project</h2>
          </div>

          <div className="mt-8 rounded-2xl border border-[#ddd2c4] bg-white p-3 shadow-sm">
            <label htmlFor="catalog-search" className="sr-only">Search projects</label>
            <input id="catalog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by project, description, or category" className="w-full rounded-xl bg-[#f8f4ed] px-5 py-4 outline-none focus:ring-2 focus:ring-[#667154]/25" />
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
            <div className="mt-10 rounded-2xl border border-[#ddd2c4] bg-[#fffdf9] p-8 text-center">
              <h3 className="editorial-title text-3xl">No matching projects yet</h3>
              <p className="mx-auto mt-3 max-w-xl text-[#71675f]">Try another title, description, or category. More project types are coming later; custom project creation is not available today.</p>
              <button type="button" onClick={() => { setQuery(""); setCategory("All"); }} className="mt-5 cursor-pointer font-semibold text-[#59664a] hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <article key={project.id} className="group overflow-hidden rounded-[1.5rem] border border-[#ded4c6] bg-[#fffdf9] shadow-[0_12px_35px_rgba(85,67,48,0.07)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(85,67,48,0.13)]">
                  <div className="relative">
                    <ProjectImage asset={project.images.cardThumbnail} sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="aspect-[4/3]" />
                    <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${project.available ? "bg-[#edf1e7] text-[#596348]" : "bg-[#fffaf1]/90 text-[#81756a]"}`}>{project.available ? "Available" : "Coming soon"}</span>
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#a05f47]">{project.category}</p>
                    <h3 className="editorial-title mt-2 text-3xl">{project.name}</h3>
                    <p className="mt-3 min-h-20 leading-7 text-[#71675f]">{project.description}</p>
                    <dl className="my-5 grid grid-cols-3 border-y border-[#e7ded2] py-4 text-sm">
                      {[["Cost", project.cost], ["Time", project.buildTime], ["Skill", project.difficulty]].map(([label, value]) => <div key={label}><dt className="text-xs text-[#9a8e83]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
                    </dl>
                    {project.available ? <TrackedProjectLink href={project.href} className="flex min-h-12 items-center justify-center rounded-full bg-[#667154] font-semibold text-white hover:bg-[#566146]">Customize</TrackedProjectLink> : <div className="flex min-h-12 items-center justify-center rounded-full bg-[#eee8df] font-semibold text-[#9a8e83]">Coming soon</div>}
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
    </main>
  );
}
