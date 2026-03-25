import { useState } from 'react'

interface Props {
  onDrop: (sessionId: string) => void
}

export default function TrashZone({ onDrop }: Props) {
  const [isOver, setIsOver] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)

  return (
    <>
      <div
        className="absolute bottom-4 left-44 z-20"
        onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsOver(false)
          const raw = e.dataTransfer.getData('text/plain')
          if (raw && raw.startsWith('session-')) setConfirm(raw)
        }}
      >
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all
          ${isOver ? 'border-[#E24B4A] bg-[#FCEBEB]' : 'border-theme-border bg-theme-header'}
        `}>
          <span className="text-lg">🗑️</span>
          <div>
            <div className="text-[11px] font-medium text-theme-primary">Trash</div>
            <div className="text-[8px] text-theme-muted">Drag session to delete</div>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setConfirm(null)}>
          <div className="bg-theme-card border border-theme-border rounded-xl p-5 w-72 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium mb-2">Delete session?</h3>
            <p className="text-xs text-theme-secondary mb-4">Files on disk won't be deleted.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirm(null)}
                className="px-3 py-1.5 text-xs font-mono rounded-lg border border-theme-border hover:bg-theme-hover">
                Cancel
              </button>
              <button onClick={() => { onDrop(confirm); setConfirm(null) }}
                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#E24B4A] text-white hover:bg-[#c43a39]">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
