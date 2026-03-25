import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store/store'

export interface TimelineEvent {
  id: string
  sessionId: string
  type: 'agent_join' | 'agent_leave' | 'tool_connect' | 'file_change' | 'test' | 'git' | 'error' | 'preview'
  title: string
  timestamp: string
}

interface TimelineData {
  id: string
  sessionId: string
  sessionName: string
  position: { x: number; y: number }
}

const EVENT_ICONS: Record<string, string> = {
  agent_join: '👤',
  agent_leave: '👤',
  tool_connect: '🔧',
  file_change: '📝',
  test: '✅',
  git: '📦',
  error: '❌',
  preview: '🌐',
}

function TimelineCardNode({ data, selected }: NodeProps & { data: TimelineData }) {
  const notifications = useStore(s => s.notifications)

  // Filter notifications for this session as timeline events
  const events = notifications
    .filter(n => n.sessionId === data.sessionId)
    .slice(0, 15)

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        width: 220, height: 280,
        backgroundColor: 'var(--bg-card)',
        border: selected ? '2px solid #534AB7' : '1px solid var(--border)',
        boxShadow: '0 2px 8px var(--shadow)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ width: 6, height: 6, background: 'var(--text-muted)', border: '1px solid var(--border)' }} />

      <div className="session-drag-handle flex items-center h-7 px-2.5 cursor-grab select-none"
        style={{ backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs mr-1.5">📅</span>
        <span className="text-[10px] font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>Timeline: {data.sessionName}</span>
      </div>

      <div className="overflow-y-auto" style={{ height: 'calc(100% - 28px)' }}>
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px]" style={{ color: 'var(--text-muted)' }}>No events yet</div>
        ) : (
          <div className="px-2 py-1.5 space-y-0.5">
            {events.map(ev => {
              const icon = ev.type === 'success' ? '✅' : ev.type === 'error' ? '❌' : ev.type === 'tool' ? '🔧' : ev.type === 'git' ? '📦' : '📋'
              return (
                <div key={ev.id} className="flex items-start gap-1.5 py-0.5">
                  <span className="text-[8px] font-mono shrink-0 mt-0.5 w-8" style={{ color: 'var(--text-muted)' }}>{formatTime(ev.timestamp)}</span>
                  <span className="text-[8px]">{icon}</span>
                  <span className="text-[9px] leading-tight" style={{ color: 'var(--text-primary)' }}>{ev.title}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TimelineCardNode)
