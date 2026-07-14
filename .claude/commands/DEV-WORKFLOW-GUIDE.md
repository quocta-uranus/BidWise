# Frontend Development Workflow Guide

This guide explains how to use the 4 Claude Code slash commands that make up the standard development workflow for this project. Every feature, bugfix, or API request follows a consistent process — planned, documented, tested, and reviewed.

---

## Overview

| Command | Purpose | When to use |
|---------|---------|-------------|
| [`/dev-plan`](#1-dev-plan) | Create task plan + track progress | Start of every feature or bugfix |
| [`/dev-rca`](#2-dev-rca) | Root cause analysis before fixing | Before fixing any bug |
| [`/dev-backend-request`](#3-dev-backend-request) | Write backend API proposal | When FE needs a new or changed API |
| [`/dev-test`](#4-dev-test) | Generate test plan + unit + E2E | After implementation is complete |
| [`/dev-review`](#5-dev-review) | Code review across 5 dimensions | Before every commit / PR |

All artifacts are saved to `docs/tasks/{name}/` or `docs/api_docs/`. Nothing is in your head — everything is tracked in files.

---

## Full Workflow Decision Tree

```
Is this a bug or a feature?
│
├── 🐛 BUG
│   │
│   ├── 1. /dev-rca "describe the broken behaviour"
│   │         → saves docs/tasks/{name}/RCA.md
│   │         → identifies root cause before touching any code
│   │
│   ├── Does the fix need a backend API change?
│   │   ├── YES → 2a. /dev-backend-request "describe what API is needed"
│   │   │              → saves docs/api_docs/{name}-proposal.md
│   │   │              → share with backend, wait for confirmation
│   │   └── NO  → skip to step 3
│   │
│   ├── 3. /dev-plan "describe the fix"
│   │         → saves docs/tasks/{name}/PLAN.md
│   │         → creates phased tasks with status tracking
│   │
│   ├── 4. Implement the fix
│   │         → mark tasks [x] in PLAN.md as you go
│   │
│   ├── 5. /dev-test
│   │         → saves docs/tasks/{name}/TEST-PLAN.md
│   │         → generates unit test stubs + E2E spec
│   │
│   └── 6. /dev-review → commit → PR
│
└── ✨ FEATURE
    │
    ├── Does it need a backend API?
    │   ├── YES → 1a. /dev-backend-request "describe what API is needed"
    │   │              → saves docs/api_docs/{name}-proposal.md
    │   │              → wait for backend to confirm contract
    │   └── NO  → skip to step 2
    │
    ├── 2. /dev-plan "describe the feature"
    │         → saves docs/tasks/{name}/PLAN.md
    │
    ├── 3. Implement the feature
    │         → mark tasks [x] in PLAN.md as you go
    │
    ├── 4. /dev-test
    │         → saves docs/tasks/{name}/TEST-PLAN.md
    │         → generates unit test stubs + E2E spec
    │
    └── 5. /dev-review → commit → PR
```

---

## 1. `/dev-plan`

**Purpose:** Create a structured implementation plan before writing any code. Tracks progress as you work.

### Usage

```
/dev-plan <description>
```

**Examples:**

```
/dev-plan "Add dark mode toggle to settings page"
/dev-plan "Fix upload panel not closing after cancel"
/dev-plan "Refactor global upload provider to split into two contexts"
```

### What it does

1. Reads the codebase to understand which files will be touched
2. Identifies the type of work: `FEATURE`, `BUGFIX`, `REFACTOR`, or `CHORE`
3. Creates a phased task plan saved to `docs/tasks/{name}/PLAN.md`

### Output example

```
docs/tasks/fix-upload-panel-close/
└── PLAN.md
```

```markdown
# Plan: Fix upload panel not closing after cancel

Type:    BUGFIX
Status:  🟡 In Progress

## Tasks

### Phase 1 — Root fix
- [ ] TASK-1.1  Fix closePanelHeader selector — `helpers/upload.ts`
- [ ] TASK-1.2  Fix closeAndCancelPanel selector — `helpers/upload.ts`

### Phase 2 — UI
- [ ] TASK-2.1  Verify panel hides after onChange([]) — `upload-status-panel.tsx`

### Phase 3 — Tests
- [ ] TASK-3.1  Unit tests — run /dev-test unit
- [ ] TASK-3.2  E2E tests — run /dev-test e2e
```

### How to track progress

As you complete each task, update the checkbox in `PLAN.md`:

```markdown
- [x] TASK-1.1  Fix closePanelHeader selector    ← done
- [x] TASK-1.2  Fix closeAndCancelPanel selector  ← done
- [ ] TASK-2.1  Verify panel hides...             ← still todo
```

Update the **Status** field:
- `🟡 In Progress` — you have started
- `🔴 Blocked` — waiting on something (add a "Blocked by:" note)
- `✅ Done` — all tasks complete, acceptance criteria met

> ⚠️ **Rule:** If this is a BUGFIX, run `/dev-rca` first. `/dev-plan` will remind you.

---

## 2. `/dev-rca`

**Purpose:** Document the root cause of a bug before writing a single line of fix. Enforces the rule: **understand before you fix**.

### Usage

```
/dev-rca <issue description>
```

**Examples:**

```
/dev-rca "Upload retry button uses wrong folderId for subfolder files"
/dev-rca "Nav guard dialog does not appear when switching Drive views"
/dev-rca "getPanelCounts always returns 0 for completed uploads"
```

### What it does

1. Asks for the symptom, expected vs actual behaviour, and reproduction steps
2. Traces the code path from the user action to the broken point
3. Applies 5 Whys analysis to find the actual root cause
4. Proposes a fix approach (no code changes — analysis only)
5. Saves the report to `docs/tasks/{name}/RCA.md`

### Output example

```
docs/tasks/nav-guard-drive-views/
└── RCA.md
```

```markdown
# RCA: Nav guard dialog does not appear on Drive view switch

Root cause:  clickDriveView uses [cursor=pointer] attribute selector
             but elements use Tailwind class cursor-pointer.
             [cursor=pointer] is Playwright ARIA notation, not a DOM attribute.

Classification: Logic error
Risk of fix:    Low — isolated to one helper function

Files to fix:
  - apps/web/e2e/helpers/upload.ts (line 192)
```

### Rules

- `/dev-rca` produces **analysis only** — no code is changed during this step
- Do not skip this step for bugs. If you cannot explain the root cause, you cannot write a correct fix
- After RCA is complete, run `/dev-plan` to start the fix

---

## 3. `/dev-backend-request`

**Purpose:** Write a formal API proposal that gives the backend team everything they need — endpoint contract, request/response shape, error cases, constraints, and open questions.

### Usage

```
/dev-backend-request <description>
```

**Examples:**

```
/dev-backend-request "Need batch folder creation — current N×POST is too slow for large trees"
/dev-backend-request "Need abort endpoint extended to handle single-mode upload cancellation"
/dev-backend-request "Need pagination on knowledge list API — current response is unbounded"
/dev-backend-request "Need a new field returnedDocId in pre-signed upload response"
```

### What it does

1. Reads existing server actions and API calls to understand the current flow
2. Checks `docs/api_docs/` for similar existing proposals to match the format
3. Produces a complete proposal document saved to `docs/api_docs/{name}-proposal.md`
4. Automatically links the proposal to the active `PLAN.md` if one exists

### Output example

```
docs/api_docs/
└── batch-folder-creation-proposal.md
```

The proposal includes:
- **Background** — why the current API is insufficient, with real data/numbers
- **Problem statement** — before/after comparison table
- **Proposed endpoint** — method, URL, request body with field definitions
- **Response contract** — success shape + all error HTTP codes and messages
- **Frontend integration plan** — how the server action will call it
- **Constraints for backend** — specific requirements (idempotency, timing, field formats)
- **Open questions** — things the backend team needs to decide
- **Acceptance criteria** — FE sign-off checklist

### When to use

Use `/dev-backend-request` when:
- A new endpoint is needed that does not exist
- An existing endpoint is missing a required field
- An existing endpoint is too slow and needs a batch version
- An API error code or response format is wrong
- Backend behaviour needs to change (e.g. make idempotent)

### After writing the proposal

1. Share `docs/api_docs/{name}-proposal.md` with the backend team (link in PR, Slack, Jira)
2. Add it to your `PLAN.md` as TASK-0.1
3. Add TASK-0.2: "Backend confirms API contract" — mark it `[x]` when they reply
4. Only start frontend implementation (Phase 1+) after the contract is agreed

---

## 4. `/dev-test`

**Purpose:** After implementing a feature or fix, generate the test plan document, unit test stubs, and E2E Playwright spec.

### Usage

```
/dev-test              ← full: test plan + unit + E2E for all staged changes
/dev-test unit         ← unit tests only
/dev-test e2e          ← E2E Playwright spec only
/dev-test plan         ← test plan document only, no code generated
/dev-test <file>       ← target a specific file or folder
```

**Examples:**

```
/dev-test
/dev-test unit apps/web/src/components/ui/folder-upload/useFolderUpload.ts
/dev-test e2e
/dev-test plan
```

### What it does

1. Reads `git diff develop...HEAD` to understand what changed
2. Identifies all pure logic (hooks, utils, actions) that needs unit tests
3. Identifies all user-facing flows that need E2E coverage
4. Saves a human-readable test plan to `docs/tasks/{name}/TEST-PLAN.md`
5. Generates unit test stubs in Vitest alongside the source files
6. Generates a Playwright E2E spec in `apps/web/e2e/tests/`

### Output example

```
docs/tasks/fix-upload-panel-close/
└── TEST-PLAN.md

apps/web/src/components/ui/folder-upload/
└── useFolderUpload.test.ts        ← unit tests

apps/web/e2e/tests/drive/
└── upload-panel-close.spec.ts     ← E2E spec
```

### Test plan structure

```markdown
# Test Plan: Fix upload panel close

## Unit Tests

| # | Test case | Input | Expected |
|---|-----------|-------|----------|
| U-01 | closePanelHeader clicks X in header | panel visible | header X clicked |
| U-02 | closeAndCancelPanel does nothing when panel hidden | panel not visible | returns early |

## E2E Tests

| # | ID | Scenario | Expected |
|---|----|----------|---------|
| 1 | TC-17 | Cancel all during active upload | Panel closes, no further API calls |
| 2 | TC-17b | Keep uploading dismisses dialog | Panel stays open, upload continues |

## Manual Smoke Test Checklist
- [ ] Upload 5 files, click ×, confirm cancel dialog appears
- [ ] Upload 5 files, wait until complete, click × — panel closes immediately
```

### After tests are generated

```bash
pnpm test                          # run unit tests
pnpm test:e2e --project=chromium   # run E2E tests
```

Then mark Phase 4 tasks `[x]` in your `PLAN.md`.

---

## 5. `/dev-review`

**Purpose:** Review code changes across 5 quality dimensions before committing or opening a PR. Produces a structured report with PASS / WARN / FAIL ratings and a clear verdict.

### Usage

```
/dev-review                          ← review all staged changes
/dev-review --staged                 ← same as above
/dev-review --branch feat/my-feature ← review entire branch vs develop
/dev-review apps/web/src/hooks/      ← review a specific folder
/dev-review path/to/file.tsx         ← review a specific file
```

### What it checks

| Dimension | Examples of what is flagged |
|-----------|----------------------------|
| **1. Coding Convention** | Missing `cn()`, `useCallback`, `useMemo`, `cursor-pointer`, wrong import paths |
| **2. Security** | Unvalidated server action inputs, exposed secrets, open redirects, XSS via `href` |
| **3. Performance** | N+1 fetches, sequential awaits that could be `Promise.all`, missing `React.memo` |
| **4. Clean Code** | Components > 150 lines, prop drilling 3+ levels, magic values, dead code |
| **5. Maintainability** | Missing WHY comments, bare TODOs without ticket, untested non-trivial functions |

### Output example

```
## Code Review: feat/fix-upload-panel

### Summary
Two FAIL items in Security and Coding Convention. Logic is sound
but server action input is not validated and one className uses
raw template literals instead of cn().

### Dimension 1: Coding Convention  [FAIL]
upload-status-panel.tsx:42 — className uses template literal without cn()

### Dimension 2: Security  [FAIL]
upload.action.ts:18 — server action accepts folderId with no validation

### Dimension 3: Performance  [PASS]
No issues found.

### Dimension 4: Clean Code & Reusability  [WARN]
useFolderUpload.ts:310 — function exceeds 150 lines, consider splitting

### Dimension 5: Comments & Maintainability  [PASS]
No issues found.

### Verdict
CHANGES REQUIRED
```

### Rating rules

| Rating | Meaning |
|--------|---------|
| `PASS` | No issues in this dimension |
| `WARN` | Minor issue — should fix, not blocking |
| `FAIL` | Must fix before merge |

- `CHANGES REQUIRED` — any dimension is `FAIL`
- `APPROVED WITH COMMENTS` — any `WARN`, no `FAIL`
- `APPROVED` — all five dimensions are `PASS`

> A single FAIL in Security always results in `CHANGES REQUIRED` regardless of other dimensions.

---

## Artifacts reference

Every task produces files in a consistent location. This makes it easy to find context for any piece of work.

```
docs/
├── api_docs/
│   └── {name}-proposal.md        ← /dev-backend-request output
│                                    Share this with the backend team
└── tasks/{name}/
    ├── RCA.md                     ← /dev-rca output
    │                                Read before reviewing a bugfix PR
    ├── PLAN.md                    ← /dev-plan output
    │                                Live task tracker — update as you work
    └── TEST-PLAN.md               ← /dev-test output
                                     Include link in PR description

apps/web/
├── src/**/*.test.ts               ← unit tests (next to source files)
└── e2e/tests/drive/*.spec.ts      ← E2E specs
```

---

## PR checklist

Before opening a pull request, verify:

- [ ] `PLAN.md` — all tasks are `[x]`, status is `✅ Done`
- [ ] `RCA.md` exists (bugfixes only) and root cause matches the fix
- [ ] `TEST-PLAN.md` exists and all scenarios are covered
- [ ] `pnpm type-check` — zero new TypeScript errors
- [ ] `pnpm lint` — zero new warnings
- [ ] `pnpm test` — all unit tests pass
- [ ] `pnpm test:e2e --project=chromium` — all E2E tests pass
- [ ] `/dev-review` — no FAIL-level findings
- [ ] PR description links to `PLAN.md` and `TEST-PLAN.md`
- [ ] If backend API was needed — link to `docs/api_docs/{name}-proposal.md` in PR

---

## Quick reference

```bash
# Start a new feature
/dev-plan "Add dark mode to settings"

# Start a new bugfix
/dev-rca "Describe the broken behaviour"
/dev-plan "Describe the fix"

# Need backend API support
/dev-backend-request "Describe what API you need"

# After implementation is done
/dev-test

# Before merging
/dev-review
```
