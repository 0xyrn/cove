import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Canvas from './components/canvas/Canvas'
import AgentPanel from './components/agents/AgentPanel'
import SkillShelf from './components/skills/SkillShelf'
import Toolbar from './components/ui/Toolbar'
import NewSessionModal from './components/session/NewSessionModal'
import GitHubZone from './components/zones/GitHubZone'
import TrashZone from './components/zones/TrashZone'
import { useStore } from './store/store'
import { sendToDesk } from './lib/ptyRegistry'

export default function App() {
  const [showNewSession, setShowNewSession] = useState(false)
  const closeSession = useStore(s => s.closeSession)
  const sessions = useStore(s => s.sessions)

  const toggleTheme = useStore(s => s.toggleTheme)
  const saveSnapshot = useStore(s => s.saveSnapshot)
  const addNote = useStore(s => s.addNote)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const inTerminal = (e.target as HTMLElement).closest('.xterm, .session-terminal')
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA'

      // Block non-meta keys in input/textarea/terminal
      if ((inInput || inTerminal) && !e.metaKey) return

      // Cmd+D should not toggle theme when terminal is focused
      if (e.metaKey && e.key === 'd' && inTerminal) return

      if (e.metaKey && e.key === 'n') { e.preventDefault(); setShowNewSession(true) }
      if (e.metaKey && e.key === 's') { e.preventDefault(); saveSnapshot(`Auto ${new Date().toLocaleTimeString()}`) }
      if (e.metaKey && e.key === 'd') { e.preventDefault(); toggleTheme() }
      if (e.key === 'n' && !e.metaKey) { e.preventDefault(); addNote({ x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 }) }
      if (e.key === 'Escape') { setShowNewSession(false) }
      if (e.key === '?') {
        e.preventDefault()
        alert('Keyboard Shortcuts:\n\nCmd+N  New session\nCmd+S  Save snapshot\nCmd+D  Toggle dark/light\nN      New sticky note\nEsc    Close modals\n?      Show shortcuts')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleGithubDrop = useCallback((sessionId: string, mode: 'push' | 'archive') => {
    sendToDesk(sessionId, 'git add -A && git commit -m "push from Agents HQ" && git push\r')
    if (mode === 'archive') {
      setTimeout(() => closeSession(sessionId), 5000)
    }
  }, [closeSession])

  const handleTrashDrop = useCallback((sessionId: string) => {
    closeSession(sessionId)
  }, [closeSession])

  return (
    <div className="h-full flex flex-col">
      <Toolbar onNewSession={() => setShowNewSession(true)} />

      <div className="flex-1 flex overflow-hidden">
        <SkillShelf />

        <div className="flex-1 relative">
          <Canvas onNewSession={() => setShowNewSession(true)} />
          <GitHubZone onDrop={handleGithubDrop} />
          <TrashZone onDrop={handleTrashDrop} />
        </div>

        <AgentPanel />
      </div>

      <AnimatePresence>
        {showNewSession && (
          <NewSessionModal onClose={() => setShowNewSession(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
