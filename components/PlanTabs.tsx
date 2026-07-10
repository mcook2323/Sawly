"use client";

import { useState } from "react";
import type { ShoppingList } from "@/calculations/materials";
import type { GeneratedProjectPlan } from "@/calculations/projectPlan";
import type { BuildStep } from "@/data/buildSteps";
import { BuildStepsPanel } from "@/components/BuildStepsPanel";
import { CutListPanel } from "@/components/CutListPanel";
import { PrintablePlan } from "@/components/PrintablePlan";
import { ShoppingListPanel } from "@/components/ShoppingListPanel";

interface PlanTabsProps {
  plan: GeneratedProjectPlan;
  shoppingList: ShoppingList;
  buildSteps: BuildStep[];
}

const TABS = [
  { id: "shopping", label: "Shopping List" },
  { id: "cuts", label: "Cut List" },
  { id: "steps", label: "Build Steps" },
  { id: "print", label: "Printable Plan" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PlanTabs({ plan, shoppingList, buildSteps }: PlanTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("shopping");

  function selectAdjacentTab(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) {
    const direction =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

    if (direction === 0 && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? TABS.length - 1
          : (currentIndex + direction + TABS.length) % TABS.length;
    const nextTab = TABS[nextIndex];

    setActiveTab(nextTab.id);
    document.getElementById(`${nextTab.id}-tab`)?.focus();
  }

  return (
    <section className="mt-10 sm:mt-14">
      <div className="print-hide overflow-x-auto">
        <div
          role="tablist"
          aria-label="Project plan sections"
          className="inline-flex min-w-full border-b border-[#d8cdbf] sm:min-w-0"
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => selectAdjacentTab(event, index)}
                className={`min-w-max flex-1 cursor-pointer border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors sm:flex-none sm:px-6 ${
                  isActive
                    ? "border-[#667154] text-[#435037]"
                    : "border-transparent text-[#8a7e73] hover:border-[#c5b8a8] hover:text-[#443a32]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="shopping-panel"
        role="tabpanel"
        aria-labelledby="shopping-tab"
        hidden={activeTab !== "shopping"}
        className="print-hide py-8 sm:py-10"
      >
        <ShoppingListPanel shoppingList={shoppingList} />
      </div>

      <div
        id="cuts-panel"
        role="tabpanel"
        aria-labelledby="cuts-tab"
        hidden={activeTab !== "cuts"}
        className="print-hide py-8 sm:py-10"
      >
        <CutListPanel plan={plan} />
      </div>

      <div
        id="steps-panel"
        role="tabpanel"
        aria-labelledby="steps-tab"
        hidden={activeTab !== "steps"}
        className="print-hide py-8 sm:py-10"
      >
        <BuildStepsPanel steps={buildSteps} />
      </div>

      <div
        id="print-panel"
        role="tabpanel"
        aria-labelledby="print-tab"
        hidden={activeTab !== "print"}
        className="print-panel"
      >
        <PrintablePlan
          plan={plan}
          shoppingList={shoppingList}
          buildSteps={buildSteps}
        />
      </div>
    </section>
  );
}
