# Conventions

## Hard rules

- 🚫 **Never push to `main`** directly.
- 🚫 **No PRs / merges** without explicit team sign-off in the chat.
- 🚫 **Never commit secrets** — `.env.local`, service-account JSON, API
  keys with private scope. Use `.env.example` for shape only.
- 🚫 **No `git push --force` to a branch someone else is using.**

## Branch naming

`feat/<slice>-<owner-shortname>` — e.g. `feat/profile-screen-anaom`,
`feat/events-list-goncalo`.

Other prefixes already in use:
| Prefix | When |
|--------|------|
| `feat/` | new feature |
| `fix/` | bug fix |
| `refactor/` | code shape change, no behavior change |
| `docs/` | documentation only |
| `security/` | rules / auth-related |

## Commit messages

Conventional-ish prefixes the team is already using:

```
feat: <what>            new functionality
feat(scope): <what>     feat scoped to part (web/mobile/shared)
fix: <what>             bug fix
fix(scope): <what>
refactor: <what>
docs: <what>
chore: <what>
```

Body is optional. Keep the subject ≤ 72 chars.

## Routes and enums — use the constants

Always import; never hardcode the strings.

```js
import { ROUTES } from '@readme/shared/src/constants/routes';
import { USER_ROLES, ACCOUNT_STATUS, ACCOUNT_VISIBILITY }
  from '@readme/shared/src/constants/authConstants';
```

If the value isn't in the constants file yet, add it there first.

## Theme — use the shared colors

Both apps consume colors from `packages/shared/src/constants/theme.ts`.
- Mobile imports the `Colors` object directly.
- Web reads it once at boot and writes CSS variables to `:root` (and
  `[data-theme="dark"]`).
- Don't hardcode hex values in components.

## Code style

- JS / JSX in `apps/web` and `apps/mobile`; the few `.ts` / `.tsx` files
  in `packages/shared` are fine — Vite and Metro both handle TS.
- 4 spaces in mobile screens, 2 spaces in web (matches what's already there).
- Run `npm run lint` in `apps/web` before opening a PR.
- No emojis in code or commits unless requested.

## File naming

- Components: `PascalCase.jsx` (e.g. `LoginScreen.js`, `RegisterScreen.js` —
  mobile uses `.js`, web uses `.jsx`).
- CSS Modules: `<Component>.module.css`.
- Constants / utils: `camelCase.{js,ts}`.

## When in doubt

Ask in the team chat before guessing. Cheaper than a revert.
