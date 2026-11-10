# Agent notes

- Time is limited. Build the fastest working MVP. When choosing between approaches, pick the one that gets the core working end to end soonest.
- Scope: README.md "Core" is in scope, and "Deferred" is out. Don't build deferred items or prepare hooks for them.
- The UI is in Polish. Code, specs and docs are in English.
- Read `docs/CONTEXT.md` first: decisions, open questions and handover.
- Legal and domain facts about the referral form are in `docs/research/`. Rely on them, not on memory.
- Use OpenSpec (`openspec/`) for changes.
- Tests:
  - Mostly unit tests, each checking real logic. Don't write tests that only exercise mocks or trivial code.
  - A few integration tests, each covering a lot.
  - At most 5 end-to-end Playwright tests, for the main flows.
