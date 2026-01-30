- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements

- [x] Scaffold the Project

- [x] Customize the Project

- [x] Install Required Extensions

- [x] Compile the Project

- [x] Create and Run Task

- [ ] Launch the Project

- [x] Ensure Documentation is Complete

- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.

---

You are working on Tibyan (TBY), a Next.js App Router + Node.js + TypeScript LMS.
Rules:
- Use TypeScript strict, never use any.
- UI must use Chakra UI components and theming only.
- All API routes must validate input with Zod and return { ok: boolean, data?, error? }.
- Use Prisma for DB access; no raw SQL.
- Respect RTL layouts (dir="rtl") and Arabic-first UX.
- Keep server on port 3000.
- Do not create unrelated files; modify only relevant files.
- Prefer reusable components under src/components and pure functions under src/lib.
