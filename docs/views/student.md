**Student Dashboard – System Guidelines**

<!--
Use this file to guide LLMs when generating or updating
the Student Dashboard experience.
Focus on MVP, clarity, and minimal UI.
-->

# General guidelines

* This is an MVP. Prefer clarity over completeness.
* Do NOT introduce new pages or complex navigation structures.
* The student must stay inside the dashboard flow as much as possible.
* Avoid drawers as “sources of truth”. Drawers are allowed only for actions (e.g. upload).
* No real-time chat assumptions. Communication is asynchronous.
* Do not add features unless explicitly requested.

--------------

# Experience principles

* Everything must be **in context** of the timeline step.
* The student should always understand:
  - where they are in the journey
  - what the current step is
  - what they can do now
* Reduce cognitive load:
  - minimal UI
  - no duplicated information
  - no hidden critical actions

--------------

# Timeline guidelines

* Timeline is the main structure of the page.
* Timeline is vertical.
* Clearly show:
  - start date
  - completed steps
  - current step (highlighted)
  - next step
  - expected end date
* Past and future steps can be visually reduced or collapsed.
* The current step is the primary interaction area.

--------------

# Current step behavior (Student)

* Each step may contain:
  - step title (defined by coach)
  - short description
  - optional notes from coach
* Primary action (if present):
  - Upload document
* Secondary actions:
  - Add a note (simple text, no drawer)
* Notes are asynchronous and contextual, not chat messages.

--------------

# Documents & upload

* Upload happens from the current step.
* Use a drawer only for:
  - file selection
  - basic explanation of what happens next
* After upload:
  - show document inside the step history
  - show clear status (e.g. “In review”)
* Do NOT use spinners that imply automatic plagiarism check.
* Do NOT show plagiarism page limits to the student.

--------------

# Notes (Student)

* Notes are lightweight and optional.
* Notes belong to a step.
* Notes appear inline in the step history.
* No chat UI patterns.
* No success screens after sending a note.

--------------

# Visual feedback & transitions

* Use subtle transitions to show new content:
  - fade-in or light highlight
* New notes or documents should be visible immediately.
* Never rely on elements that disappear quickly.

--------------

# Navigation

* Topbar must be minimal and consistent with the fact that:
  - the user is logged in
  - this app is accessed from sottotesi.it
* Do NOT reinvent global navigation.
* No duplicated “home” concepts.
* Coach terminology must be used (never “tutor”).

--------------

# Design system

* Minimal UI.
* Use brand colors only where meaningful.
* Avoid decorative icons.
* If an icon is used, it must be functional and understandable.
* Illustrations (if any):
  - very simple
  - brand colors
  - clearly decorative, not functional
-->
