---
description: Extract reusable patterns from the current session and save them as skills. Run after solving a non-trivial problem.
---

# /learn — Extract Reusable Patterns Workflow

## When to Run

Run `/learn` after solving a non-trivial problem in the current session.

## Steps

1. **Review Session for Extractable Patterns**
   Look for:
   - Error resolution patterns (what error, root cause, what fixed it)
   - Non-obvious debugging techniques
   - Library quirks or workarounds
   - API limitations or version-specific fixes
   - Project-specific patterns (conventions discovered, architecture decisions)

2. **Evaluate Extraction Value**
   - Is this pattern reusable in future sessions?
   - Is it non-trivial? (don't extract typos or obvious syntax errors)
   - Is it project-specific or general?

3. **Draft the Skill**
   Create skill content using this format:
   ```markdown
   # [Descriptive Pattern Name]

   **Extracted:** [Date]
   **Context:** [Brief description of when this applies]

   ## Problem
   [What problem this solves — be specific]

   ## Solution
   [The pattern/technique/workaround]

   ## Example
   [Code example if applicable]

   ## When to Use
   [Trigger conditions — what should activate this skill]
   ```

4. **Confirm With User**
   Present the draft skill and ask: "Save this pattern as a skill? (yes/no/modify)"

5. **Save the Skill**
   If confirmed, save to:
   - Local: `d:\appledream_display\.windsurf\skills\learned\[pattern-name].md`
   - Global: `C:\Users\apple\.windsurf\skills\learned\[pattern-name].md`

## Rules

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Focus on patterns that save time in future sessions
- Keep skills focused — one pattern per skill
- Always confirm with user before saving
