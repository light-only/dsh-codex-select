/**
 * dsh-codex-select — browser half.
 *
 * Codex-style code selection for the DSH Web GUI, rebuilt on the input
 * machine's native reference-chip mechanism:
 *
 *   - a "文件 / Files" conversation view tab: workspace file tree (lazy) +
 *     read-only file viewer;
 *   - selecting code inside the viewer AUTOMATICALLY inserts a reference chip
 *     into the composer (U+FFFC occurrence — the code never lands in the
 *     visible draft text, no "add" button);
 *   - at send time the input machine serializes the chip through this
 *     plugin's codec into a fenced code block with a file-path comment, so
 *     the selection rides the message as context (Codex behaviour);
 *   - a slim bar above the composer mirrors the chip ("已选中 N 行 · file")
 *     with a [×] that removes it; a new selection replaces the previous chip.
 *
 * Listings and file content come from the plugin's own host routes, so
 * nothing here depends on core changes.
 */

window.__ModuleLoader__.load({
  id: 'dsh-codex-select',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    let react_jsx_runtime = require('react/jsx-runtime')
    let react = require('react')

    // ============================================================ CSS
    const css = [
      '.cxsel-dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto}',
      '.cxsel-bar{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-tip);border-radius:12px;align-items:center;gap:10px;height:38px;margin:0 auto;padding:4px 5px 4px 12px;display:flex}',
      '.cxsel-chip{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:24px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cxsel-iconbtn{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:999px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex;font-size:16px;line-height:1}',
      '.cxsel-iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}',
      '.cxsel-root{box-sizing:border-box;flex:1;width:100%;min-height:0;min-width:0;display:flex;position:relative;overflow:hidden;font:var(--dsw-font-xxs-12)}',
      '.cxsel-tree{box-sizing:border-box;min-width:0;width:min(320px,38%);border-right:1px solid var(--dsw-alias-border-l1);overflow:auto;flex:none;padding:8px 6px}',
      '.cxsel-treeHeader{box-sizing:border-box;align-items:center;gap:8px;width:100%;padding:2px 4px 8px;display:flex;flex-wrap:wrap;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.cxsel-treeRoot{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-secondary);font-weight:500;font-size:12px;padding:2px 4px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cxsel-toggle{box-sizing:border-box;height:20px;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:var(--dsw-font-xxs-12);background:0 0;border:0;border-radius:3px;flex:none;align-items:center;gap:4px;padding:0 5px;display:inline-flex}',
      '.cxsel-toggle:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}',
      '.cxsel-item{box-sizing:border-box;width:100%;min-width:0;border-radius:5px;align-items:center;gap:6px;padding:2px 4px;display:flex;cursor:pointer;font-size:12px;line-height:20px;color:var(--dsw-alias-label-primary);white-space:nowrap}',
      '.cxsel-item:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.cxsel-item-active{background:var(--dsw-alias-interactive-bg-active)}',
      '.cxsel-glyph{flex:none;width:12px;color:var(--dsw-alias-label-tertiary);display:inline-block;text-align:center}',
      '.cxsel-name{min-width:0;overflow:hidden;text-overflow:ellipsis;flex:1}',
      '.cxsel-dir{color:var(--dsw-alias-label-primary);font-weight:500}',
      '.cxsel-muted{color:var(--dsw-alias-label-tertiary)}',
      '.cxsel-viewer{box-sizing:border-box;min-width:0;flex:1;display:flex;flex-direction:column;overflow:hidden}',
      '.cxsel-toolbar{box-sizing:border-box;align-items:center;gap:10px;width:100%;height:34px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;padding:0 10px;display:flex}',
      '.cxsel-path{min-width:0;color:var(--dsw-alias-label-primary);font-size:12px;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;font-family:var(--dsw-font-markdown-code,monospace)}',
      '.cxsel-meta{color:var(--dsw-alias-label-caption);flex:none;font-size:12px;line-height:20px}',
      '.cxsel-preWrap{box-sizing:border-box;min-height:0;flex:1;overflow:auto;position:relative}',
      '.cxsel-pre{box-sizing:border-box;min-width:100%;width:max-content;min-height:100%;margin:0;padding:12px 14px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-markdown-code,ui-monospace,SFMono-Regular,Consolas,monospace);font-size:12.5px;line-height:1.55;tab-size:4;white-space:pre;user-select:text;-webkit-user-select:text;cursor:text}',
      '.cxsel-hint{box-sizing:border-box;width:100%;height:100%;color:var(--dsw-alias-label-caption);justify-content:center;align-items:center;padding:24px;display:flex;text-align:center;font-size:13px;line-height:1.7;white-space:pre-line}',
      '.cxsel-spin{box-sizing:border-box;border:1.5px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-state-business-primary);border-radius:50%;width:12px;height:12px;animation:.7s linear infinite cxsel-spin;flex:none}',
      '@keyframes cxsel-spin{to{transform:rotate(360deg)}}',
    ].join('')
    const tagId = 'dsh-codex-select/styles.css'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + tagId + '"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-codex-select'
      tag.dataset.pluginCss = tagId
      tag.textContent = css
      document.head.appendChild(tag)
    }

    // ============================================================ locale
    const NS = 'codex-select'
    const zh = {
      'view.files': '文件',
      'selectedLines': '已选中 {count} 行 · {name}',
      'clear': '清除选择',
      'copy': '复制',
      'copied': '已复制',
      'noWorkspace': '请先在侧边栏选择一个工作区',
      'selectHint': '点击文件查看内容\n在代码上划选，选中代码会自动作为上下文加入输入框（显示为 chip），直接发送即可带上',
      'tooLarge': '文件超过 1MB，仅支持预览较小的文本文件',
      'binary': '二进制文件，不支持文本预览',
      'readError': '读取失败：{error}',
      'showIgnored': '显示 node_modules / .git',
      'showHidden': '显示隐藏文件',
      'truncatedDir': '目录过大，仅显示前 2000 项',
      'empty': '（空）',
      'treeTitle': '工作区文件',
    }
    const en = {
      'view.files': 'Files',
      'selectedLines': '{count} lines selected · {name}',
      'clear': 'Clear selection',
      'copy': 'Copy',
      'copied': 'Copied',
      'noWorkspace': 'Select a workspace in the sidebar first',
      'selectHint': 'Click a file to view it.\nSelect code in the viewer — the selection is added to the message as a chip automatically and sent as context.',
      'tooLarge': 'File exceeds 1MB — only smaller text files are previewable',
      'binary': 'Binary file — no text preview',
      'readError': 'Read failed: {error}',
      'showIgnored': 'Show node_modules / .git',
      'showHidden': 'Show hidden files',
      'truncatedDir': 'Directory truncated — first 2000 entries shown',
      'empty': '(empty)',
      'treeTitle': 'Workspace files',
    }

    // ============================================================ shared selection state
    let selectionState = null
    const selectionListeners = new Set()
    function setSelection(next) {
      selectionState = next
      selectionListeners.forEach((fn) => fn())
    }
    function clearSelection() {
      selectionState = null
      selectionListeners.forEach((fn) => fn())
    }
    const selectionSource = {
      getSnapshot: () => selectionState,
      subscribe: (fn) => {
        selectionListeners.add(fn)
        return () => selectionListeners.delete(fn)
      },
    }
    function useSelection() {
      return react.useSyncExternalStore(selectionSource.subscribe, selectionSource.getSnapshot)
    }

    /** Ref of the chip the viewer asked the composer to carry; consumed on success. */
    let pendingInsertRef = null
    /** Serialization cache: ref -> { relPath, code, lineCount, ext } (survives only this page load). */
    const codeCache = new Map()

    // ============================================================ host fetch helpers
    const ROUTE_PREFIX = '/dsh-codex-select'
    async function listDir(path, signal) {
      const response = await fetch(ROUTE_PREFIX + '/list?path=' + encodeURIComponent(path), { signal })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error((body && body.error) || ('list failed (HTTP ' + response.status + ')'))
      }
      return await response.json()
    }
    async function readFile(path, signal) {
      const response = await fetch(ROUTE_PREFIX + '/read?path=' + encodeURIComponent(path), { signal })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error((body && body.error) || ('read failed (HTTP ' + response.status + ')'))
      }
      return await response.json()
    }

    // ============================================================ helpers
    function basename(path) {
      const parts = String(path).split(/[\\/]/)
      return parts[parts.length - 1] || path
    }
    function extOf(path) {
      const base = basename(path)
      const dot = base.lastIndexOf('.')
      return dot > 0 ? base.slice(dot + 1).toLowerCase() : ''
    }
    const LANG_MAP = {
      js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
      ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'tsx',
      json: 'json', md: 'markdown', markdown: 'markdown', css: 'css', scss: 'scss',
      html: 'html', htm: 'html', xml: 'xml', svg: 'xml',
      py: 'python', yml: 'yaml', yaml: 'yaml', sh: 'bash', bash: 'bash',
      ps1: 'powershell', java: 'java', go: 'go', rs: 'rust', c: 'c', h: 'c',
      cpp: 'cpp', hpp: 'cpp', cc: 'cpp', sql: 'sql', vue: 'vue', svelte: 'svelte',
    }
    function refOf(absPath, startLine, endLine) {
      return absPath + '::' + startLine + '-' + endLine
    }
    function parseRef(ref) {
      const idx = String(ref).lastIndexOf('::')
      if (idx <= 0) return { absPath: String(ref), startLine: 1, endLine: 1 }
      const absPath = ref.slice(0, idx)
      const m = /^(\d+)-(\d+)$/.exec(ref.slice(idx + 2))
      if (!m) return { absPath, startLine: 1, endLine: 1 }
      return { absPath, startLine: Number(m[1]), endLine: Number(m[2]) }
    }
    function buildBlock(relPath, code, startLine, endLine, ext) {
      const lang = LANG_MAP[ext] || ''
      const lines = endLine - startLine + 1
      const header = '// ' + relPath + ' — 选中 ' + lines + ' 行（' + startLine + '-' + endLine + ' 行）'
      const body = String(code).replace(/\s+$/, '')
      return '```' + lang + '\n' + header + '\n' + body + '\n```'
    }
    function relOf(root, path) {
      if (!root) return path
      const rel = path.startsWith(root) ? path.slice(root.length) : path
      return (rel.replace(/\\/g, '/').replace(/^\//, '') || basename(path))
    }

    // ============================================================ FileView
    const { useState, useEffect, useCallback, useRef, useMemo } = react

    function FileView(props) {
      const { sessionId, useSessions, useWorkspaces, t } = props

      const sessions = useSessions ? useSessions((s) => s) : undefined
      const workspaces = useWorkspaces ? useWorkspaces((s) => s) : undefined

      const root = useMemo(() => {
        const items = (workspaces && workspaces.items) || []
        if (sessionId) {
          const owned = items.find((w) => w.sessionIds && w.sessionIds.includes(sessionId))
          if (owned && owned.path) return owned.path
        }
        const recent = items.find((w) => w.workspaceId === workspaces.recentWorkspaceId)
        if (recent && recent.path) return recent.path
        return items.length > 0 && items[0].path ? items[0].path : undefined
      }, [workspaces, sessionId])

      const [dirCache, setDirCache] = useState({})
      const [expanded, setExpanded] = useState({})
      const [current, setCurrent] = useState(null)
      const [busyPath, setBusyPath] = useState(null)
      const [showIgnored, setShowIgnored] = useState(false)
      const [showHidden, setShowHidden] = useState(false)
      const [sel, setSel] = useState(null)
      const [copied, setCopied] = useState(false)
      const preRef = useRef(null)
      const currentRef = useRef(null)

      const loadDir = useCallback(async (path) => {
        setDirCache((c) => ({ ...c, [path]: { entries: (c[path] && c[path].entries) || [], loading: true, error: null, truncated: false } }))
        try {
          const data = await listDir(path)
          setDirCache((c) => ({ ...c, [path]: { entries: data.entries, loading: false, error: null, truncated: data.truncated } }))
        } catch (error) {
          setDirCache((c) => ({ ...c, [path]: { entries: (c[path] && c[path].entries) || [], loading: false, error: error.message, truncated: false } }))
        }
      }, [])

      useEffect(() => {
        if (!root) return
        setDirCache({})
        setExpanded({})
        setCurrent(null)
        setSel(null)
        clearSelection()
        pendingInsertRef = null
        loadDir(root)
      }, [root, loadDir])

      const toggleDir = useCallback((path) => {
        setExpanded((e) => ({ ...e, [path]: !e[path] }))
        const cached = dirCache[path]
        if (!cached) { loadDir(path); return }
        if (!cached.loading && cached.error) loadDir(path)
      }, [dirCache, loadDir])

      const openFile = useCallback(async (path) => {
        setBusyPath(path)
        setSel(null)
        try {
          const data = await readFile(path)
          setCurrent({
            path,
            relPath: relOf(root, path),
            content: data.content,
            truncated: data.truncated,
            tooLarge: data.tooLarge,
            binary: data.binary,
            error: null,
          })
        } catch (error) {
          setCurrent({ path, relPath: relOf(root, path), content: null, error: error.message })
        } finally {
          setBusyPath(null)
        }
      }, [root])

      // Keep the current content available to the (stable) selection listener.
      currentRef.current = current && current.content !== null && current.error === null ? current.content : null

      // Track non-empty text selection inside the viewer <pre>; collapsing the
      // selection never clears the chip (Codex keeps it until × or a new pick).
      useEffect(() => {
        const onSelection = () => {
          const selection = window.getSelection()
          const el = preRef.current
          if (!el || !selection || selection.isCollapsed || selection.rangeCount === 0) return
          let node = selection.anchorNode
          let inside = false
          while (node) {
            if (node === el) { inside = true; break }
            node = node.parentNode
          }
          if (!inside) return
          const text = selection.toString()
          if (!text) return
          const content = currentRef.current
          if (!content) return
          const textNode = el.firstChild
          let start = 0
          if (selection.anchorNode === textNode && selection.focusNode === textNode) {
            start = Math.min(selection.anchorOffset, selection.focusOffset)
          } else {
            const firstLine = text.split('\n')[0]
            const idx = content.indexOf(firstLine)
            if (idx >= 0) start = idx
          }
          const lineCount = text.split('\n').length
          const startLine = content.slice(0, start).split('\n').length
          setSel({ text, lineCount, startLine, endLine: startLine + lineCount - 1 })
        }
        document.addEventListener('selectionchange', onSelection)
        document.addEventListener('mouseup', onSelection)
        document.addEventListener('keyup', onSelection)
        return () => {
          document.removeEventListener('selectionchange', onSelection)
          document.removeEventListener('mouseup', onSelection)
          document.removeEventListener('keyup', onSelection)
        }
      }, [])

      // Publish the selection + arm the composer chip.
      useEffect(() => {
        if (current && sel && current.content !== null && current.error === null) {
          const ref = refOf(current.path, sel.startLine, sel.endLine)
          codeCache.set(ref, { relPath: current.relPath, code: sel.text, lineCount: sel.lineCount, ext: extOf(current.relPath) })
          pendingInsertRef = ref
          setSelection({
            ref,
            relPath: current.relPath,
            text: sel.text,
            lineCount: sel.lineCount,
            startLine: sel.startLine,
            endLine: sel.endLine,
            ext: extOf(current.relPath),
          })
        } else {
          clearSelection()
        }
      }, [sel, current])

      const copySelection = useCallback(async () => {
        const selection = window.getSelection()
        let text = null
        if (selection && !selection.isCollapsed) text = selection.toString()
        if (text === null && sel) text = sel.text
        if (text === null) return
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch { /* clipboard unavailable */ }
      }, [sel])

      if (!root) {
        return react_jsx_runtime.jsx('div', { className: 'cxsel-root', 'data-conversation-composer-overlay': '', children: react_jsx_runtime.jsx('div', { className: 'cxsel-hint', children: t ? t('noWorkspace') : 'No workspace' }) })
      }

      const treeNodes = []
      const renderDir = (dirPath, depth) => {
        const cached = dirCache[dirPath]
        const isOpen = !!expanded[dirPath]
        treeNodes.push(
          react_jsx_runtime.jsx('div', {
            className: 'cxsel-item',
            style: { paddingLeft: 4 + depth * 14 },
            onClick: () => toggleDir(dirPath),
            children: [
              react_jsx_runtime.jsx('span', { className: 'cxsel-glyph', children: isOpen ? '▾' : '▸' }),
              react_jsx_runtime.jsx('span', { className: 'cxsel-name cxsel-dir', children: basename(dirPath) }),
            ],
          }, 'dir-' + dirPath),
        )
        if (!isOpen) return
        if (cached && cached.loading) {
          treeNodes.push(
            react_jsx_runtime.jsx('div', { className: 'cxsel-item', style: { paddingLeft: 4 + (depth + 1) * 14 }, children: react_jsx_runtime.jsx('span', { className: 'cxsel-muted', children: '…' }) }, 'load-' + dirPath),
          )
          return
        }
        const entries = (cached && cached.entries) || []
        let shown = 0
        for (const entry of entries) {
          if (entry.isDirectory) {
            if (!showIgnored && (entry.name === 'node_modules' || entry.name === '.git')) continue
            if (!showHidden && entry.hidden) continue
            shown++
            renderDir(entry.path, depth + 1)
          }
        }
        for (const entry of entries) {
          if (!entry.isDirectory) {
            if (!showIgnored && (entry.name === 'node_modules' || entry.name === '.git')) continue
            if (!showHidden && entry.hidden) continue
            shown++
            const active = current && current.path === entry.path
            treeNodes.push(
              react_jsx_runtime.jsx('div', {
                className: 'cxsel-item' + (active ? ' cxsel-item-active' : ''),
                style: { paddingLeft: 4 + (depth + 1) * 14 },
                onClick: () => openFile(entry.path),
                children: [
                  react_jsx_runtime.jsx('span', { className: 'cxsel-glyph', children: '·' }),
                  react_jsx_runtime.jsx('span', { className: 'cxsel-name', children: entry.name }),
                ],
              }, 'file-' + entry.path),
            )
          }
        }
        if (shown === 0) {
          treeNodes.push(
            react_jsx_runtime.jsx('div', { className: 'cxsel-item cxsel-muted', style: { paddingLeft: 4 + (depth + 1) * 14 }, children: t ? t('empty') : '(empty)' }, 'empty-' + dirPath),
          )
        }
        if (cached && cached.truncated) {
          treeNodes.push(
            react_jsx_runtime.jsx('div', { className: 'cxsel-item cxsel-muted', style: { paddingLeft: 4 + (depth + 1) * 14 }, children: t ? t('truncatedDir') : 'truncated' }, 'trunc-' + dirPath),
          )
        }
      }
      if (dirCache[root]) renderDir(root, 0)

      let viewer
      if (!current) {
        viewer = react_jsx_runtime.jsx('div', { className: 'cxsel-hint', children: t ? t('selectHint') : 'Select a file' })
      } else if (current.error) {
        viewer = react_jsx_runtime.jsx('div', { className: 'cxsel-hint', children: (t ? t('readError', { error: current.error }) : current.error) })
      } else if (current.tooLarge) {
        viewer = react_jsx_runtime.jsx('div', { className: 'cxsel-hint', children: t ? t('tooLarge') : 'Too large' })
      } else if (current.binary) {
        viewer = react_jsx_runtime.jsx('div', { className: 'cxsel-hint', children: t ? t('binary') : 'Binary' })
      } else {
        viewer = react_jsx_runtime.jsx('div', {
          className: 'cxsel-preWrap',
          children: react_jsx_runtime.jsx('pre', {
            ref: preRef,
            className: 'cxsel-pre',
            spellCheck: false,
            children: current.content,
          }),
        })
      }

      return react_jsx_runtime.jsx('div', {
        className: 'cxsel-root',
        'data-conversation-composer-overlay': '',
        children: [
          react_jsx_runtime.jsx('div', {
            className: 'cxsel-tree',
            children: [
              react_jsx_runtime.jsx('div', { className: 'cxsel-treeRoot', title: root, children: t ? t('treeTitle') : 'Workspace files' }),
              react_jsx_runtime.jsx('div', {
                className: 'cxsel-treeHeader',
                children: [
                  react_jsx_runtime.jsx('button', {
                    type: 'button',
                    className: 'cxsel-toggle',
                    'aria-pressed': showIgnored ? 'true' : 'false',
                    onClick: () => setShowIgnored((v) => !v),
                    children: t ? t('showIgnored') : 'ignored',
                  }),
                  react_jsx_runtime.jsx('button', {
                    type: 'button',
                    className: 'cxsel-toggle',
                    'aria-pressed': showHidden ? 'true' : 'false',
                    onClick: () => setShowHidden((v) => !v),
                    children: t ? t('showHidden') : 'hidden',
                  }),
                ],
              }),
              ...treeNodes,
            ],
          }),
          react_jsx_runtime.jsx('div', {
            className: 'cxsel-viewer',
            children: [
              react_jsx_runtime.jsx('div', {
                className: 'cxsel-toolbar',
                children: [
                  react_jsx_runtime.jsx('span', { className: 'cxsel-path', title: current ? current.path : '', children: current ? current.relPath : '' }),
                  busyPath && react_jsx_runtime.jsx('span', { className: 'cxsel-spin' }),
                  sel && current && react_jsx_runtime.jsx('span', { className: 'cxsel-meta', children: sel.lineCount + ' 行' }),
                  current && react_jsx_runtime.jsx('button', { type: 'button', className: 'cxsel-toggle', onClick: copySelection, disabled: !(sel), children: copied ? (t ? t('copied') : 'Copied') : (t ? t('copy') : 'Copy') }),
                ],
              }),
              viewer,
            ],
          }),
        ],
      })
    }

    // ============================================================ SelectionDock
    function SelectionDock(props) {
      const { input, syncSelection, t } = props
      const sel = useSelection()

      // Keep the composer chip in sync with the viewer selection: insert or
      // replace on a fresh pick; remove when the selection is cleared.
      useEffect(() => {
        if (!input) return
        const chip = input.occurrences.find((o) => o.source === 'codex-select')
        if (pendingInsertRef !== null) {
          const ref = pendingInsertRef
          if (syncSelection(ref, chip, input)) pendingInsertRef = null
          return
        }
        if (!sel && chip) syncSelection(null, chip, input)
      }, [input, sel, syncSelection])

      if (!sel || !input) return null
      const chip = input.occurrences.find((o) => o.source === 'codex-select')
      if (!chip) return null
      return react_jsx_runtime.jsx('div', {
        className: 'cxsel-dock',
        'data-codex-dock': 'true',
        children: react_jsx_runtime.jsx('div', {
          className: 'cxsel-bar',
          children: [
            react_jsx_runtime.jsx('span', {
              className: 'cxsel-chip',
              title: sel.relPath,
              children: t ? t('selectedLines', { count: sel.lineCount, name: basename(sel.relPath) }) : (sel.lineCount + ' lines · ' + basename(sel.relPath)),
            }),
            react_jsx_runtime.jsx('button', {
              type: 'button',
              className: 'cxsel-iconbtn',
              'aria-label': t ? t('clear') : 'Clear',
              title: t ? t('clear') : 'Clear',
              onClick: clearSelection,
              children: '×',
            }),
          ],
        }),
      })
    }

    // ============================================================ plugin body
    /** Required services (cordis fiber inject). */
    const inject = ['slots', 'sessions', 'workspaces', 'locale', 'inputTriggers']

    /**
     * Client plugin body: dictionaries, the trigger source (codec), the Files
     * view tab, and the composer dock chip.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-codex-select: dictionaries')

      const t = ctx.locale.bind(NS)

      // The reference source whose codec serializes chips at send time. It
      // produces no menu candidates — chips are inserted programmatically.
      ctx.effect(() => ctx.inputTriggers.registerSource({
        trigger: '@',
        name: 'codex-select',
        order: 100,
        candidates: async () => [],
        onPick: () => undefined,
        codec: {
          clipboardText: (ref) => {
            const { absPath } = parseRef(ref)
            return basename(absPath)
          },
          serialize: async (ref, signal) => {
            const cached = codeCache.get(ref)
            if (cached) {
              return buildBlock(cached.relPath, cached.code, parseRef(ref).startLine, parseRef(ref).endLine, cached.ext)
            }
            const { absPath, startLine, endLine } = parseRef(ref)
            try {
              const data = await readFile(absPath, signal)
              if (data && data.content !== null) {
                const lines = data.content.split('\n').slice(startLine - 1, endLine)
                const code = lines.join('\n')
                return buildBlock(relOf(undefined, absPath), code, startLine, endLine, extOf(absPath))
              }
            } catch { /* fall through to degraded form */ }
            return '// 选中代码：' + absPath + '（' + startLine + '-' + endLine + ' 行）'
          },
        },
      }), 'dsh-codex-select: trigger source')

      // The dock's injected face: one verb that keeps the composer chip in
      // sync with the viewer selection (bail-event dispatch on the session
      // scope, exactly like the input-trigger controller's own pick path).
      const syncSelection = (sessionId) => (ref, chip, input) => {
        const binding = ctx.sessions.binding(sessionId)
        if (!binding) return false
        const actx = binding.ctx
        if (ref === null) {
          if (!chip) return true
          const end = input.draft[chip.offset + 1] === ' ' ? chip.offset + 2 : chip.offset + 1
          const span = { start: chip.offset, end, draftRev: input.draftRev }
          return actx.bail(actx, 'slash/input-consume-token', { guard: { kind: 'span', span } }) === true
        }
        const cached = codeCache.get(ref)
        if (!cached) return false
        const occurrence = input.occurrences.find((o) => o.source === 'codex-select')
        if (occurrence && occurrence.ref === ref) return true
        const span = occurrence
          ? { start: occurrence.offset, end: (input.draft[occurrence.offset + 1] === ' ' ? occurrence.offset + 2 : occurrence.offset + 1), draftRev: input.draftRev }
          : { start: input.draft.length, end: input.draft.length, draftRev: input.draftRev }
        const reference = {
          source: 'codex-select',
          ref,
          label: cached.lineCount + ' 行 · ' + basename(cached.relPath),
          clipboardText: cached.relPath,
        }
        return actx.bail(actx, 'slash/input-insert-reference', { reference, span }) === true
      }

      ctx.slots.inject('conversation.view', () => ctx.slots.register({
        name: 'conversation.view',
        id: 'codex-select-files',
        order: 15,
        locale: NS,
        label: () => t('view.files'),
      }, FileView))

      ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'codex-select',
        order: 20,
        locale: NS,
        inject: (sessionId) => ({ syncSelection: syncSelection(sessionId) }),
      }, SelectionDock))
    }

    exports.apply = apply
    exports.inject = inject
    exports.FileView = FileView
    exports.SelectionDock = SelectionDock
    return module.exports
  },
})
