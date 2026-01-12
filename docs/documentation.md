# Project Documentation (JSDoc)

This project is documented using **JSDoc** comments directly in the source code.
The goal is to generate a browsable HTML website from the codebase.

## How to generate HTML docs

From the repository root:

- Install dependencies:
  - `npm install`
- Generate docs:
  - `npm run docs:generate`

The output will be written to `docs/generated/`.

## Scope

The JSDoc build includes:
- `backend/**`
- `frontend/src/**`

The build excludes:
- `node_modules/`
- test folders (`__tests__/`)
- build outputs (`frontend/dist/`)
- uploaded/runtime data (`backend/uploads/`, `backend/logs/`)

## Style guide

- All documentation must be in **English**.
- Prefer `@typedef` for shared shapes (DTOs, payloads).
- Document exported functions/components first.
- Keep runtime behavior and error cases explicit.
