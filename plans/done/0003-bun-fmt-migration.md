# Bun formatter migration

Requested scope: Zaimu, `npm-packages/packages/configs`, and this template.
Bun version: 1.4.4 (first release with `bun fmt`). Work stays local.

## Execution

- [x] Inspect shared presets, installed presets, scripts, Git hooks, ignores and workspace overrides.
- [x] Translate supported formatting options into root `bunfig.toml` files and shared TOML preset/example.
- [x] Disable Biome formatting, import organization and Tailwind sorting in shared and consumer presets.
- [x] Preserve ESLint rules, remaining Biome rules/assists, and framework-specific overrides.
- [x] Separate `format` / `format:check` from `lint` / `lint:fix`; run Bun last after hook lint fixes.
- [x] Verify configuration loading, sorting, exclusions, nested working directories and repeat-run stability.
- [x] Run normal commit hooks and affected local builds; record actual results below.
- [x] Integrate local commits into original branches; remove only task worktrees.

## Migrated to Bun fmt

| Previous setting or behavior            | Bun configuration                                       | Notes                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `formatter.lineWidth: 110`              | `fmt.printWidth = 110`                                  | Width is a printer target, not byte-identical output.                                                                        |
| `formatter.useEditorconfig: true`       | `fmt.editorconfig = true`                               | Existing `.editorconfig` retained.                                                                                           |
| Tab indentation, width 4                | `fmt.useTabs = true`, `fmt.tabWidth = 4`                | Explicit defaults also work without `.editorconfig`.                                                                         |
| YAML spaces, width 2                    | `fmt.overrides`                                         | Preserves existing editor settings.                                                                                          |
| `arrowParentheses: asNeeded`            | `fmt.arrowParens = "avoid"`                             |                                                                                                                              |
| `lineEnding: lf`                        | `fmt.endOfLine = "lf"`                                  |                                                                                                                              |
| Double JS/JSX quotes                    | `fmt.singleQuote = false`, `fmt.jsxSingleQuote = false` |                                                                                                                              |
| `semicolons: always`                    | `fmt.semi = true`                                       |                                                                                                                              |
| `trailingCommas: all`                   | `fmt.trailingComma = "all"`                             |                                                                                                                              |
| `assist/source/organizeImports`         | `fmt.sortImports` table                                 | Sorting and merging migrate; unused import removal stays in Biome. No blank lines between groups.                            |
| `nursery/useSortedClasses`              | `fmt.sortTailwindcss` table                             | Preserve `classList` and functions `cn`, `clsx`, `cva`, `tw`; `class`/`className` built in. Requires installed Tailwind 3/4. |
| Git ignores                             | Built-in Git-ignore traversal                           | Root and nested ignores still count.                                                                                         |
| Shared exclusions                       | `fmt.ignorePatterns`                                    | `.agents`, `.claude`, public assets, generated/minified files, skills and package-manager lock files.                        |
| Consumer generated exclusions           | Per-repo `fmt.ignorePatterns`                           | Generated SDK/native files and Zaimu backend generated/database types remain excluded.                                       |
| Formatter scripts and staged formatting | `bun fmt`, `bun fmt --check`                            | Hook formatter runs after code-changing lint fixes. Type/build gates retained.                                               |
| Package-manifest sorting exemption      | `fmt.sortPackageJson = false`                           | Existing shared assist excludes `package.json`; no new package sorting policy.                                               |

## Not migrated: retained behavior

`bun fmt` is not a linter. All existing non-formatting rules, levels, fix safety
settings and recommended defaults remain in Biome/ESLint. Some are named style
rules but change code or enforce conventions beyond whitespace.

| Owner               | Retained settings/rules                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Reason                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Biome assists       | `useSortedAttributes`, `useSortedKeys`, `useSortedProperties`; package.json exemption                                                                                                                                                                                                                                                                                                                                                                                   | Bun has no equivalent general JSX attribute, JSON key or object property sorter. |
| Biome correctness   | `noUnusedFunctionParameters`, `noUnusedImports`, `noUnusedPrivateClassMembers`, `noUnusedVariables`, `useHookAtTopLevel`, `useUniqueElementIds`                                                                                                                                                                                                                                                                                                                         | Semantic checks and unused import removal.                                       |
| Biome accessibility | `noStaticElementInteractions`, `noSvgWithoutTitle`, `useAltText`, `useButtonType`, `useHtmlLang`, `useKeyWithClickEvents`                                                                                                                                                                                                                                                                                                                                               | Accessibility checks; explicit disabled rules preserved.                         |
| Biome complexity    | `noBannedTypes`, `noForEach`, `noImportantStyles`                                                                                                                                                                                                                                                                                                                                                                                                                       | Existing severities and disabled rules preserved.                                |
| Biome security      | `noDangerouslySetInnerHtml`                                                                                                                                                                                                                                                                                                                                                                                                                                             | Security diagnostic.                                                             |
| Biome style         | `noDoneCallback`, `noInferrableTypes`, `noNonNullAssertion`, `noParameterAssign`, `noUnusedTemplateLiteral`, `noUselessElse`, `useAsConstAssertion`, `useConsistentArrayType`, `useConsistentMemberAccessibility`, `useConsistentObjectDefinitions`, `useConsistentTypeDefinitions`, `useConst`, `useEnumInitializers`, `useForOf`, `useImportType`, `useNodejsImportProtocol`, `useNumberNamespace`, `useSelfClosingElements`, `useSingleVarDeclarator`, `useTemplate` | Code conventions and transformations; Bun fmt cannot replace these.              |
| Biome suspicious    | `noArrayIndexKey`, `noEmptyInterface`, `noExplicitAny`, `noMisplacedAssertion`, `noShadowRestrictedNames`, `noSkippedTests`, `noThenProperty`, `noTsIgnore`, `noUnknownAtRules`, `useIterableCallbackReturn`                                                                                                                                                                                                                                                            | Existing levels, options and recommended rules remain.                           |
| Framework presets   | Elysia static-class exemption; Nest parameter-decorator parser and import-type exemption; React hook/element-ID rules and existing consumer accessibility customization                                                                                                                                                                                                                                                                                                 | Framework parsing and lint behavior.                                             |
| ESLint              | JS recommended; TypeScript strict/stylistic; JS disableTypeChecked; explicit overrides and eslint-config-biome                                                                                                                                                                                                                                                                                                                                                          | No formatter replacements. `sort-imports` remains off.                           |
| Biome parsing       | CSS modules/Tailwind directives, unknown-file tolerance, syntax-error refusal                                                                                                                                                                                                                                                                                                                                                                                           | Keep parser support for remaining lint/assist work; Bun handles its own parsing. |
| Validation          | Existing type checks, builds and repository-specific test/coverage gates                                                                                                                                                                                                                                                                                                                                                                                                | Independent of formatting; template adds no unit/coverage gates.                 |

## Editor formatting

- Removed the template's Biome formatter/organize-imports-on-save selection and TOML
  formatter override. Kept Biome/ESLint save-time fixes for remaining lint rules.
- Added VS Code process tasks for formatting the saved current file or the workspace
  through Bun, without another formatter package or extension.
- Automatic format-on-save is not migrated: Bun 1.4.4 CLI reports `--lsp` unsupported.
  Disable competing save-time formatters for Bun-owned languages; Prisma formatting
  remains owned by its language extension because Bun does not format Prisma schemas.

## Limits and compatibility

- Bun uses a Prettier-compatible printer. Option mapping does not guarantee identical
  Biome line wrapping, import ordering, JSON layout or Tailwind order. Formatting
  ownership moves; existing application files are not mass-reformatted.
- Bun preserves side-effect import barriers. Biome retains `noUnusedImports` and
  `useImportType`, so import sorting alone does not silently remove those checks.
- `formatWithErrors: false` has no one-to-one Bun flag. Bun rejects malformed source;
  its documented Svelte embedded-block behavior can warn and preserve an invalid block.
- Biome suppression comments continue to govern retained rules. Future formatter
  suppressions use `prettier-ignore`, not `biome-ignore format`.
- Bun does not offer npm/TOML `extends` for `[fmt]`. The shared package exports
  `@hyoretsu/configs/bunfig` as a TOML artifact; copy its `[fmt]` section into each
  consumer and keep repo-specific exclusions. No Prettier config is introduced.
- Consumer Biome overrides disable migrated behavior even with currently installed
  shared-package versions. Consumers need no unpublished package release.
- Shared helper returns sequential Biome -> ESLint -> Bun tasks. Root consumer hook
  configs carry the equivalent tasks until a shared release is explicitly published.
  Lefthook pipelines also run Bun last. No publish/push/deploy is part of this task.

## Validation results

- Passed stdin smoke checks in all three repos: style options, import sorting and merging,
  YAML indentation, malformed-source refusal, repeated-format stability and nested working directories.
- Confirmed generated SDK/native files stay absent from formatter file discovery.
- Passed Tailwind `classList` and `cn` sorting checks in Zaimu and template.
- Confirmed Biome no longer formats at root/backend/frontend depths in both consumers.
- Shared config package build passed, including declarations and distributed TOML.
- npm-packages hooks passed Biome, ESLint, Bun formatting and commit-message validation.
  Corrected existing Lefthook globs that previously skipped lint tasks.
- Template first type-check attempt exposed missing generated SQL artifacts in the fresh
  worktree. Reused existing local artifacts and retried without weakening validation.
- Zaimu and template normal commit hooks passed, including affected workspace type checks.
- Template backend/frontend builds passed through the affected Turbo graph.
- Zaimu backend build passed (Turbo cache hit). Frontend type check and Vite build passed.
  The first frontend build hit a pre-existing permission error in the original dependency
  directory's `.vite-temp`; an isolated local dependency-link directory resolved it.
- Shared package dry-run packing includes `dist/bunfig.toml`; built helper argument
  parsing and TOML preset/example parity checks passed.
- No mass formatting or generated branding/native changes are included.
- Shared config commit integrated locally in npm-packages; unrelated edits preserved.
  Zaimu commit integrated locally and its task worktree removed. Template commit
  is finalized for local integration and task-worktree cleanup in the same execution.

## Sources

- https://bun.com/blog/bun-v1.4.4#bun-fmt-a-formatter-built-into-bun
- https://bun.com/docs/format
- https://bun.com/docs/runtime/bunfig
