---
description: Core coding behavior principles — think first, keep it simple, change surgically, verify goals
---

# Coding Principles

Behavioral guidelines to reduce common LLM coding mistakes. Derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

**Tradeoff:** These principles bias toward caution over speed. For trivial tasks (typo fixes, obvious one-liners), use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

For this project specifically:
- Before touching data pipelines or model code, confirm which dataset/split is involved.
- Before adding dependencies, check if they work across CPU and GPU (hardware-agnostic rule).
- When the user describes a problem, clarify whether it's a learning exercise or a production fix — the approach differs.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior ML engineer say this is overcomplicated?" If yes, simplify.

For this project specifically:
- Prefer simple baselines before complex architectures.
- A plain function beats a class hierarchy for one-off data processing.
- Don't wrap PyTorch/sklearn calls in unnecessary abstraction layers.
- Notebook cells should do one thing clearly, not five things cleverly.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

For this project specifically:
- Before any change, ask: "Will this break hardware agnosticism?" If yes, stop and discuss.
- Don't reorganize notebook cell order unless asked.
- Don't change existing model hyperparameters as a side effect of another fix.
- If experiment code didn't work, revert it — don't leave dead experiments in the codebase.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

| Instead of... | Transform to... |
|---|---|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |
| "Improve accuracy" | "Define target metric, measure baseline, iterate until met" |

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

For this project specifically:
- ML experiments need measurable success criteria (accuracy, F1, loss threshold).
- "It works" is not a success criterion. "Validation accuracy > X% on Y split" is.
- Use the existing `verification-before-completion` and `test-driven-development` skills for the verification loop.

---

**These principles are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, clarifying questions come before implementation, and experiments have clear success/failure criteria.

See `coding-principles-examples.md` for concrete before/after examples.
