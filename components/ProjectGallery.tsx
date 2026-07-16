"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import type { ProjectGalleryItem } from "@/data/projectGallery";

interface ProjectGalleryProps {
  items: ProjectGalleryItem[];
  renderItem: (item: ProjectGalleryItem, isThumbnail: boolean) => ReactNode;
  ariaLabel?: string;
}

export function ProjectGallery({
  items,
  renderItem,
  ariaLabel = "Project gallery",
}: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const activeItem = items[activeIndex];

  if (!activeItem) {
    return null;
  }

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }
  function showView(view: "lifestyle" | "blueprint") { const index = items.findIndex((item) => item.view === view); if (index >= 0) { setActiveIndex(index); setZoom(1); } }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 45) {
      return;
    }

    if (distance > 0) {
      showPrevious();
    } else {
      showNext();
    }
  }

  return (
    <section aria-label={ariaLabel} className="mt-6 sm:mt-8">
      <div className="ds-card overflow-hidden shadow-[var(--shadow-lg)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="ds-eyebrow">
              Project gallery
            </p>
            <h2 className="ds-subheading mt-2">
              {activeItem.label}
            </h2>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end"><p className="ds-body max-w-lg text-sm sm:text-right">{activeItem.description}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => showView("lifestyle")} className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold">Lifestyle</button><button type="button" onClick={() => showView("blueprint")} className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold">Blueprint</button><button type="button" onClick={() => setZoom((value) => Math.max(.8, value - .1))} aria-label="Zoom out" className="h-9 w-9 rounded-full border border-[var(--color-border)] bg-white font-semibold">−</button><button type="button" onClick={() => setZoom((value) => Math.min(1.4, value + .1))} aria-label="Zoom in" className="h-9 w-9 rounded-full border border-[var(--color-border)] bg-white font-semibold">+</button><button type="button" onClick={() => { setZoom(1); setActiveIndex(0); }} className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold">Reset view</button></div></div>
        </div>

        <div
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div aria-live="polite" className="sr-only">
            Showing {activeItem.label}, item {activeIndex + 1} of {items.length}
          </div>
          <div className="origin-center transition-transform duration-300 ease-out" style={{ transform: `scale(${zoom})` }}>{renderItem(activeItem, false)}</div>

          <button
            type="button"
            onClick={showPrevious}
            aria-label="Show previous gallery view"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-[#fffdf9]/90 text-xl text-[#51463e] shadow-lg backdrop-blur transition-colors hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#667154]/20 sm:left-5"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Show next gallery view"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-[#fffdf9]/90 text-xl text-[#51463e] shadow-lg backdrop-blur transition-colors hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#667154]/20 sm:right-5"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${item.label}`}
              aria-current={isActive ? "true" : undefined}
              className={`min-w-0 cursor-pointer overflow-hidden rounded-xl border bg-[#fffdf9] text-left transition-colors focus:outline-none focus:ring-4 focus:ring-[#667154]/20 ${
                isActive
                  ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/15"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              <div className="pointer-events-none h-16 overflow-hidden sm:h-24">
                {renderItem(item, true)}
              </div>
              <span className="block truncate px-2 py-2 text-center text-[11px] font-semibold text-[#665b51] sm:text-xs">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
