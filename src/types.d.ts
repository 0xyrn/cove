export {}
declare global {
  interface Window {
    pty: {
      create: (opts: { id: string; cwd: string; cols?: number; rows?: number }) => Promise<{ pid: number }>
      write: (id: string, data: string) => void
      resize: (id: string, cols: number, rows: number) => void
      kill: (id: string) => void
      onData: (id: string, cb: (d: string) => void) => () => void
      onExit: (id: string, cb: (code: number) => void) => () => void
    }
    appInfo: {
      homePath: () => Promise<string>
      getClaudeProjects: () => Promise<{ name: string; path: string; lastUsed: number }[]>
    }
    mcp: {
      writeConfig: (sessionId: string, configJson: string) => Promise<string>
    }
    connections: {
      sync: (projects: { path: string; connectedTo: { name: string; path: string }[] }[]) => Promise<{ ok: boolean }>
    }
    winCtl: { minimize: () => void; maximize: () => void; close: () => void }
  }
}
