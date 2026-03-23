---
description: Restate requirements, assess risks, and create a step-by-step implementation plan. WAIT for user confirmation before touching any code.
---

# /plan — Implementation Planning Workflow

Apply the **ecc-agent-planner** persona for this workflow.

## Steps

1. **Restate Requirements**
   - Clarify what needs to be built in unambiguous terms
   - Flag any ambiguities and resolve before proceeding

2. **Analyze Codebase**
   - Identify affected files/modules
   - Map integration points and dependencies

3. **Identify Risks**
   - HIGH: risks that could block delivery
   - MEDIUM: risks that require extra attention
   - LOW: minor concerns

4. **Create Step Plan**
   - Break implementation into ordered phases
   - Each phase has a clear, verifiable deliverable
   - Database/schema changes first → backend logic → frontend → tests

5. **Estimate Complexity**
   - HIGH / MEDIUM / LOW

6. **Present Plan and WAIT**
   - Output the full plan in the format below
   - **DO NOT write any code until the user confirms**

## Output Format

```
# Implementation Plan: [Feature Name]

## Requirements Restatement
[Clear restatement]

## Affected Files/Modules
[List]

## Implementation Phases

### Phase 1: [Name]
- Step 1:
- Step 2:

### Phase 2: [Name]
- ...

## Dependencies
[External services, packages, or other features needed]

## Risks
- HIGH: ...
- MEDIUM: ...
- LOW: ...

## Estimated Complexity: HIGH / MEDIUM / LOW

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)
```

## After Confirmation

Once user confirms, proceed phase by phase.
After each phase, verify with `/verify quick` before moving to the next.
