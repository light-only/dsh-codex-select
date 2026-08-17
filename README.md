# dsh-codex-select

Codex-style code selection for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI.

- **文件 / Files** conversation view tab: lazy workspace file tree (skips
  `node_modules` / `.git` by default) + read-only file viewer (text only,
  ≤ 1 MiB, binary rejected).
- **Codex-style selection**: select code inside the viewer — a chip appears
  **above the composer**: `已选中 N 行 · <file>`.
- **[加入对话 / Add to chat]** prepends a fenced code block carrying the
  selected lines into the composer draft, so the selection rides the next
  prompt as context. **[×]** clears the chip.

## Install

```bash
dsh plugin --profile web add <path-to-this-package>
dsh web
```

Restart `dsh web` after install. The browser half is served from the plugin's
own `/dsh-codex-select` host routes (`/list`, `/read`), same trust model as the
core directory picker.

## Files

- `cordis.patch.yml` — bundle patch inserting the `codex-select` host row.
- `lib/index.js` — host half: `GET /dsh-codex-select/list|read`.
- `lib/client.js` — browser half: Files view tab + composer dock chip.
