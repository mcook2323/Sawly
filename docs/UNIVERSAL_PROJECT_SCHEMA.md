# Universal wood-project schema

`UniversalWoodProject` is Sawly's provider-neutral representation for furniture, storage, cabinetry, outdoor structures, play structures, landscape projects, workshops, and architectural woodwork. It carries dimensions, environment, intended use, components, connections, materials, hardware, cuts, tools, steps, visualization metadata, warnings, and verification boundaries.

## Authority boundary

The schema represents a project; it does not engineer one. Span limits, load paths, footing design, anchorage, guards, fall protection, wind and snow loads, and jurisdictional code rules belong in project-specific deterministic engines or qualified specialist review. Shared validation checks IDs, references, positive cut dimensions, category validity, and required warnings. It does not certify structural safety or code compliance.

Risk tiers communicate that boundary:

- `nonstructural`: furniture and similar projects whose verified generator assumptions do not describe building structure.
- `moderately-structural`: projects that carry meaningful loads or require anchorage but are not automatically treated as code-sensitive by the product definition.
- `code-sensitive`: occupied, elevated, site-anchored, or building-related projects that require explicit structural, site, or jurisdiction review.

## Existing generators

`adaptOutdoorTablePlan` and `adaptOutdoorBenchPlan` translate existing deterministic plans without changing their formulas. The original plan remains the calculation source of truth. The adapters add universal IDs, component relationships, connection metadata, tools, verification steps, warnings, and visualization capabilities.

The pergola, cabinet, and playhouse records in `data/universalProjectExamples.ts` are schema examples only. They deliberately carry blocking warnings and are not build-ready plans.
