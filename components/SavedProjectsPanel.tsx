"use client";

import { getMaterialLabel } from "@/calculations/materialCatalog";
import { getSavedProjectHref, type SavedProject } from "@/lib/savedProjects";
import { TrackedProjectLink } from "@/components/TrackedProjectLink";

interface SavedProjectsPanelProps {
  projects: SavedProject[];
  onDelete: (id: string) => void;
}

export function SavedProjectsPanel({ projects, onDelete }: SavedProjectsPanelProps) {
  if (projects.length === 0) return null;

  return (
    <section id="saved-projects" className="border-y border-[#ddd2c4] bg-[#fffdf9] px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a05f47]">Saved locally</p>
            <h2 className="editorial-title mt-2 text-3xl">Saved projects</h2>
          </div>
          <p className="text-xs text-[#8b7f74]">Stored only in this browser</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="rounded-xl border border-[#e1d7ca] bg-[#f8f4ed] p-4">
              <h3 className="font-semibold">{project.projectName}</h3>
              <p className="mt-1 text-sm text-[#7d7268]">
                {Object.values(project.dimensions).join(" × ")}&quot; · {getMaterialLabel(project.material)}
              </p>
              <p className="mt-1 text-xs text-[#9b8f84]">Saved {new Date(project.savedAt).toLocaleDateString()}</p>
              <div className="mt-4 flex gap-3 text-sm font-semibold">
                <TrackedProjectLink href={getSavedProjectHref(project)} className="text-[#59664a] hover:underline">Reopen</TrackedProjectLink>
                <button type="button" onClick={() => onDelete(project.id)} className="cursor-pointer text-[#9b5545] hover:underline">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
