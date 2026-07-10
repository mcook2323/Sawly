"use client";

import { useEffect, useState } from "react";
import { readSavedDesignRequests, writeSavedDesignRequests } from "@/lib/ai/savedRequests";
import type { SavedDesignRequest } from "@/types/ai";

export function useSavedDesignRequests() {
  const [ideas, setIdeas] = useState<SavedDesignRequest[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIdeas(readSavedDesignRequests()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function deleteIdea(id: string) {
    setIdeas((current) => {
      const updated = current.filter((idea) => idea.id !== id);
      writeSavedDesignRequests(updated);
      return updated;
    });
  }

  return { ideas, deleteIdea };
}
