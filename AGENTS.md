# Repository Guidelines

## Project Structure & Modules
- Source code lives in `src/` (TypeScript + React 18). Example: `src/LiteFlowEditor/...` for components, hooks, panels, and utils.
- Built artifacts output to `dist/` (`module` and `types` from `package.json`).
- Documentation uses Dumi; authoring in `docs/` and runtime temp in `.dumi/`.
- Key configs: `.dumirc.ts`, `.fatherrc.ts`, `.editorconfig`, `.eslintrc.js`, `.stylelintrc`, `.prettierrc.js`, `tsconfig.json`, `typings.d.ts`.

## Build, Dev, and Docs
- `npm run dev` — start Dumi dev server for docs and playground.
- `npm run start` — alias to `dev`.
- `npm run build` — build the library with Father, outputs to `dist/`.
- `npm run build:watch` — watch-mode build for local iteration.
- `npm run doctor` — Father health check for build config.
- `npm run docs:build` — static docs build; `npm run docs:preview` to preview.
- `npm run prepare` — set up Husky hooks and Dumi.

## Coding Style & Naming
- Indentation: 2 spaces, LF line endings (`.editorconfig`).
- Prettier: `printWidth=80`, `singleQuote=true`, `trailingComma=all`.
- ESLint/Stylelint: Umi presets (`@umijs/lint`). Run `npm run lint`, or `lint:es` / `lint:css`.
- React components: PascalCase filenames (`FlowCanvas.tsx`). Hooks: `useXxx.ts`. Utility modules: camelCase (`formatLabel.ts`). Styles in `.less` or `.css` near components.

## Testing Guidelines
- No test runner is configured in `scripts`. If adding tests, prefer Jest via `@umijs/test`; place specs under `src/**/__tests__` and wire an `npm test` script.
- Until unit tests exist, validate changes via docs (`npm run dev`) and run `npm run doctor` + `npm run lint`.

## Commit & PR Guidelines
- Conventional Commits enforced by Commitlint. Examples:
  - `feat(editor): add zoom-to-fit`
  - `fix(history): correct undo stack handling`
- PRs should include: clear description, linked issues, screenshots/GIFs for UI changes, and docs updates when public API or behavior changes.

## Security & Configuration Tips
- Respect `peerDependencies` (`react`, `react-dom` >= 18). Do not bundle them.
- Use `lint-staged` and Husky (installed via `npm run prepare`) to keep diffs clean.
