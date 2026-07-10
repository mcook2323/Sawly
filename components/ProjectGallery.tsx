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
      <div className="overflow-hidden rounded-[2rem] border border-[#d9cdbd] bg-[#fffdf9] shadow-[0_24px_70px_rgba(91,70,49,0.13)]">
        <div className="flex flex-col gap-3 border-b border-[#e3d9cc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a05f47]">
              Project gallery
            </p>
            <h2 className="editorial-title mt-1 text-2xl text-[#3f352e]">
              {activeItem.label}
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[#7d7268] sm:text-right">
            {activeItem.description}
          </p>
        </div>

        <div
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div aria-live="polite" className="sr-only">
            Showing {activeItem.label}, item {activeIndex + 1} of {items.length}
          </div>
          {renderItem(activeItem, false)}

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
                  ? "border-[#667154] ring-2 ring-[#667154]/15"
                  : "border-[#ddd2c4] hover:border-[#b9aa97]"
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
