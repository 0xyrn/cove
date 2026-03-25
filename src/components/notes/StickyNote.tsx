import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore, type StickyNote as NoteType, type NoteColor } from '../../store/store'

const COLOR_MAP: Record<NoteColor, { bg: string; border: string }> = {
  yellow: { bg: '#FAEEDA', border: '#E8D5B0' },
  pink:   { bg: '#FBEAF0', border: '#E8C5D5' },
  blue:   { bg: '#E6F1FB', border: '#B8D4EA' },
  green:  { bg: '#E1F5EE', border: '#B0DCC8' },
  purple: { bg: '#EEEDFE', border: '#C8C4E8' },
  gray:   { bg: '#F1EFE8', border: '#D6D2C8' },
}

const COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'gray']

function StickyNoteNode({ data, selected }: NodeProps & { data: NoteType }) {
  const note = data
  const updateNoteText = useStore(s => s.updateNoteText)
  const updateNoteColor = useStore(s => s.updateNoteColor)
  const removeNote = useStore(s => s.removeNote)
  const [showColors, setShowColors] = useState(false)
  const colors = COLOR_MAP[note.color]

  const time = new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        width: '100%', height: '100%',
        backgroundColor: colors.bg,
        border: selected ? '2px solid #534AB7' : `1px solid ${colors.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <Handle type="source" position={Position.Right} style={{ width: 6, height: 6, background: colors.border, border: 'none' }} />
      <Handle type="target" position={Position.Left} style={{ width: 6, height: 6, background: colors.border, border: 'none' }} />

      {/* Header - drag + color picker + delete */}
      <div className="session-drag-handle flex items-center h-6 px-2 cursor-grab select-none">
        <button onClick={() => setShowColors(!showColors)} className="text-[10px] mr-1 opacity-50 hover:opacity-100">🎨</button>
        <div className="flex-1" />
        <button onClick={() => removeNote(note.id)} className="text-[10px] opacity-30 hover:opacity-100 hover:text-[#E24B4A]">×</button>
      </div>

      {/* Color picker */}
      {showColors && (
        <div className="flex gap-1 px-2 pb-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => { updateNoteColor(note.id, c); setShowColors(false) }}
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: COLOR_MAP[c].bg, borderColor: COLOR_MAP[c].border }}
            />
          ))}
        </div>
      )}

      {/* Text area */}
      <textarea
        value={note.text}
        onChange={(e) => updateNoteText(note.id, e.target.value)}
        placeholder="Write a note..."
        className="w-full px-2.5 text-[11px] leading-relaxed resize-none outline-none"
        style={{
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          height: 'calc(100% - 48px)',
        }}
      />

      {/* Footer */}
      <div className="flex items-center px-2.5 h-5 text-[8px] text-theme-secondary">
        <span>📌 {note.author} · {time}</span>
      </div>
    </div>
  )
}

export default memo(StickyNoteNode)
