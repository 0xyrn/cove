import { useState } from 'react'

interface Props {
  onDrop: (sessionId: string, mode: 'push' | 'archive') => void
}

export default function GitHubZone({ onDrop }: Props) {
  const [isOver, setIsOver] = useState(false)
  const [showChoice, setShowChoice] = useState<string | null>(null)

  return (
    <>
      <div
        className="absolute bottom-4 left-4 z-20"
        onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsOver(false)
          const raw = e.dataTransfer.getData('text/plain')
          // Only accept session drags (not agents/skills)
          if (raw && raw.startsWith('session-')) setShowChoice(raw)
        }}
      >
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all
          ${isOver ? 'border-[#378ADD] bg-[#E6F1FB]' : 'border-theme-border bg-theme-header'}
        `}>
          <span className="text-lg">📦</span>
          <div>
            <div className="text-[11px] font-medium text-theme-primary">GitHub</div>
            <div className="text-[8px] text-theme-muted">Drag session to push</div>
          </div>
        </div>
      </div>

      {/* Choice dialog */}
      {showChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowChoice(null)}>
          <div className="bg-theme-card border border-theme-border rounded-xl p-5 w-72 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium mb-3">Push to GitHub?</h3>
            <div className="flex gap-2">
              <button onClick={() => { onDrop(showChoice, 'push'); setShowChoice(null) }}
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-theme-border hover:bg-theme-hover">
                Just Push
              </button>
              <button onClick={() => { onDrop(showChoice, 'archive'); setShowChoice(null) }}
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-[#378ADD] text-white hover:bg-[#2a6fb0]">
                Push & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
