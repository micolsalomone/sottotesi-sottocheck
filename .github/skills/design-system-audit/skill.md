---

name: design-system-audit
description: Analyze the Sottotesi visual system and design tokens without modifying code. Inventory colors, typography, spacing, radius, borders, elevation and semantic states, identify invalid or duplicated values, and propose a coherent token vocabulary grounded in the existing UI.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Design System Audit

Use this skill to understand and rationalize the Sottotesi visual language before changing tokens or component styles.

This skill is READ-ONLY unless the user explicitly asks to implement approved changes.

## Before starting

Read:

1. `AGENTS.md`
2. `docs/architecture.md`
3. relevant files in `docs/views/`
4. `src/styles/theme.css`
5. global stylesheets actually imported by the application

Then inspect component-level CSS, Tailwind classes and inline styles.

Do not treat `theme.css` as automatically correct simply because it is the designated token source.

Compare the declared system against the implementation actually in use.

## Goal

Identify the smallest coherent visual vocabulary that can represent the current product without losing meaningful distinctions.

Do not redesign the application.

Do not normalize values simply because they are numerically similar.

A visual difference should be preserved when it communicates a meaningful difference in:

* hierarchy
* state
* severity
* category
* interaction
* content type
* workflow
* application context

## Audit levels

Separate findings into three levels.

### Primitive values

Raw visual values such as:

* colors
* font sizes
* font weights
* spacing
* radius
* border widths
* shadows

### Semantic tokens

Values representing meaning, such as:

* text-primary
* text-secondary
* text-muted
* surface-default
* surface-subtle
* border-default
* action-primary
* action-danger
* status-success
* status-warning
* status-error

### Component usage

How semantic concepts are expressed by actual components.

Prefer the relationship:

primitive value
→ semantic token
→ component

Avoid component code depending unnecessarily on arbitrary raw values.

## Undefined tokens

Search for CSS custom properties used by the application but not defined in the active token system.

For every undefined token report:

* token name
* consumers
* expected responsibility
* whether a suitable existing token appears to exist
* visual or functional risk

Treat undefined CSS variables as high priority because they may cause invalid declarations or inconsistent fallbacks.

Do not invent replacements without inspecting context.

## Colors

Inventory active colors across:

* CSS variables
* CSS declarations
* Tailwind classes
* inline styles
* SVG/icon styling where relevant

Classify their role:

* brand
* text
* surface
* border
* interaction
* semantic status
* category
* decoration

Identify:

* exact duplicate colors
* near-duplicate colors
* hardcoded values equivalent to existing tokens
* multiple tokens representing apparently identical meaning
* one token used for unrelated meanings
* semantic states represented inconsistently

Do not assume equal colors require equal semantic tokens.

Different semantic roles may intentionally resolve to the same primitive value.

Flag important information conveyed only by color.

## Semantic status colors

Create an inventory of status concepts used by the application.

Examples may include:

* active
* pending
* completed
* warning
* failed
* suspended
* archived
* processing
* review states

Do not use implementation variant names as evidence of semantics.

For example, a component receiving `status="warning"` merely to produce an amber color does not prove the underlying business state is "warning".

Report cases where styling API and business meaning are conflated.

## Typography

Inventory actual typography roles rather than only numeric combinations.

Investigate:

* display/title
* page title
* section heading
* card title
* body
* label
* metadata
* helper text
* table content
* badge text
* navigation
* button text

For each role inspect:

* font family
* font size
* font weight
* line height
* letter spacing
* casing
* color

Identify accidental variants.

Also verify that requested font weights are actually available in loaded font resources.

Flag synthetic font weights or undocumented type roles.

Do not collapse roles solely because they currently share the same numeric values.

## Spacing

Inventory recurring spacing patterns.

Distinguish:

* page inset
* section spacing
* component padding
* component gap
* inline spacing
* dense table spacing
* form spacing

Identify repeated hardcoded spacing values.

Determine whether repetition represents:

* an intentional spacing scale
* responsive layout behavior
* component-specific geometry
* accidental duplication

Do not create an excessively granular spacing-token system.

Prefer a small useful scale plus semantic layout tokens where necessary.

## Radius

Inventory radius usage by responsibility.

Examples:

* content containers
* cards
* controls
* badges/pills
* avatars
* progress indicators
* decorative shapes

Do not normalize geometric roles that are intentionally different.

Flag multiple radius values used for the same responsibility without explanation.

## Borders

Audit:

* default borders
* subtle separators
* active/selected borders
* error borders
* focus indicators

Check whether borders communicate state consistently.

## Elevation

Inventory box shadows and other elevation treatments.

Classify them by responsibility:

* drawer
* modal
* floating action
* sticky content
* elevated card
* dropdown/popover

Identify nearly identical shadows implemented independently.

Do not create many elevation levels unless the interface actually needs them.

## Interaction states

For interactive primitives inspect:

* default
* hover
* active
* focus-visible
* selected
* disabled
* loading
* error

Identify components whose default style exists but whose interaction states are incomplete or inconsistent.

Focus-visible must remain distinguishable from hover and selected states.

## Responsive differences

Do not automatically classify responsive values as inconsistencies.

For page insets, typography and component spacing determine whether differences are:

* intentional responsive behavior
* view-specific behavior
* legacy inconsistency

## Output

Produce:

### Current visual vocabulary

Summarize the visual language that is genuinely established in the application today.

### Critical issues

List first:

* undefined tokens
* broken declarations
* inaccessible contrast or state distinctions
* missing font weights
* conflicting semantic state definitions

### Token inventory

Create tables for:

* color
* typography
* spacing
* radius
* border
* elevation

For each item classify:

* KEEP
* CONSOLIDATE
* REPLACE
* REMOVE
* INVESTIGATE

### Semantic-state inventory

Map business states to their current visual representations.

Highlight ambiguous concepts separately.

### Hardcoded-value inventory

Group repeated hardcoded values by equivalent token where possible.

Do not list every occurrence individually if many consumers share the same issue.

### Proposed vocabulary

Propose a coherent target vocabulary.

Separate:

* primitive values
* semantic tokens
* component-level variants

This is a proposal only.

Do not modify `theme.css`.

### Migration risks

Explain which normalization changes could unintentionally alter product meaning or hierarchy.

### Recommended sequence

Order changes from:

1. correctness
2. accessibility
3. semantic consistency
4. consolidation
5. cosmetic normalization

## Never do during this audit

Unless explicitly requested:

* do not modify `theme.css`
* do not replace hardcoded values
* do not delete tokens
* do not rename tokens
* do not change colors
* do not change typography
* do not modify components
* do not introduce a new design system library
* do not normalize semantic differences automatically
