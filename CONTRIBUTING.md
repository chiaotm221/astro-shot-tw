# Contributing

## Before Starting

1. Read `README.md`, `ARCHITECTURE.md`, and `AI_DEVELOPER_GUIDE.md`.
2. Read the relevant release plan under `docs/PLAN/`.
3. Confirm the requested scope and trace the affected data flow.
4. List the files expected to change before implementation.

## Local Setup

AstroShot requires Node.js 22.13 or later.

```bash
npm install
npm run dev
```

The local development server uses `http://localhost:3002`.

## Development Rules

- Use English for code, comments, tests, documentation, and Git content.
- Product localization strings may use their interface language.
- Keep changes focused and avoid unrelated refactoring.
- Do not add dependencies without a clear technical requirement.
- Keep browser APIs out of server rendering paths.
- Do not update React state from the animation loop.
- Preserve Canvas, WebGL, camera, static-export, Cloudflare, and XHS behavior.
- Store disposable project artifacts under `tmp/`.
- Update the relevant plan while requirements are evolving and update
  `CHANGELOG.md` only for completed user-visible changes.

## Verification

Run the checks relevant to the change:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

For rendering or interaction work, also test in a browser:

- desktop and mobile layout;
- pointer, wheel, keyboard, and pinch controls;
- Canvas and WebGL console output;
- camera and long-exposure capture;
- locale and localStorage restoration;
- reduced-motion behavior where relevant.

If the environment prevents a command from running, report the exact blocker.
Do not mark an unexecuted check as successful.

## Documentation Responsibilities

- `README.md`: project purpose, setup, commands, deployment, and documentation
  links.
- `ARCHITECTURE.md`: current system design and data flows.
- `AI_DEVELOPER_GUIDE.md`: constraints and workflow for AI agents.
- `ROADMAP.md`: long-term product direction and release sequence.
- `docs/PLAN/Vx.y.md`: executable scope and acceptance criteria for one release.
- `CHANGELOG.md`: concise record of completed release changes.

## Change Review

Before handing off a change:

1. Review the complete diff.
2. Remove unrelated edits and generated files.
3. Confirm new data has source and license information.
4. Record verification commands and results.
5. Document remaining visual, performance, or compatibility risks.

Do not commit, push, or deploy unless the user or maintainer explicitly requests
that action.
