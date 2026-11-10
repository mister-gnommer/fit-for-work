# Agent notes

- Time is limited. Build the fastest working MVP. When choosing between approaches, pick the one that gets the core working end to end soonest.
- Scope: README.md "Core" is in scope, and "Deferred" is out. Don't build deferred items or prepare hooks for them.
- The UI is in Polish. Code, specs and docs are in English.
- Read `docs/CONTEXT.md` first: decisions, open questions and handover.
- Legal and domain facts about the referral form are in `docs/research/`. Rely on them, not on memory.
- Use OpenSpec (`openspec/`) for changes.
- Before changing Next.js code, read the relevant installed-version guide in `node_modules/next/dist/docs/`. Keep `agentRules: false`; maintain useful framework guidance here manually.
- Several agents may be working at once:
  - Each OpenSpec change has one owner. Proposing one is safe in the main checkout, since it only writes to `openspec/changes/<name>/`.
  - Implement code (`/opsx:apply`) in your own git worktree, on a branch named after the change.
  - Shared docs (`README.md`, `AGENTS.md`, `docs/*.md`): re-read right before editing, make small edits, and never undo changes you didn't make.
  - Never run git commands that touch other agents' files, such as `stash`, `reset`, `checkout .` or `clean`.
  - Before you start, check `openspec list` and `git worktree list` so you don't redo something in progress.
- Tests:
  - Mostly unit tests, each checking real logic. Don't write tests that only exercise mocks or trivial code.
  - A few integration tests, each covering a lot.
  - At most 5 end-to-end Playwright tests, for the main flows.
