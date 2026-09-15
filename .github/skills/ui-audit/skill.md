---

name: ui-audit
description: Audit the Sottotesi UI without modifying code. Inventory components, visual patterns, variants, duplicated implementations, unused candidates and inconsistencies, distinguishing accidental duplication from meaningful semantic differences.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# UI Audit

Use this skill when inspecting the Sottotesi interface before cleanup, refactoring or design-system consolidation.

The purpose of the audit is to understand the existing UI vocabulary before changing it.

This skill is READ-ONLY unless the user explicitly asks to implement changes after reviewing the audit.

## Before starting

Read:

1. `AGENTS.md`
2. `docs/architecture.md`
3. the relevant file in `docs/views/` for the view being audited
4. `src/styles/theme.css`

Then inspect the actual implementation.

Documentation is context, not proof of implementation. Verify findings against the code.

## Core principle

Do not optimize for the lowest possible component count.

Optimize for the smallest coherent component vocabulary that correctly represents the product.

Two components that look similar are not necessarily duplicates.

Two components that look different are not necessarily semantically different.

Always investigate meaning, behavior and usage before recommending consolidation.

## What to audit

Depending on the requested scope, inspect:

* buttons
* badges
* status indicators
* inputs
* selects
* textareas
* cards
* panels
* containers
* tables
* list items
* navigation elements
* headers
* empty states
* alerts
* modals
* drawers
* tabs
* filters
* typography
* colors
* spacing
* borders
* radius
* shadows
* icons
* interaction states
* loading states
* disabled states
* error states
* success states

Also identify components or styles that appear unused.

## For each component or pattern

Determine:

### Responsibility

What does it represent or allow the user to do?

Do not classify components only by visual appearance.

### Consumers

Identify where it is used.

Consider different views separately:

* Admin
* Coach
* Student
* Public

A shared visual pattern does not automatically justify sharing application-level components across these contexts.

### Structure

Compare:

* markup
* props
* behavior
* interaction
* styling
* states
* data meaning
* accessibility behavior

### Semantic differences

Determine whether visual differences communicate meaningful distinctions such as:

* status
* hierarchy
* severity
* category
* permission
* interaction
* workflow state
* contextual meaning

If they do, preserve the distinction unless it can be expressed more coherently through a shared primitive with explicit semantic variants.

### Accidental differences

Look for differences caused only by implementation history, such as:

* slightly different padding
* near-identical colors
* arbitrary font sizes
* duplicated CSS
* different border radius without semantic reason
* duplicate components created by separate prototypes
* locally recreated patterns already available elsewhere

These are strong consolidation candidates.

## Classification

Classify findings using these labels.

### KEEP

The implementation is coherent, necessary and appropriately differentiated.

### CONSOLIDATE

Multiple implementations represent the same underlying responsibility and can likely share a component, primitive or token.

### REPLACE

An implementation can be replaced by an existing component or pattern already present in the project.

### REMOVE

The implementation appears unused or obsolete.

Only use REMOVE when references and consumers have been checked.

### INVESTIGATE

There is not enough evidence to safely decide.

Use this when:

* semantics are unclear
* dynamic usage may exist
* documentation and implementation disagree
* consolidation could affect behavior or meaning

## Component consolidation test

Before recommending consolidation, evaluate:

1. Do the components have the same responsibility?
2. Do they represent the same type of information or interaction?
3. Are their behavioral differences minor or expressible as clear variants?
4. Are their visual differences semantic rather than accidental?
5. Would consolidation make the API easier to understand?
6. Would consolidation reduce duplication without creating a highly configurable universal component?

If consolidation would require many unrelated boolean props, context flags or exceptional branches, prefer separate components.

Avoid patterns such as:

`isStudent`, `isCoach`, `isAdmin`, `compact`, `special`, `alternative`, `legacy`

inside a generic component when those flags represent fundamentally different responsibilities.

## Architecture boundaries

Do not recommend merging application shells only because they look similar.

In particular, preserve the architectural separation of:

* Admin Layout / Header / Sidebar
* Coach Layout / Header / Sidebar
* Student Layout / Header / Sidebar
* Public Layout / Header / Sidebar

Shared primitives may be appropriate.

Shared application context is a separate architectural decision.

## Style audit

When inspecting visual implementation, compare values against `src/styles/theme.css`.

Identify:

* existing token used correctly
* hardcoded value that duplicates an existing token
* multiple tokens with apparently equivalent values
* missing semantic token
* inconsistent usage of the same semantic concept
* one-off visual values without a clear reason

Do not automatically create tokens during an audit.

Report the issue first.

## Typography audit

Inventory meaningful text styles.

Compare:

* font size
* font weight
* line height
* letter spacing
* color
* semantic role

Look for accidental combinations such as several visually indistinguishable body-text styles.

Do not collapse typography purely because numeric values are similar.

Heading, label, helper text, metadata and table content may require distinct semantic roles.

## Color audit

Determine whether color is being used for:

* brand
* hierarchy
* interaction
* semantic state
* category
* decoration

Flag cases where near-identical colors are used without a clear semantic distinction.

Also flag cases where color alone conveys important information.

## Output format

Produce an audit report before proposing implementation.

Start with:

### Scope

What files, views or component families were inspected.

### Executive summary

A short description of the overall state of the audited area.

### Findings

Use a table when practical:

| Item | Current implementations | Classification | Reason | Risk |
| ---- | ----------------------- | -------------- | ------ | ---- |

### Consolidation candidates

List the strongest opportunities first.

For each candidate explain:

* what can be consolidated
* what should remain different
* likely shared primitive or component
* possible impact

### Design-system inconsistencies

Report inconsistencies in:

* typography
* color
* spacing
* borders
* radius
* shadows
* interaction states

### Possible unused code

List candidates only.

Do not delete anything during an audit.

### Product or documentation conflicts

Report separately any case where implementation and documented product intent disagree.

Do not resolve these conflicts implicitly.

### Recommended order of intervention

Suggest a sequence from lowest-risk / highest-value changes to higher-risk changes.

## Never do during an audit

Unless explicitly requested:

* do not modify code
* do not delete files
* do not rename components
* do not create shared components
* do not change tokens
* do not modify routes
* do not change permissions
* do not change UX flows
* do not normalize differences whose semantic role has not been established
