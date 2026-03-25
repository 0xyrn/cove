import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store/store'

interface Props {
  onClose: () => void
}

interface ClaudeProject {
  name: string; path: string; lastUsed: number
}

export default function NewSessionModal({ onClose }: Props) {
  const [tab, setTab] = useState<'projects' | 'new'>('projects')
  const [name, setName] = useState('')
  const [path, setPath] = useState('/Users/yarensmac/')
  const [projects, setProjects] = useState<ClaudeProject[]>([])
  const [loading, setLoading] = useState(true)
  const [pathWarning, setPathWarning] = useState('')
  const createSession = useStore(s => s.createSession)

  useEffect(() => {
    if (window.appInfo?.getClaudeProjects) {
      window.appInfo.getClaudeProjects().then(p => { setProjects(p); setLoading(false) }).catch(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const handleCreate = (n: string, p: string) => {
    createSession(n, p)
    onClose()
  }

  const formatTime = (ts: number) => {
    if (!ts) return ''
    const diff = Date.now() - ts
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-theme-card border border-theme-border rounded-xl shadow-lg w-[420px] overflow-hidden"
      >
        <div className="flex border-b border-theme-border">
          <button onClick={() => setTab('projects')}
            className={`flex-1 px-4 py-2.5 text-[11px] font-mono ${tab === 'projects' ? 'text-[#534AB7] border-b-2 border-[#534AB7]' : 'text-theme-secondary'}`}>
            Claude Projects
          </button>
          <button onClick={() => setTab('new')}
            className={`flex-1 px-4 py-2.5 text-[11px] font-mono ${tab === 'new' ? 'text-[#534AB7] border-b-2 border-[#534AB7]' : 'text-theme-secondary'}`}>
            + New
          </button>
        </div>

        <div className="p-4">
          {tab === 'projects' && (
            loading ? <div className="text-center py-8 text-theme-muted text-xs font-mono">Loading...</div> :
            projects.length > 0 ? (
              <div className="space-y-0.5 max-h-72 overflow-y-auto">
                {projects.map((p, i) => (
                  <button key={p.path} onClick={() => handleCreate(p.name, p.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-theme-canvas transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-theme-primary truncate">{p.name}</div>
                      <div className="text-[8px] font-mono text-theme-muted truncate">{p.path}</div>
                    </div>
                    {p.lastUsed > 0 && <span className="text-[8px] font-mono text-theme-muted">{formatTime(p.lastUsed)}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-theme-muted text-xs mb-2">No Claude projects found</div>
                <button onClick={() => setTab('new')} className="text-[11px] text-[#534AB7] hover:underline">Create new →</button>
              </div>
            )
          )}

          {tab === 'new' && (
            <form onSubmit={e => {
              e.preventDefault()
              if (!name || !path) return
              if (!path.startsWith('/')) {
                setPathWarning('Path should be absolute (start with /)')
              } else {
                setPathWarning('')
              }
              handleCreate(name, path)
            }}>
              <label className="block mb-3">
                <span className="text-[10px] font-mono text-theme-secondary block mb-1">PROJECT NAME</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Project" autoFocus
                  className="w-full px-3 py-1.5 rounded-lg bg-theme-canvas border border-theme-border text-xs font-mono text-theme-primary outline-none focus:border-[#534AB7]" />
              </label>
              <label className="block mb-4">
                <span className="text-[10px] font-mono text-theme-secondary block mb-1">FOLDER PATH</span>
                <input type="text" value={path} onChange={e => { setPath(e.target.value); setPathWarning('') }} placeholder="/path/to/project"
                  className="w-full px-3 py-1.5 rounded-lg bg-theme-canvas border border-theme-border text-xs font-mono text-theme-primary outline-none focus:border-[#534AB7]" />
                {pathWarning && <span className="text-[9px] text-[#BA7517] mt-0.5 block">{pathWarning}</span>}
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={onClose} className="px-3 py-1 text-xs text-theme-secondary rounded-lg hover:bg-theme-canvas">Cancel</button>
                <button type="submit" disabled={!name || !path} className="px-4 py-1.5 text-xs text-white rounded-lg bg-[#534AB7] hover:bg-[#4339A0] disabled:opacity-30">
                  Create Session
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
