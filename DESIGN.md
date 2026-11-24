# Recall design system

Mode: **Operate**, with a reading-oriented Methods screen. This document records the implemented design; it is not a claim that the user separately approved a visual mockup.

## Visual direction

A quiet analytical workspace with cool neutral surfaces and a warm orange correction accent. The memorable element is the before/after memory pair, grounded in a real dataset case. The rest of the UI supports comparison, source inspection, and clear state changes.

## Core tokens

| Role           | Token / value                         |
| -------------- | ------------------------------------- |
| Canvas         | `--canvas: #f8f9fb`                   |
| Surface        | `--surface: #ffffff`                  |
| Primary text   | `--ink: #262b34`                      |
| Secondary text | `--muted: #69717e`                    |
| Border         | `--line: #e7e9ee`                     |
| Action         | `--accent: #c64a24`                   |
| Data accent    | `--accent-bright: #ed653d`            |
| Accent surface | `--accent-soft: #fff0e9`              |
| Success        | `--success: #34745e`                  |
| Panel radius   | `--radius: 14px`                      |
| Motion curve   | `--ease: cubic-bezier(.16, 1, .3, 1)` |

Typography: locally packaged Manrope for Latin/numerals, Noto Sans KR for Korean. Headings 27–33px; normal control/body text 12–14px; compact secondary metadata 10–11px. Tabular numbers for metrics and dates. No decorative charts or fabricated sparklines.

Layout: 224px desktop sidebar, 67px header, 38px main gutters. The overview pairs an actual category chart with one contrasting memory example. Query evidence uses three aligned columns on wide screens, a row layout at intermediate widths, and a stack on phones. Tables scroll inside their own containers.

States: visible focus rings; hover and disabled controls; actual Worker progress; error with retry; no-result explanation; ungraded custom questions; stale configuration notice; source dialog; reduced-motion override. Orange indicates the update-aware strategy or primary action, green a successful evaluation, muted brown an obsolete memory.

Accessibility: icon-only controls have names; pass/fail symbols use explicit image roles and names; every form field is labelled; chart data is also available as a table; native dialog manages source-view focus. Text colors were checked with axe-core, including tinted surfaces.

Responsive breakpoints: 1600, 1180, 1000, 760, 480px. The sidebar becomes a dismissible drawer below 760px. Source context remains readable on a narrow screen. Do not solve page overflow with a global `overflow-x: hidden`; fix the responsible container.

Validation: see `docs/QA.md` and the actual viewport screenshots. The design detector is supplementary evidence, not proof of visual quality.
