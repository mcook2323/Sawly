"use client";

import { useState } from "react";
import { getOutdoorTableBuildSteps } from "@/data/buildSteps";
import type { ShoppingList } from "@/calculations/materials";
import type { GeneratedTablePlan } from "@/calculations/table";
import { BuildStepsPanel } from "@/components/BuildStepsPanel";
import { CutListPanel } from "@/components/CutListPanel";
import { PrintablePlan } from "@/components/PrintablePlan";
import { ShoppingListPanel } from "@/components/ShoppingListPanel";

interface PlanTabsProps {
  plan: GeneratedTablePlan;
  shoppingList: ShoppingList;
}

const TABS = [
  { id: "shopping", label: "Shopping List" },
  { id: "cuts", label: "Cut List" },
  { id: "steps", label: "Build Steps" },
  { id: "print", label: "Printable Plan" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PlanTabs({ plan, shoppingList }: PlanTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("shopping");
  const buildSteps = getOutdoorTableBuildSteps(plan.inputs.wood);

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
    <section className="mt-6 sm:mt-8">
      <div className="print-hide mb-4 overflow-x-auto pb-1">
        <div
          role="tablist"
          aria-label="Project plan sections"
          className="inline-flex min-w-full rounded-full border border-[#d8cdbf] bg-[#eee7dc] p-1 sm:min-w-0"
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
                className={`min-w-max flex-1 cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold transition-all sm:flex-none sm:px-6 ${
                  isActive
                    ? "bg-[#fffdf9] text-[#443a32] shadow-[0_4px_16px_rgba(91,70,49,0.12)]"
                    : "text-[#7f7368] hover:bg-white/50 hover:text-[#443a32]"
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
        className="print-hide rounded-[2rem] border border-[#ddd2c4] bg-[#fffdf9] p-5 shadow-[0_18px_55px_rgba(91,70,49,0.09)] sm:p-8"
      >
        <ShoppingListPanel shoppingList={shoppingList} />
      </div>

      <div
        id="cuts-panel"
        role="tabpanel"
        aria-labelledby="cuts-tab"
        hidden={activeTab !== "cuts"}
        className="print-hide rounded-[2rem] border border-[#ddd2c4] bg-[#fffdf9] p-5 shadow-[0_18px_55px_rgba(91,70,49,0.09)] sm:p-8"
      >
        <CutListPanel plan={plan} />
      </div>

      <div
        id="steps-panel"
        role="tabpanel"
        aria-labelledby="steps-tab"
        hidden={activeTab !== "steps"}
        className="print-hide rounded-[2rem] border border-[#ddd2c4] bg-[#fffdf9] p-5 shadow-[0_18px_55px_rgba(91,70,49,0.09)] sm:p-8"
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
