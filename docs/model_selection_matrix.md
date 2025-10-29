# ChatGPT‑5 Subset Modes: Selection Matrix

> Source of truth: ChatGPT‑5 is the single model. All listed options are *subsets/modes* of ChatGPT‑5 with different latency/cost/context trade‑offs.

## Defaults
- **Primary default:** Auto
- **Editing default:** Thinking Standard
- **Planning/Review default:** Pro (read‑only)
- **Latency default:** Instant

## Quick Selection Table
| Task | Subset/Mode | Notes |
|---|---|---|
| Repo exploration, listing files, symbol scans | **Instant** | Low latency. Non‑complex reads. |
| Quick edits ≤10 lines | **Thinking Mini** | Small context. Deterministic changes. |
| Single‑file refactor or function‑level change | **Thinking Light** | Mild dependencies. |
| Multi‑file feature or refactor | **Thinking Standard** | Balanced depth and speed. |
| Cross‑module change with broad dependencies | **Thinking Extended** | Larger context window. |
| Architecture redesign or systemic debugging | **Thinking Heavy** | Maximum context and reasoning. |
| Code review, audit, architecture assessment | **Pro** | Read‑only analysis. Long context. |
| Mixed or unclear tasks | **Auto** | Delegates selection dynamically. |
| Documentation, summaries, planning memos | **ChatGPT‑5** | General reasoning. |

## Decision Rules
1. **Scope small?** Use Thinking Mini.
2. **Single file moderate?** Use Thinking Light.
3. **Multi‑file?** Use Thinking Standard.
4. **Spans many modules or hidden couplings?** Use Thinking Extended.
5. **Repo‑wide or architectural risk?** Use Thinking Heavy.
6. **Read‑only critique or plan?** Use Pro.
7. **Speed over depth?** Use Instant.
8. **Unsure?** Use Auto.

## Repo Workflow Mapping
- **Explore:** `list_files_code`, `read_file_code` → **Instant**.
- **Plan:** produce plan text → **Pro**.
- **Small edit (≤10 lines):** `replace_lines_code` → **Thinking Mini**.
- **New files or large edits:** `create_file_code` → **Thinking Standard/Extended** by scope.
- **Post‑change checks:** `get_diagnostics_code` → **Instant**.

## Notes
- Modes do not change core capabilities. They adjust latency, cost, and context use.
- Escalate only when scope demands. Downgrade when tasks narrow.
