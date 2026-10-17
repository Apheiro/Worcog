This file defines how coding agents must work in this repository. It
does not replace the product requirements or the initial implementation
prompt. These rules apply to all work unless the user explicitly
instructs otherwise.
1. Working principles
1. Prioritize correctness, maintainability, accessibility, data safety,
   and simplicity.
2. Before changing code, inspect the existing repository structure,
   package.json, pnpm-lock.yaml, Tauri/Next.js configuration,
   workflows, tests, and relevant documentation.
3. Reuse existing architecture and patterns when they are sound. Do not
   rewrite working modules without a concrete reason.
4. Fix the underlying problem rather than masking symptoms with local
   patches.
5. Keep changes focused. Do not introduce unrelated refactors.
6. Never claim a task is complete if relevant checks were not run or
   known failures remain undisclosed.
7. When information is missing, inspect the repository and available
   documentation before asking. Make reasonable, reversible decisions
   and document significant choices.
8. Do not add features, abstractions, or dependencies "just in case."
9. Do not leave pseudocode, stubs, inert buttons, fake data, or TODO
   placeholders for functionality presented as implemented. If
   something must be deferred, mark it explicitly and do not pretend it
   works.
10. Use clear names, explicit types where useful, and small functions
    with well-defined responsibilities.
2. Git and change management
2.1 Inspection and safety
- Before starting, run git status --short --branch and inspect the
  current state.
- Never overwrite, delete, discard, or reformat pre-existing user
  changes.
- Never use git reset --hard, git clean -fd, git checkout -- .,
  git push --force, or equivalent destructive commands.
- Do not rewrite published history or modify protected branches.
- Never commit secrets, tokens, keys, environment files, real
  databases, private data, or local build artifacts.
- Do not push, create published tags, open pull requests, or publish
  releases unless the user has authorized it and the environment has
  the required permissions.
- If the repository contains pre-existing changes, keep them separate
  from agent changes. Do not assume they were made by the agent.
2.2 Commits
- Use Conventional Commits compatible with Release Please.
- Format: type(scope): short imperative description.
- Common types: feat, fix, perf, refactor, test, docs,
  build, ci, chore, style.
- Use ! or a BREAKING CHANGE: footer only for actual incompatible
  changes.
- Write concise commit subjects in English, naturally lowercase where
  appropriate, without a trailing period, preferably under 72
  characters.
- Examples:
  - feat(activity): add source-linked timeline
  - fix(storage): preserve attachments during migration
  - refactor(ui): reuse task status badge
  - test(database): cover backup restoration
  - ci(release): configure release-please workflow
- Commit when a coherent, reviewable, validated unit of work is ready.
  Do not commit every file separately or wait until the changes become
  excessively large.
- Before each commit, review git diff --check, git diff, and
  git status, and run relevant tests.
- Do not combine unrelated changes in one commit.
- Do not create empty commits.
- Never misrepresent test results or claim a build passed if it was
  not run.
- If the current environment does not permit commits, leave the
  changes ready and explain what is missing. Do not claim that a
  commit was created.
2.3 Branches and publishing
- Follow the repository's existing branch workflow.
- If no workflow is defined, work on the current branch rather than
  introducing unnecessary complexity.
- Do not publish releases manually when Release Please is intended to
  manage the release process.
- Do not move or delete existing tags.
- Never store GitHub credentials in the repository. Use secrets and
  least-privilege GitHub Actions permissions.
3. Dependencies and package management
- Use pnpm exclusively to install, add, update, and run
  JavaScript/TypeScript package scripts.
- Keep pnpm-lock.yaml synchronized with package.json; include it
  in commits when dependency resolution changes.
- Do not create or keep package-lock.json, yarn.lock, or
  alternative lockfiles unless the existing project has a specifically
  justified requirement.
- Do not use npm install, yarn install, or npx as substitutes
  for pnpm. Use pnpm dlx to run a temporary tool when appropriate.
- Before adding a dependency, check whether the stack or an existing
  utility already covers the need.
- Do not add multiple libraries for the same purpose.
- Avoid abandoned, poorly maintained, or incompatible packages.
- For beta, prerelease, or lesser-known packages, verify the exact
  version, documentation, license, compatibility, and maintenance
  status before adopting them.
- For the requested beta version of class-variance-authority and for
  kalyx/react, verify the exact version and compatibility. Do not
  invent APIs or assume examples from another version apply.
- Keep dependencies in the correct dependencies, devDependencies,
  or other sections.
- Do not perform broad dependency upgrades as part of a feature task
  unless required. Explain the reason and risk.
- Avoid editing pnpm-lock.yaml manually; let pnpm update it.
4. Code reuse and implementation quality
- Search for an existing component, hook, utility, type, schema,
  service, or pattern before implementing a new one.
- Reuse shared components and extract them when there is a real use
  across multiple places or a clear shared responsibility.
- Do not prematurely generalize a simple component used in only one
  place.
- Avoid duplicating validation, business rules, formatters, SQL
  queries, styles, and permission logic.
- Keep business logic out of presentation components.
- Put data access behind a typed repository/persistence layer; UI
  components must not execute SQL directly.
- Separate presentation, UI state, application logic, and persistence.
- Avoid oversized files. Split modules by responsibility, not
  arbitrary line-count rules.
- Do not use utils or helpers as catch-all modules; place each
  function where its responsibility belongs.
- Avoid abstractions that obscure control flow or make debugging
  harder.
- Prefer pure functions where practical and avoid implicit side
  effects.
- Do not use any as a routine escape hatch. Prefer concrete types or
  unknown with narrowing.
- Do not silence errors with as any, @ts-ignore, @ts-nocheck, or
  eslint-disable without a narrow, documented justification.
- Do not redundantly store derived information in multiple tables or
  UI states when it can be safely computed.
- Do not use useEffect to calculate values that can be derived
  directly; follow current React guidance.
- Do not introduce global state for data needed by only one component.
- Avoid circular module dependencies.
5. TypeScript and implementation standards
- TypeScript is mandatory and a high priority.
- Keep strict: true and fix type errors; do not weaken compiler
  settings to make the project compile.
- Define types for domain entities, layer boundaries, command
  parameters, and operation results.
- Validate external, imported, or persisted data at runtime when it
  may be invalid; static types do not validate runtime data.
- Avoid duplicate type definitions for the same entity. Maintain a
  canonical source of types or schemas.
- Use import type where appropriate and follow the project's import
  configuration.
- Keep naming, exports, and project structure consistent.
- Do not use browser-only APIs in code that runs outside the browser
  context.
- Never include secrets or sensitive data in logs.
- Handle errors with useful context without exposing internal stack
  traces to end users.
6. UI stack and visual conventions
- Use UnoCSS as the primary utility styling system.
- Use Radix UI as the foundation for accessible primitives when an
  appropriate component exists.
- Use CVA for shared component variants. Keep variants with their
  components instead of scattering repeated class conditionals
  throughout the application.
- Use Tabler Icons as the default icon family.
- Use Mantine Hooks when a hook clearly solves the problem; do not
  install the full Mantine UI library solely to use hooks.
- Use lodash-es for collection processing when it improves clarity;
  do not replace simple native operations with unnecessary library
  calls.
- Use Day.js for date/time parsing, comparisons, calculations, and
  formatting when needed; define a consistent storage, time-zone, and
  display convention.
- Use kalyx/react for complex controls such as date pickers only
  after verifying its actual API and compatibility. If it is
  incompatible or cannot be verified, report the issue and choose a
  reasonable accessible alternative rather than pretending it is
  available.
- Keep the design minimal, monochromatic, and consistent. Reserve
  color for meaningful semantic information.
- Avoid repeated inline styles, duplicated CSS, and excessive global
  selectors.
- Meet accessibility requirements: keyboard navigation, visible focus,
  labels, announced states, and adequate contrast.
- Do not use emoji as a substitute for UI icons.
- Respect prefers-reduced-motion and never rely on color alone to
  communicate a state.
7. Tauri, Next.js, and frontend/backend boundaries
- Respect the actual Tauri 2 architecture and runtime.
- Do not assume Next.js server functions, Server Actions, middleware,
  or dynamic routes are available in a statically exported desktop
  bundle.
- Inspect and preserve the existing official setup when valid. Do not
  rebuild it without a reason.
- Keep filesystem, database, and native capabilities behind defined
  layers with minimum necessary permissions.
- Apply least privilege in tauri.conf.json, capabilities, and plugin
  permissions.
- Do not enable broad filesystem, shell, HTTP, or command-execution
  permissions without a specific justification.
- Avoid using shell commands for operations that can be safely handled
  through Tauri APIs or plugins.
- Do not expose secrets or privileged APIs to the frontend.
- Do not assume the cache directory is persistent storage. Important
  data should live in a persistent application-data location; reserve
  cache for regenerable content unless the user explicitly accepts the
  risk.
- If primary data is stored in cache by explicit requirement, document
  the risk, implement export/backups, and show appropriate warnings.
- Do not hard-code machine-specific absolute paths. Resolve locations
  through Tauri APIs.
- Test Windows paths and packaging, not just development on another
  platform.
8. Persistence, SQLite, and files
- Use versioned, incremental, safely repeatable database migrations.
- Never edit a migration that has already been applied; add a new
  migration.
- Enforce referential integrity and database constraints where
  appropriate.
- Use parameterized queries. Never interpolate user input directly
  into SQL.
- Use transactions for operations that modify related entities.
- Define primary keys, indexes, unique constraints, and deletion
  policies explicitly.
- Do not lose annotations, relationships, or files during migrations.
- Do not store large binary files inside SQLite by default; store
  metadata and use the filesystem when appropriate, documenting the
  strategy.
- Do not physically delete files when removing a reference unless an
  explicit policy permits it and the user has confirmed when data loss
  is possible.
- Store dates in a consistent, unambiguous format; define how time
  zones and date-only values are handled.
- Test backup and restore instead of merely exporting a live database
  file without considering consistency.
- Never include real user data in fixtures, logs, repositories, or
  tests.
9. Security and privacy
- Treat emails, chats, tickets, notes, and files as potentially
  confidential.
- Keep the app local-first. Do not transmit information to external
  services without an explicitly authorized feature.
- Do not add telemetry, analytics, trackers, or remote calls by
  default.
- Validate imported file paths and prevent path traversal.
- Do not trust file extensions as the sole indicator of file safety.
- Do not log full note or document contents.
- Use least-privilege GitHub Actions permissions and stable versions
  of third-party actions; where practical and consistent with
  repository policy, pin actions to full commit SHAs.
- Never execute imported content as code.
- Maintain a .gitignore suitable for local databases, user data,
  builds, caches, secrets, and generated artifacts.
- Do not use actual user information in automated tests.
10. Tests and validation
- Add or update tests for behavior changes.
- Pay special attention to business rules, relationships, chronology,
  recurrence, import/export, migrations, and restore.
- Avoid fragile tests depending on the actual current time, accidental
  ordering, or external state; use fixed clocks or fixtures where
  appropriate.
- Run, as configured:
  1. formatting/lint;
  2. TypeScript checks;
  3. unit tests;
  4. Next.js build;
  5. tauri build or available packaging validation.
- Run pnpm install --frozen-lockfile in CI.
- Do not skip tests to speed up work without reporting it.
- If a validation cannot run due to platform, tooling, or credentials,
  state exactly what could not be checked and why.
- Never mark an omitted test as passed.
11. Release Please and GitHub Actions
- Use Conventional Commits so Release Please can calculate versions
  and changelogs.
- Keep Release Please configuration and workflows version-controlled.
- The Release Please workflow manages release PR/versioning according
  to its configuration; do not assume it builds Windows installers.
- Maintain a separate Windows build workflow using
  runs-on: windows-latest (or a compatible pinned runner), pnpm, and
  Tauri packaging.
- The Windows build workflow should support workflow_dispatch and
  the release/tag events defined by the repository's release strategy.
- Do not automatically publish installers to a release unless the flow
  explicitly requires it and any signing secrets are configured.
- Configure minimal GITHUB_TOKEN permissions.
- Avoid workflow loops and automated commits that bypass the intended
  release process.
- Document what triggers each workflow and what artifacts it produces.
- Validate YAML, action versions, and tag naming.
- Never store signing certificates or credentials in plain text.
12. Documentation and task handoff
- Keep README, development instructions, and technical documentation
  aligned with actual behavior.
- Document non-obvious architectural decisions and trade-offs,
  especially storage, backups, migrations, permissions, and workflows.
- Avoid duplicating documentation when one canonical source can be
  linked.
- At the end of a task, report:
  - what was implemented;
  - important decisions;
  - files or areas changed;
  - validation commands and results;
  - remaining limitations;
  - commit hashes and messages, if commits were actually created.
- Never claim a commit, release, installer, or publication exists
  unless it was actually created.
13. Definition of done
A task is complete when: - the implementation meets the agreed scope; -
no known TypeScript errors remain; - relevant tests pass, or unverified
checks are reported precisely; - avoidable duplication and unnecessary
dependencies are absent; - loading, error, empty, and success states are
handled in the UI where relevant; - existing data is preserved and
migrations are included; - relevant documentation is updated; - Git
changes are reviewed and contain no sensitive information; - the final
report is accurate and verifiable.