# Cooktale - Agent Instructions

## Project Structure
- `frontend/` contains the Next.js application.
- `backend/` contains the NestJS API.
- Prisma is used in the project.
- `COOKTALE_SYSTEM_DESIGN.md` contains architecture
  information. Read relevant sections when needed,
  not the entire document by default.

## Token Efficiency
- Minimize unnecessary context and tool calls.
- Inspect only files relevant to the current task.
- Search for existing implementations before
  creating new ones.
- Prefer small, focused changes.
- Keep explanations concise.
- Do not repeatedly read files unless necessary.

## Skills
- Use skills in `.agents/skills/` when relevant.
- Select only the skills necessary for the task.
- Avoid overlapping skills and unnecessary audits.
- Avoid extensive planning for trivial changes.
- Prefer Ponytail's simplicity principles.

## Engineering Standards
- Preserve existing architecture and conventions.
- Keep TypeScript types accurate.
- Do not weaken security, tests, or validation
  to save tokens.
- Reuse existing libraries.
- Run focused checks after changes.
- Ask before major architecture or database changes.

## Safety
- Never expose secrets from `.env` files.
- Do not modify production configuration or run
  destructive database operations without approval.

## Conversation Handoffs

- Use one conversation per feature, bug, or task.
- Store cross-session context in `docs/handoffs/`.
- Do not create handoffs for trivial or completed tasks.
- When preparing a handoff, include:
  - Goals and important decisions.
  - Modified files and current status.
  - Tests and unresolved issues.
  - Next actions.
- Keep handoffs concise and free of secrets.
- Read only the relevant handoff when resuming.
- Verify handoff information against actual code.
