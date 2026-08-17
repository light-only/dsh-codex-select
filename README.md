# dsh-codex-select

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

Codex-style code selection for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI.

Select code in a workspace file viewer — it is **automatically added to the
message as a reference chip** (no button, no code dumped into the draft text),
and at send time the selection is serialized into the prompt as context,
exactly like Codex.

## Features

- **文件 / Files conversation view tab**: lazy workspace file tree (skips
  `node_modules` / `.git` by default, toggles included) + read-only file
  viewer (UTF-8 text only, ≤ 1 MiB, binary rejected).
- **Codex-style selection — both files and snippets**:
  - select **code** inside the viewer — a chip appears **above the composer**:
    `已选中 N 行 · <file>`, and a matching reference chip is inserted into the
    composer automatically;
  - add a **whole file** to the context by clicking the **＋** button on a file
    tree row (or the toolbar's **加入文件 / Add file** button) — the entire
    file is attached as context.
- **No button, no draft pollution**: the content never lands in the visible
  draft text; the input machine serializes the chip through the plugin codec
  into a fenced code block with a file-path comment when you send.
- **× clears** the chip; a new pick (code or file) replaces the previous chip;
  collapsing a code selection keeps the chip (Codex behaviour).

## Install

```bash
dsh plugin --profile web add dsh-codex-select
dsh web
```

Restart `dsh web` after install, then open a session and click the
**文件 / Files** tab.

## Usage

1. Click the **文件 / Files** tab next to the conversation tabs.
2. Expand the workspace file tree (left) and click a file to view it (right).
3. **Select code** in the viewer — a chip `已选中 N 行 · 文件名` appears above
   the composer, and the selection is attached to the message automatically.
4. Type your prompt and send — the selected code rides the message as context.
5. **×** on the chip removes the selection.

## How it works

- `cordis.patch.yml` — bundle patch inserting the `codex-select` host row.
- `lib/index.js` — host half: `GET /dsh-codex-select/list|read` (same-origin
  routes, same trust model as the core directory picker).
- `lib/client.js` — browser half:
  - a `conversation.view` entry (the Files tab),
  - a `conversation.input.dock` entry (the chip bar above the composer),
  - an input-trigger source named `codex-select` whose **codec** serializes
    the reference chip at submit time (async fetch-by-path fallback so chips
    survive reloads).

## Security

The host routes share the harness web server's trust model: anyone who can
reach the harness can list/read absolute paths on the host account — the same
capability the core directory picker already exposes. The viewer is
read-only; this plugin never writes or executes files.

## License

[MIT](LICENSE)
