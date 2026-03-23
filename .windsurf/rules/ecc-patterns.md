---
trigger: always_on
---

# Common Patterns (ECC)

## Skeleton Projects

When implementing new functionality:
1. Search for battle-tested skeleton projects
2. Evaluate options: security, extensibility, relevance, implementation plan
3. Clone best match as foundation
4. Iterate within proven structure

## Design Patterns

### Repository Pattern

Encapsulate data access behind a consistent interface:
- Define standard operations: findAll, findById, create, update, delete
- Concrete implementations handle storage details (database, API, file, etc.)
- Business logic depends on the abstract interface, not the storage mechanism
- Enables easy swapping of data sources and simplifies testing with mocks

### API Response Format

Use a consistent envelope for all API responses:
- Include a success/status indicator
- Include the data payload (nullable on error)
- Include an error message field (nullable on success)
- Include metadata for paginated responses (total, page, limit)

### Error Boundaries

- Catch errors at the boundary closest to where they originate
- Transform low-level errors into domain errors before surfacing
- Never expose internal stack traces to end users
- Log with enough context to reproduce the issue

### Configuration Pattern

- Centralize all config in a single module
- Validate required env vars at startup with clear error messages
- Use typed config objects, not raw `process.env` access throughout the codebase
- Provide `.env.example` with all keys documented (no real values)
