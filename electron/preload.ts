import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('pty', {
  create: (opts: { id: string; cwd: string; cols?: number; rows?: number }) =>
    ipcRenderer.invoke('pty:create', opts),
  write: (id: string, data: string) => ipcRenderer.send('pty:write', { id, data }),
  resize: (id: string, cols: number, rows: number) => ipcRenderer.send('pty:resize', { id, cols, rows }),
  kill: (id: string) => ipcRenderer.send('pty:kill', { id }),
  onData: (id: string, cb: (d: string) => void) => {
    const h = (_: any, d: string) => cb(d)
    ipcRenderer.on(`pty:data:${id}`, h)
    return () => ipcRenderer.removeListener(`pty:data:${id}`, h)
  },
  onExit: (id: string, cb: (code: number) => void) => {
    const h = (_: any, c: number) => cb(c)
    ipcRenderer.on(`pty:exit:${id}`, h)
    return () => ipcRenderer.removeListener(`pty:exit:${id}`, h)
  },
})

contextBridge.exposeInMainWorld('appInfo', {
  homePath: () => ipcRenderer.invoke('app:homePath'),
  getClaudeProjects: () => ipcRenderer.invoke('claude:getProjects'),
})

contextBridge.exposeInMainWorld('mcp', {
  writeConfig: (sessionId: string, configJson: string) =>
    ipcRenderer.invoke('mcp:writeConfig', { sessionId, configJson }),
})

contextBridge.exposeInMainWorld('connections', {
  sync: (projects: any[]) => ipcRenderer.invoke('connections:sync', { projects }),
})

contextBridge.exposeInMainWorld('winCtl', {
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),
})
