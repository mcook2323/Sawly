"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getMaterialLabel,
  type WoodMaterial,
} from "@/calculations/materialCatalog";
import { generateShoppingList } from "@/calculations/materials";
import { generateTablePlan } from "@/calculations/table";
import { MaterialSelector } from "@/components/MaterialSelector";
import { OutdoorTableGalleryVisual } from "@/components/OutdoorTableGalleryVisual";
import { PlanTabs } from "@/components/PlanTabs";
import { ProjectGallery } from "@/components/ProjectGallery";
import { ProjectSummary } from "@/components/ProjectSummary";
import { OUTDOOR_TABLE_GALLERY_ITEMS } from "@/data/projectGallery";

const DIMENSION_RULES = {
  length: { label: "Length", min: 36, max: 144 },
  width: { label: "Width", min: 24, max: 60 },
  height: { label: "Height", min: 18, max: 42 },
};

function validateDimension(
  value: string,
  rule: (typeof DIMENSION_RULES)[keyof typeof DIMENSION_RULES]
) {
  if (value.trim() === "") {
    return `${rule.label} is required.`;
  }

  const measurement = Number(value);

  if (!Number.isFinite(measurement)) {
    return `${rule.label} must be a number.`;
  }

  if (measurement < rule.min || measurement > rule.max) {
    return `${rule.label} must be ${rule.min}-${rule.max} inches.`;
  }

  return null;
}

export default function OutdoorTablePage() {
  const [lengthInput, setLengthInput] = useState("72");
  const [widthInput, setWidthInput] = useState("36");
  const [heightInput, setHeightInput] = useState("30");
  const [wood, setWood] = useState<WoodMaterial>("pine");

  const length = Number(lengthInput) || 0;
  const width = Number(widthInput) || 0;
  const height = Number(heightInput) || 0;

  const dimensionFields = [
    {
      key: "length",
      value: lengthInput,
      setValue: setLengthInput,
      rule: DIMENSION_RULES.length,
    },
    {
      key: "width",
      value: widthInput,
      setValue: setWidthInput,
      rule: DIMENSION_RULES.width,
    },
    {
      key: "height",
      value: heightInput,
      setValue: setHeightInput,
      rule: DIMENSION_RULES.height,
    },
  ];

  const validationErrors = dimensionFields
    .map(({ value, rule }) => validateDimension(value, rule))
    .filter((error): error is string => error !== null);

  const plan =
    validationErrors.length === 0
      ? generateTablePlan({
          length,
          width,
          height,
          wood,
          style: "modern",
        })
      : null;

  const shoppingList = plan
    ? generateShoppingList(plan.cutList, plan.hardware)
    : null;

  return (
    <main className="print-root min-h-screen bg-[#f7f3eb] text-[#332b25]">
      <div className="print-page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="print-hide">
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#7d7268] transition-colors hover:text-[#657151] sm:mb-8"
          >
            <span
              aria-hidden="true"
              className="transition-transform group-hover:-translate-x-1"
            >
              ←
            </span>
            All projects
          </Link>

          <ProjectSummary
            projectName="Modern Outdoor Table"
            estimatedCostRange={shoppingList?.estimatedCostRangeCents ?? null}
            isReady={Boolean(plan && shoppingList)}
            materialLabel={getMaterialLabel(wood)}
          />

          <ProjectGallery
            items={OUTDOOR_TABLE_GALLERY_ITEMS}
            ariaLabel="Outdoor Table views"
            renderItem={(item, isThumbnail) => (
              <OutdoorTableGalleryVisual
                view={item.view}
                length={length}
                width={width}
                height={height}
                wood={wood}
                thumbnail={isThumbnail}
              />
            )}
          />

          <section className="mt-6 rounded-[2rem] border border-[#d9cdbd] bg-[#fffdf9] p-5 shadow-[0_18px_55px_rgba(91,70,49,0.09)] sm:p-7 lg:p-8">
            <div className="grid gap-7 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a05f47]">
                  Make it yours
                </p>
                <h2 className="editorial-title mt-2 text-3xl">
                  Project details
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#7d7268]">
                  Adjust the dimensions or material and every gallery view and
                  plan section updates instantly.
                </p>
              </div>

              <div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {dimensionFields.map(({ key, value, setValue, rule }) => {
                    const error = validateDimension(value, rule);

                    return (
                      <div key={key}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label
                            htmlFor={`${key}-input`}
                            className="text-sm font-semibold text-[#4b4139]"
                          >
                            {rule.label}
                          </label>
                          <span className="text-xs text-[#9a8e83]">inches</span>
                        </div>
                        <div className="relative">
                          <input
                            id={`${key}-input`}
                            type="number"
                            min={rule.min}
                            max={rule.max}
                            value={value}
                            aria-invalid={Boolean(error)}
                            aria-describedby={
                              error ? `${key}-error` : `${key}-range`
                            }
                            onChange={(event) => setValue(event.target.value)}
                            className="w-full rounded-xl border border-[#d9cdbd] bg-[#fbf8f2] px-4 py-3.5 pr-12 text-base font-semibold text-[#332b25] outline-none transition-all hover:border-[#b9aa97] focus:border-[#73805f] focus:ring-4 focus:ring-[#73805f]/10 aria-invalid:border-[#b75d4b]"
                          />
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#9a8e83]">
                            in
                          </span>
                        </div>
                        {error ? (
                          <p
                            id={`${key}-error`}
                            className="mt-2 text-xs leading-5 text-[#a44f40]"
                          >
                            {error}
                          </p>
                        ) : (
                          <p
                            id={`${key}-range`}
                            className="mt-2 text-xs text-[#a79b90]"
                          >
                            {rule.min}–{rule.max} in
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-[#e4dacd] pt-6">
                  <MaterialSelector
                    value={wood}
                    onChange={setWood}
                    layout="grid"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {plan && shoppingList ? (
          <PlanTabs plan={plan} shoppingList={shoppingList} />
        ) : (
          <div className="print-hide mt-6 rounded-2xl border border-[#d8a69b] bg-[#f8eae5] p-5 sm:mt-8 sm:p-6">
            <h2 className="font-semibold text-[#87493d]">Check your dimensions</h2>
            <p className="mt-1 text-sm leading-6 text-[#7d665f]">
              Enter measurements within the supported ranges to generate the
              shopping list, cut list, hardware, and printable plan.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
