# Draft Curation + AI vs Curated View

## Goal
Allow staff to edit curation in a local draft state before saving. The original AI output remains visible and unchanged.

## UI Behavior
- **View Toggle:** Request detail has a "Curated" vs "AI" toggle.
  - **Curated**: editable item list (ItemEditor) + Save Curation.
  - **AI**: read-only list of items and the original AI-suggested fractions.
- **Draft Changes Badge:** When edits are made (including delete initiation), a "Draft Changes" badge appears in Curated view.
- **Make Golden:** After curation, staff can publish a golden request with title/notes.

## Notes
- Draft state is local to the page until Save Curation is used.
- The AI snapshot is shown in request details (raw JSON + model), and is immutable.
- Golden drafts are created server-side on curation save; publishing happens via the "Make Golden" dialog.
