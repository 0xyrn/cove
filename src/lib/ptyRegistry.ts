// Global PTY ID registry - maps sessionId to ptyId

const registry = new Map<string, string>()

export function registerPty(deskId: string, ptyId: string) {
  registry.set(deskId, ptyId)
}

export function unregisterPty(deskId: string) {
  registry.delete(deskId)
}

export function getPtyId(deskId: string): string | undefined {
  return registry.get(deskId)
}

export function sendToDesk(deskId: string, command: string) {
  const ptyId = registry.get(deskId)
  if (ptyId && window.pty) {
    window.pty.write(ptyId, command)
    return true
  }
  return false
}
