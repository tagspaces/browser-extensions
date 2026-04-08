---
name: translate
description: Translate new or untranslated i18n strings from English messages.json to all other locale files, maintaining consistency with each language's existing translations.
---

# Translate Skill

Automatically translate new or untranslated strings from the English `messages.json` to all other locale files, maintaining consistency with each language's existing translations.

## Arguments

- No argument or `all`: process all languages
- A language code (e.g., `de`, `ja`, `bg`): process only that language
- `report`: only show what's missing/untranslated, don't translate

## File Paths

- **Source of truth**: `_locales/en/messages.json`
- **Target locales**: every subdirectory of `_locales/` except `en/`
- Each locale has a single file: `messages.json` using Chrome extension i18n format:
  ```json
  {
    "keyName": {
      "message": "Translated text",
      "description": "Context for translators"
    }
  }
  ```

## Step 1 — Detect what needs translating

1. Read `_locales/en/messages.json` (the English source).
2. List all directories under `_locales/` to discover target languages.
3. If a specific language was requested, only process that one; otherwise process all.
4. For each target locale, read its `messages.json` and compare against English:
   - **Missing keys**: present in English but absent in the target file.
   - **Untranslated keys**: `message` value in the target is identical to the English `message` value AND the key is NOT in the skip-list (see below).
   - **Orphan keys**: present in the target but absent from English (candidates for removal).
5. Print a summary table to the user:
   ```
   Language  | Missing | Untranslated | Orphan
   ----------|---------|--------------|-------
   de        |    3    |      1       |   0
   ja        |    3    |      5       |   0
   ...
   ```
6. If the argument was `report`, stop here. Otherwise, ask the user for confirmation before proceeding (unless `--yes` was passed).

### Skip-list for untranslated detection

These keys are expected to have the same value as English in many/all languages. Do NOT flag them as untranslated:

- `appName` — brand name, kept as "TagSpaces Web Clipper" in all languages
- `optionsTutorialLink` — "Tutorial" is used as-is in many Romance and Latin-based languages (ca, es, es_CL, id_ID, it, pt_BR, pt_PT, and others)
- Keys where the English `message` is a single symbol, number, or punctuation (e.g., `"-"`, `"/"`)
- Keys where the English `message` is a proper noun or brand name only (e.g., `"TagSpaces"`)
- Keys where the English `message` is a widely-used English loanword that many languages keep as-is (e.g., `"Ok"`, `"Email"`, `"Markdown"`, `"Tutorial"`)
- When in doubt, check if at least 5 other languages also have the same value as English — if so, it's likely intentional.

## Step 2 — Gather translation context

For each language that needs translations:

1. Read the full `messages.json` for that language.
2. Use **all existing translated entries** as a style and terminology reference, ensuring:
   - Consistent tone and formality level (formal "Sie" vs informal "du" in German, etc.)
   - Consistent term choices (e.g., if "screenshot" has been translated as "Bildschirmfoto" in German, keep using "Bildschirmfoto")
   - Consistent punctuation patterns

## Step 3 — Translate

For each language, translate all missing and untranslated keys:

1. Use the English `message` value as the source text.
2. Reference the existing translations from Step 2 for style/terminology consistency.
3. Copy the `description` field from the English source as-is (descriptions stay in English for developer reference).
4. Apply the following rules strictly:

### Translation Rules

- **NEVER modify `_locales/en/messages.json`** — it is read-only for this skill.
- **Preserve `$PLACEHOLDER$` and `{{variables}}` exactly** — template placeholders must appear in the translation unchanged. Do not translate, reorder, or remove them.
- **Preserve HTML tags exactly** — tags like `<br>`, `<b>`, `</b>`, `<a>` etc. must remain intact.
- **Keep technical terms in English** across all languages: TagSpaces, Markdown, HTML, MHTML, PDF, PNG, URL, YAML.
- **German (de, de_DE) specific**: Use "Tags" for tags, NOT "Schlagwort/Schlagwörter". The English loanword "Tags" is the project standard. Note: the existing German translations use "Etiketten" for tags in some places — follow the existing convention in each file for consistency, but prefer "Tags" for new translations.
- **Match existing tone**: If a language uses formal address (e.g., "Sie" in German, "Vous" in French), maintain that. If informal, maintain that. Determine this from the existing translations.
- **Natural phrasing**: Translations should read naturally in the target language, not be word-for-word calques from English.
- **Translate language by language** (not key by key) to maintain internal consistency within each locale.

## Step 4 — Write results

1. For each modified locale, construct the full `messages.json` with:
   - **The same key order as `_locales/en/messages.json`** (this keeps diffs clean and structure consistent).
   - All existing translations preserved (only missing/untranslated keys get new values).
   - Orphan keys removed (keys not present in `_locales/en/messages.json`).
2. Write the file using the Write tool or Edit tool as appropriate.
3. **Validate JSON**: After writing, verify the file is valid JSON (use `node -e "JSON.parse(require('fs').readFileSync('path'))"` or equivalent).
4. Print a final summary:
   ```
   Language  | Added | Updated | Removed | Status
   ----------|-------|---------|---------|-------
   de        |   3   |    1    |    0    |  OK
   ja        |   3   |    5    |    0    |  OK
   ...
   ```

## Performance Strategy

- For a single language: process directly in the main conversation.
- For all languages: use the Agent tool to parallelize. Launch multiple agents, each handling a batch of ~4-5 languages. Each agent receives:
  - The full English `messages.json`
  - The list of missing/untranslated keys (from Step 1)
  - The target language files to process
  - These translation rules

## Edge Cases

| Case | Handling |
|---|---|
| Value same as English but intentional | Use the skip-list; also check if 5+ other languages have the same value |
| New language directory with empty/missing `messages.json` | Generate a complete translation from scratch |
| Key has only whitespace or empty string as `message` | Treat as untranslated |
| English value contains line breaks (`\n`) | Preserve line breaks in translation |
| English value is very long (100+ chars) | Translate fully, do not truncate |
| `de` and `de_DE` both exist | **Special case**: `de` and `de_DE` must always be kept in sync — they should have identical content. When translating German, write the same output to both `_locales/de/messages.json` and `_locales/de_DE/messages.json`. This is for historical reasons. |

## Practical Notes (from past runs)

- **Key reordering**: Many locale files have keys in a different order than English (e.g., `saveFullScreenshotLabel` at the end instead of after `saveScreenshotTitle`). When writing, always reorder to match English — this is expected and keeps diffs clean.
- **Regional variants**: Some language pairs have deliberate differences — do NOT copy one to the other:
  - `es` (Spain) uses "Añadir" vs `es_CL` (Chile) uses "Agregar"
  - `pt_PT` uses "ficheiro/ecrã/etiquetas" vs `pt_BR` uses "arquivo/tela/tags"
  - `fr` uses "enregistrés" vs `fr_CA` uses "sauvegardés"
  - `zh_CN` (Simplified), `zh_HK` (Traditional HK), `zh_TW` (Traditional TW) each have distinct terminology
- **Untranslated detection across batches**: When parallelizing, include untranslated key info in every batch prompt, not just the batch containing the affected language — the detection step should identify all issues upfront before dispatching agents.
- **Batch size**: 7 batches of 4-5 languages works well for ~34 locales. Each agent completes in ~3-4 minutes.
