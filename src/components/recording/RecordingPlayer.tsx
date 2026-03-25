import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import type { Recording } from '../../store/store'

interface RecordingPlayerData {
  recording: Recording
  position: { x: number; y: number }
}

function RecordingPlayerNode({ data, selected }: NodeProps & { data: RecordingPlayerData }) {
  const { recording } = data
  const termRef = useRef<HTMLDivElement>(null)
  const termInstanceRef = useRef<Terminal | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventIdxRef = useRef(0)

  // Init terminal
  useEffect(() => {
    if (!termRef.current || termInstanceRef.current) return
    const term = new Terminal({
      cursorBlink: false, fontSize: 10,
      fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.2,
      theme: { background: '#1A1A2E', foreground: '#C8C8D4', cursor: '#534AB7' },
      disableStdin: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(termRef.current)
    setTimeout(() => fit.fit(), 50)
    termInstanceRef.current = term
    return () => { term.dispose(); termInstanceRef.current = null }
  }, [])

  const stopPlayback = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPlaying(false)
  }, [])

  const playNext = useCallback(() => {
    const term = termInstanceRef.current
    if (!term || eventIdxRef.current >= recording.events.length) {
      stopPlayback()
      return
    }
    const ev = recording.events[eventIdxRef.current]
    term.write(ev.data)
    setProgress(ev.ts / Math.max(recording.duration, 1))
    eventIdxRef.current++

    if (eventIdxRef.current < recording.events.length) {
      const nextEv = recording.events[eventIdxRef.current]
      const delay = Math.max(1, (nextEv.ts - ev.ts) / speed)
      timeoutRef.current = setTimeout(playNext, Math.min(delay, 2000))
    } else {
      stopPlayback()
    }
  }, [recording, speed, stopPlayback])

  const handlePlay = useCallback(() => {
    if (playing) { stopPlayback(); return }
    if (eventIdxRef.current >= recording.events.length) {
      eventIdxRef.current = 0
      termInstanceRef.current?.clear()
    }
    setPlaying(true)
    playNext()
  }, [playing, recording, playNext, stopPlayback])

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{
      width: 380, height: 260, backgroundColor: 'var(--bg-card)',
      border: selected ? '2px solid #534AB7' : '1px solid var(--border)',
      boxShadow: '0 2px 8px var(--shadow)',
    }}>
      <Handle type="target" position={Position.Left} style={{ width: 6, height: 6, background: 'var(--text-muted)', border: '1px solid var(--border)' }} />

      <div className="session-drag-handle flex items-center h-7 px-2.5 cursor-grab select-none"
        style={{ backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs mr-1.5">▶</span>
        <span className="text-[10px] font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>Recording: {recording.sessionName}</span>
        <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{formatDuration(recording.duration)}</span>
      </div>

      {/* Terminal replay */}
      <div ref={termRef} style={{ height: 'calc(100% - 56px)', backgroundColor: '#1A1A2E' }} />

      {/* Controls */}
      <div className="flex items-center h-7 px-2.5 gap-2"
        style={{ backgroundColor: 'var(--bg-header)', borderTop: '1px solid var(--border)' }}>
        <button onClick={handlePlay} className="text-[11px] font-mono hover:text-[#534AB7]" style={{ color: 'var(--text-primary)' }}>
          {playing ? '⏸' : '▶'}
        </button>

        {/* Progress bar */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div className="h-full rounded-full bg-[#534AB7] transition-all" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Speed */}
        <button onClick={() => setSpeed(s => s >= 4 ? 1 : s * 2)}
          className="text-[9px] font-mono px-1" style={{ color: 'var(--text-secondary)' }}>
          {speed}x
        </button>

        <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>{recording.events.length} events</span>
      </div>
    </div>
  )
}

export default memo(RecordingPlayerNode)
