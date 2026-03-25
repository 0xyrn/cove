import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

const pty = require('node-pty')
const ptyProcesses = new Map<string, any>()

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#FAFAF8',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  win.on('ready-to-show', () => {
    win.show()
    if (is.dev) win.webContents.openDevTools({ mode: 'detach' })
  })

  win.webContents.setWindowOpenHandler(d => { shell.openExternal(d.url); return { action: 'deny' } })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── PTY ──
ipcMain.handle('pty:create', (_e, { id, cwd, cols, rows }) => {
  // macOS Electron doesn't inherit login shell env — need full PATH
  const fullPath = [
    process.env.HOME + '/.local/bin',
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    process.env.PATH || '',
  ].join(':')

  // Always spawn login shell — claude gets launched from renderer via pty:write
  const shellCwd = cwd || process.env.HOME || app.getPath('home')
  // PTY limit
  if (ptyProcesses.size >= 8) {
    console.log(`[PTY] Limit reached (${ptyProcesses.size}/8), rejecting spawn`)
    return { error: 'max_sessions', pid: -1 }
  }

  // Prevent duplicate spawn with same ID
  if (ptyProcesses.has(id)) {
    console.log(`[PTY] Already exists id=${id}, reusing`)
    return { pid: ptyProcesses.get(id).pid }
  }

  if (!existsSync(shellCwd)) {
    console.log(`[PTY] cwd not found: ${shellCwd}`)
    return { error: 'path_not_found', pid: -1 }
  }

  console.log(`[PTY] Spawning shell id=${id} cwd=${shellCwd}`)

  let p: any
  try {
    p = pty.spawn('/bin/zsh', ['-l'], {
      name: 'xterm-256color',
      cols: Math.max(40, cols || 80),
      rows: Math.max(10, rows || 30),
      cwd: shellCwd,
      env: {
        ...process.env,
        PATH: fullPath,
        HOME: process.env.HOME || app.getPath('home'),
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
      },
    })
  } catch (err: any) {
    console.error(`[PTY] Spawn failed:`, err.message)
    return { error: err.message, pid: -1 }
  }

  console.log(`[PTY] Spawned pid=${p.pid}`)
  ptyProcesses.set(id, p)
  p.onData((data: string) => {
    BrowserWindow.getAllWindows()[0]?.webContents.send(`pty:data:${id}`, data)
  })
  p.onExit(({ exitCode }: { exitCode: number }) => {
    console.log(`[PTY] Exit id=${id} code=${exitCode}`)
    BrowserWindow.getAllWindows()[0]?.webContents.send(`pty:exit:${id}`, exitCode)
    ptyProcesses.delete(id)
  })
  return { pid: p.pid }
})

ipcMain.on('pty:write', (_e, { id, data }) => {
  if (!ptyProcesses.has(id)) {
    console.warn(`[PTY] write to unknown id=${id}`)
    return
  }
  ptyProcesses.get(id).write(data)
})
ipcMain.on('pty:resize', (_e, { id, cols, rows }) => ptyProcesses.get(id)?.resize(cols, rows))
ipcMain.on('pty:kill', (_e, { id }) => {
  const p = ptyProcesses.get(id)
  if (!p) return
  p.write('\x03')
  setTimeout(() => { try { p.kill() } catch {} }, 500)
  ptyProcesses.delete(id)
})

// ── MCP CONFIG ──
ipcMain.handle('mcp:writeConfig', (_e, { sessionId, configJson }) => {
  try {
    JSON.parse(configJson)
  } catch {
    console.error(`[MCP] Invalid JSON for session=${sessionId}`)
    return { error: 'invalid_json' }
  }
  const dir = join(app.getPath('temp'), 'cove-mcp')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const path = join(dir, `${sessionId}.json`)
  writeFileSync(path, configJson, 'utf-8')
  return path
})

// ── APP INFO ──
ipcMain.handle('app:homePath', () => app.getPath('home'))

// ── CLAUDE PROJECTS ──
ipcMain.handle('claude:getProjects', () => {
  const home = app.getPath('home')
  const projectMap = new Map<string, { name: string; path: string; lastUsed: number }>()

  // 1. Read from ~/.claude/history.jsonl (most reliable - has real paths)
  const historyFile = join(home, '.claude', 'history.jsonl')
  if (existsSync(historyFile)) {
    try {
      const lines = readFileSync(historyFile, 'utf-8').split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const d = JSON.parse(line)
          const proj = d.project
          const ts = d.timestamp || 0
          if (proj && proj !== home && existsSync(proj)) {
            const existing = projectMap.get(proj)
            if (!existing || ts > existing.lastUsed) {
              const name = proj.split('/').filter(Boolean).pop() || proj
              projectMap.set(proj, { name, path: proj, lastUsed: ts })
            }
          }
        } catch {}
      }
    } catch {}
  }

  // 2. Scan home directory for projects (has .git or package.json)
  try {
    const homeDirs = readdirSync(home)
    for (const dir of homeDirs) {
      if (dir.startsWith('.') || dir === 'node_modules' || dir === 'Library' || dir === 'Applications') continue
      const fullPath = join(home, dir)
      try {
        const hasGit = existsSync(join(fullPath, '.git'))
        const hasPkg = existsSync(join(fullPath, 'package.json'))
        const hasPy = existsSync(join(fullPath, 'pyproject.toml')) || existsSync(join(fullPath, 'requirements.txt'))
        if (hasGit || hasPkg || hasPy) {
          if (!projectMap.has(fullPath)) {
            projectMap.set(fullPath, { name: dir, path: fullPath, lastUsed: 0 })
          }
        }
      } catch {}
    }
  } catch {}

  // Sort by lastUsed descending
  return Array.from(projectMap.values())
    .sort((a, b) => b.lastUsed - a.lastUsed)
})

// ── CONNECTIONS SYNC ──
ipcMain.handle('connections:sync', (_e, { projects }) => {
  // projects = [{ path: '/path/to/project', connectedTo: [{ name: 'other', path: '/other/path' }] }]
  for (const project of projects) {
    const claudeDir = join(project.path, '.claude')
    if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true })

    const content = `# Connected Projects\n\n` +
      `This project is connected to the following projects in Cove:\n\n` +
      project.connectedTo.map((c: any) => `- **${c.name}** — \`${c.path}\``).join('\n') +
      `\n\nThese projects share context. When working on this project, consider the related projects above.\n`

    writeFileSync(join(claudeDir, 'connected-projects.md'), content, 'utf-8')
  }
  return { ok: true }
})

// ── WINDOW ──
ipcMain.on('win:minimize', () => BrowserWindow.getAllWindows()[0]?.minimize())
ipcMain.on('win:maximize', () => {
  const w = BrowserWindow.getAllWindows()[0]
  w?.isMaximized() ? w.unmaximize() : w?.maximize()
})
ipcMain.on('win:close', () => BrowserWindow.getAllWindows()[0]?.close())

// ── LIFECYCLE ──
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.cove-workspace')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('before-quit', () => {
  ptyProcesses.forEach(p => { try { p.kill() } catch {} })
  ptyProcesses.clear()
})

app.on('window-all-closed', () => {
  ptyProcesses.forEach(p => p.kill())
  ptyProcesses.clear()
  if (process.platform !== 'darwin') app.quit()
})
