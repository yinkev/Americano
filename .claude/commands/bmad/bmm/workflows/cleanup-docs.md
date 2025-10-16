---
model: claude-haiku-4-5-20251001
description: Reorganize documentation files per BMM workflow conventions
---

<steps CRITICAL="TRUE">
Call multiple specialized claude code agents in parallel to:

1. Find all documentation files created by specialized agents (search `/docs/` and `/apps/web/src/` for `.md` files)
2. Review BMM workflow structure at `/Users/Kyin/Projects/Americano/bmad/bmm/` to understand organization patterns
3. Reorganize files per BMM conventions:
   - Move technical decisions to `/docs/technical/`
   - Consolidate implementation summaries into story files at `/docs/stories/`
   - Keep validation checklists separate for SM agent workflow
   - Remove markdown files from source code directories
4. Delete out-of-place files after successful reorganization
5. Report actions taken concisely (what was moved, consolidated, or deleted)

The agent should analyze existing BMM patterns and align new documentation accordingly, following the established project structure.
</steps>