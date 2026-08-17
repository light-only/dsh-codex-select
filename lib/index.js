/**
 * dsh-codex-select — host half.
 *
 * Registers two same-origin HTTP routes on the harness web server for the
 * plugin's browser half:
 *
 *   GET /dsh-codex-select/list?path=<absolute>  — one directory level
 *     (directories AND files, name-sorted, hidden flag, bounded window).
 *   GET /dsh-codex-select/read?path=<absolute>  — UTF-8 text content of one
 *     file, size-capped and binary-rejected (NUL sample).
 *
 * The route shares the harness web server's trust model with the core /api
 * surface and the shipped directory picker: anyone who can reach the harness
 * can list/read absolute paths on the host account. That is the same
 * capability the core's own browse directory picker already exposes, so no
 * additional permission boundary is invented here.
 *
 * The file is fully self-contained (node builtins only), so the plugin works
 * against the published harness without any core changes.
 */

import { readFile, opendir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, posix, win32 } from 'node:path'

/** Route prefix shared with the browser half. */
export const ROUTE_PREFIX = '/dsh-codex-select'

/** Hard cap on one read response (bytes). Larger files report tooLarge. */
const MAX_BYTES = 1_048_576

/** Cap on one listing level's materialized rows. */
const MAX_ENTRIES = 2000

/** Cordis plugin name. */
export const name = 'dsh-codex-select'

/** Required service: the harness web server the routes register on. */
export const inject = ['webServer']

/** JSON helper for one response. */
function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(payload)
}

/**
 * True when the path names one fixed filesystem location regardless of
 * process state: POSIX-absolute on POSIX; on Windows only drive-qualified
 * (`C:\…`) or complete UNC (`\\server\share…`) forms.
 */
function fullyQualified(path) {
  return process.platform === 'win32'
    ? win32.isAbsolute(path) && /^(?:[A-Za-z]:[\\/]|[\\/]{2}[^\\/]+[\\/]+[^\\/]+)/.test(path)
    : posix.isAbsolute(path)
}

/** Error message text of an unknown thrown value. */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * List one directory level (directories and files), name-sorted, bounded.
 * @param rawPath - the ?path= value; absent lists the host home directory.
 */
export async function listLevel(rawPath) {
  if (rawPath !== undefined && !fullyQualified(rawPath)) {
    throw new Error(`cannot list "${rawPath}": not a fully qualified path`)
  }
  const target = rawPath === undefined ? undefined : join(rawPath)
  const home = homedir()
  const level = target === undefined ? home : target
  const rows = []
  let truncated = false
  let dir
  try {
    dir = await opendir(level)
  } catch (error) {
    throw new Error(`cannot list ${level}: ${messageOf(error)}`)
  }
  try {
    for await (const dirent of dir) {
      if (rows.length >= MAX_ENTRIES) {
        truncated = true
        break
      }
      const path = join(level, dirent.name)
      let size
      if (dirent.isFile() || dirent.isSymbolicLink()) {
        try {
          const info = await stat(path)
          if (info.isFile()) size = info.size
        } catch { /* broken link: no size */ }
      }
      rows.push({
        name: dirent.name,
        path,
        isDirectory: dirent.isDirectory(),
        hidden: dirent.name.startsWith('.'),
        size,
      })
    }
  } finally {
    await dir.close().catch(() => {})
  }
  rows.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return { path: level, home, entries: rows, truncated }
}

/**
 * Read one file's UTF-8 text, size-capped and binary-rejected.
 * @param rawPath - the ?path= value (fully qualified).
 * @returns { path, content, truncated, tooLarge, binary, bytes }
 */
export async function readTextFile(rawPath) {
  if (rawPath === undefined || !fullyQualified(rawPath)) {
    throw new Error(`cannot read "${rawPath}": not a fully qualified path`)
  }
  const info = await stat(rawPath).catch((error) => {
    throw new Error(`cannot read ${rawPath}: ${messageOf(error)}`)
  })
  if (!info.isFile()) throw new Error(`not a regular file: ${rawPath}`)
  if (info.size > MAX_BYTES) {
    return { path: rawPath, content: null, truncated: true, tooLarge: true, binary: false, bytes: info.size }
  }
  const bytes = await readFile(rawPath)
  if (bytes.includes(0)) {
    return { path: rawPath, content: null, truncated: false, tooLarge: false, binary: true, bytes: bytes.length }
  }
  return { path: rawPath, content: bytes.toString('utf8'), truncated: false, tooLarge: false, binary: false, bytes: bytes.length }
}

/** One handler owning every /dsh-codex-select route. */
export async function handleRoute(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    json(res, 405, { error: 'method-not-allowed' })
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rawPath = url.searchParams.get('path') ?? undefined
  try {
    if (url.pathname === `${ROUTE_PREFIX}/list`) {
      json(res, 200, await listLevel(rawPath))
      return
    }
    if (url.pathname === `${ROUTE_PREFIX}/read`) {
      json(res, 200, await readTextFile(rawPath))
      return
    }
    json(res, 404, { error: `unknown route: ${url.pathname}` })
  } catch (error) {
    json(res, 400, { error: messageOf(error) })
  }
}

/**
 * Plugin body: register the routes for the plugin's lifetime.
 * @param ctx - cordis context carrying the web server service.
 */
export function apply(ctx) {
  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: handleRoute }),
    'dsh-codex-select: routes',
  )
}
