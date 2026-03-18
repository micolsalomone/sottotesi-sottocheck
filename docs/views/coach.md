**Coach Dashboard – System Guidelines**

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

# General guidelines

* This is an MVP.
* Prefer reuse of layout and patterns from the Student Dashboard.
* Do NOT introduce admin-level complexity.
* Assume the coach is already inside a specific student timeline.
* No global student list or admin navigation here.

--------------

# Role principles (Coach)

* The coach:
  - controls step completion
  - reviews documents
  - optionally adds notes
  - can initiate plagiarism checks
* Only the coach can mark a step as completed.
* The coach view must clearly show:
  - what the student has done
  - what is pending
  - what actions are available now

--------------

# Timeline guidelines (Coach)

* Same timeline structure as student:
  - vertical
  - step-based
* Current step must be clearly highlighted.
* Steps are treated as contextual “threads”:
  - documents
  - notes
  - revisions
* Do NOT separate activity logs into a different section.

--------------

# Current step behavior (Coach)

* The current step may contain:
  - documents sent by the student
  - notes from the student
  - coach notes or uploads
* Actions available to the coach:
  - read / download documents
  - upload revised documents
  - add notes
  - trigger plagiarism check
  - mark step as completed
* Step completion is explicit and manual.

--------------

# Documents & archive (Coach)

* Documents are always shown in context of a step.
* An archive may exist but must be:
  - minimal
  - filterable by step
* For each document show only:
  - sender (student / coach)
  - creation date
  - related step
  - plagiarism check status (if any)
  - revision status (coach / optional internal reviewer)
* Avoid heavy table layouts.

--------------

# Notes (Coach)

* Notes are asynchronous.
* Notes are contextual to a step.
* Notes are not a chat.
* Notes may explain:
  - decisions
  - feedback
  - next actions
* Keep notes visually lightweight.

--------------

# Timeline editing

* The coach can enter “edit timeline mode”.
* Timeline editing can be handled via a drawer.
* In edit mode:
  - current step end date must always be editable
  - new steps can be added before or after existing ones
* Do NOT redesign the full timeline editor yet.
* Editing is incremental and contextual.

--------------

# Simulations & visibility (for testing)

* Simulate student actions:
  - document upload
  - note creation
* These simulations must:
  - be visually noticeable
  - persist until the coach interacts
* Use subtle transitions:
  - no sounds
  - no intrusive notifications

--------------

# Navigation

* Topbar should reflect:
  - coach role
  - student context (who this timeline belongs to)
* Provide access to:
  - student profile (drawer or secondary view)
* Do NOT expose admin-only actions.

--------------

# Design system

* Keep visual consistency with Student Dashboard.
* Reuse spacing, typography, and layout logic.
* Minimal UI over feature density.
* No decorative elements without function.
-->
