# Add Language: $ARGUMENTS

Add a new language translation to the Budget-me app.

## Instructions

1. Read the argument to determine the target language code and name. Examples:
   - `uk` → Ukrainian (Українська)
   - `de` → German (Deutsch)
   - `fr` → French (Français)
   - `es` → Spanish (Español)
   - `pl` → Polish (Polski)

2. Read the English translation file at `client/i18n/locales/en.json` as the source of truth.

3. Create a new file `client/i18n/locales/{code}.json` with all keys translated to the target language. Keep the same JSON structure. Do NOT translate:
   - Interpolation variables like `{{name}}`, `{{amount}}`, `{{symbol}}`
   - Currency codes, emoji, or icon names
   - Technical values

4. Register the language in `client/i18n/index.ts`:
   - Add import: `import {code} from "./locales/{code}.json";`
   - Add to `resources`: `{code}`
   - Add to `LANGUAGES` array: `{ code: "{code}", label: "{native name}" }`
   - Add to `init.resources`: `{code}: { translation: {code} }`

5. Verify the JSON is valid by reading the created file.

6. Report what was done.
