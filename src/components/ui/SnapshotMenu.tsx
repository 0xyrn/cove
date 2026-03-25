import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/store'

export default function SnapshotMenu() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const snapshots = useStore(s => s.snapshots)
  const saveSnapshot = useStore(s => s.saveSnapshot)
  const loadSnapshot = useStore(s => s.loadSnapshot)
  const deleteSnapshot = useStore(s => s.deleteSnapshot)

  const handleSave = () => {
    if (!name.trim()) return
    saveSnapshot(name.trim())
    setName('')
    setSaving(false)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="titlebar-no-drag flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-theme-secondary hover:bg-theme-hover transition-colors">
        📸 Snapshots
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="absolute right-0 top-8 z-40 w-64 bg-theme-card border border-theme-border rounded-xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border">
                <span className="text-[11px] font-medium">Snapshots</span>
                <button onClick={() => setSaving(!saving)} className="text-[9px] text-[#534AB7] hover:underline">
                  + Save
                </button>
              </div>

              {saving && (
                <div className="px-3 py-2 border-b border-theme-border flex gap-1.5">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Snapshot name"
                    autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()}
                    className="flex-1 text-[10px] font-mono px-2 py-1 rounded border border-theme-border outline-none focus:border-[#534AB7] bg-theme-card text-theme-primary" />
                  <button onClick={handleSave} className="text-[9px] px-2 py-1 rounded bg-[#534AB7] text-white">Save</button>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto">
                {snapshots.length === 0 ? (
                  <div className="py-6 text-center text-[10px] text-theme-muted">No snapshots</div>
                ) : snapshots.map(snap => (
                  <div key={snap.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-theme-canvas group">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { loadSnapshot(snap.id); setOpen(false) }}>
                      <div className="text-[10px] font-medium text-theme-primary truncate">{snap.name}</div>
                      <div className="text-[8px] text-theme-muted">{formatTime(snap.timestamp)} · {snap.cardCount} cards</div>
                    </div>
                    <button onClick={() => deleteSnapshot(snap.id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-theme-muted hover:text-[#E24B4A]">×</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
