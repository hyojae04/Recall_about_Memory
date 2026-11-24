# Verification record

Date: 2026-11-11 (Asia/Seoul).

## Environment

- macOS, Node.js 26.11.1, npm 11.20.0
- React 19, TypeScript 5.7, Vite 6.4.6, Vitest 3.2.7
- Playwright 1.65.0 with the installed Chrome channel
- Bundled Manrope and Noto Sans KR fonts; no external font requests

The lockfile is the exact dependency record. The CI workflow uses Node 22 and downloaded Chromium; that remote workflow has been authored but has not been run on GitHub.

## Checks and artifacts

| Check                  | Command / evidence                           | Result                                               |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------- |
| Engine tests           | `npm test`                                   | 27 passed                                            |
| Browser integration    | `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` | 14 passed |
| Accessibility          | axe-core in the four primary route tests     | No WCAG 2 A/AA or 2.1 AA violations detected         |
| Type safety            | `npm run build`                              | Strict TypeScript, including unused declarations     |
| Production bundling    | `npm run build`                              | Vite production output generated                     |
| Reproducible benchmark | `npm run benchmark`                          | 144 evaluations, JSON saved                          |
| Local design scan      | Impeccable detector on changed UI files      | No findings in the scan                              |

Browser coverage: overview values, chart table, Worker rerun at K=1, export contents, original versus superseded evidence, historical cutoff, source dialog and Escape, free-query ungraded status, disabled empty query, dataset filters and empty state, dataset export, mobile navigation and page overflow. A Worker-load error/retry scenario is included.

Passing execution summaries are saved in [verification.txt](verification.txt).

## Screenshots

- [Overview, 1440px](overview-desktop.png)
- [Playground, 1440px](playground-desktop.png)
- [Dataset, 1440px](dataset-desktop.png)
- [Methods, 1440px](methods-desktop.png)
- [Overview, 768px](overview-tablet.png)
- [Overview, 390px](overview-mobile.png)
- [Playground, 390px](playground-mobile.png)

Screenshots are captured from the running app by the browser suite, not design mockups. The suite checks for uncaught page errors and verifies no document-level horizontal overflow at the tested narrow widths. Data tables intentionally scroll inside their own containers.

## Problems found and resolved

1. The first browser run could not start because the matching Playwright-managed browser was absent. The installed Chrome channel was used; setup for a managed Chromium installation is documented separately.
2. Initial small text lacked contrast. Metadata text was enlarged and foreground colors were corrected on both neutral and tinted surfaces.
3. Pass/fail indicators and the workspace avatar had labels on generic spans. Explicit image roles were added.
4. Screen-reader-only text in table headers was absolutely positioned relative to an outer container, causing mobile page overflow. The scroll container was made positioned; the table remains internally scrollable.
5. Source metadata and failure cases remain visible. No failing benchmark cases were removed to inflate results.

## Limits of verification

Automated accessibility tests do not replace a full screen-reader audit. Safari and Firefox were not run through the complete suite. Browser performance under production-scale datasets was not measured. The saved timing values are small local measurements, not a model-latency benchmark. No paid model endpoint, deployment, database or production user data was tested.
