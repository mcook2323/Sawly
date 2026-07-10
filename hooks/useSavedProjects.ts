"use client";

import { useEffect, useState } from "react";
import {
  readSavedProjects,
  writeSavedProjects,
  type SavedProject,
} from "@/lib/savedProjects";

export function useSavedProjects() {
  const [projects, setProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setProjects(readSavedProjects()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function saveProject(project: Omit<SavedProject, "id" | "savedAt">) {
    const next: SavedProject = {
      ...project,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    setProjects((current) => {
      const updated = [next, ...current];
      writeSavedProjects(updated);
      return updated;
    });
    return next;
  }

  function deleteProject(id: string) {
    setProjects((current) => {
      const updated = current.filter((project) => project.id !== id);
      writeSavedProjects(updated);
      return updated;
    });
  }

  return { projects, saveProject, deleteProject };
}
