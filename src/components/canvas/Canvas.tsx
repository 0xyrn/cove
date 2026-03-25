import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../../store/store'
import SessionCard from '../session/SessionCard'
import PreviewCard from '../preview/PreviewCard'
import StickyNote from '../notes/StickyNote'
import TimelineCard from '../timeline/TimelineCard'
import RecordingPlayer from '../recording/RecordingPlayer'

interface Props {
  onNewSession: () => void
}

const nodeTypes = { session: SessionCard, preview: PreviewCard, note: StickyNote, timeline: TimelineCard, recording: RecordingPlayer }

// Wrapper that provides ReactFlowProvider context
export default function Canvas({ onNewSession }: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner onNewSession={onNewSession} />
    </ReactFlowProvider>
  )
}

function CanvasInner({ onNewSession }: Props) {
  const sessions = useStore(s => s.sessions)
  const previews = useStore(s => s.previews)
  const notes = useStore(s => s.notes)
  const timelines = useStore(s => s.timelines)
  const recordings = useStore(s => s.recordings)
  const connections = useStore(s => s.connections)
  const updateSessionPosition = useStore(s => s.updateSessionPosition)
  const addConnection = useStore(s => s.addConnection)
  const addNote = useStore(s => s.addNote)
  const { fitView, setCenter } = useReactFlow()

  const nodes: Node[] = useMemo(() => {
    const sessionNodes = Object.values(sessions).map(s => ({
      id: s.id, type: 'session' as const, position: s.position, data: s,
      width: s.minimized ? 160 : s.size.width, height: s.minimized ? 36 : s.size.height,
      style: { width: s.minimized ? 160 : s.size.width, height: s.minimized ? 36 : s.size.height },
      dragHandle: '.session-drag-handle',
    }))
    const previewNodes = Object.values(previews).map(p => ({
      id: p.id, type: 'preview' as const, position: p.position, data: p,
      width: p.size.width, height: p.size.height,
      style: { width: p.size.width, height: p.size.height },
      dragHandle: '.session-drag-handle',
    }))
    const noteNodes = Object.values(notes).map(n => ({
      id: n.id, type: 'note' as const, position: n.position, data: n,
      width: n.size.width, height: n.size.height,
      style: { width: n.size.width, height: n.size.height },
      dragHandle: '.session-drag-handle',
    }))
    const timelineNodes = Object.values(timelines).map(t => ({
      id: t.id, type: 'timeline' as const, position: t.position, data: t,
      width: 220, height: 280, style: { width: 220, height: 280 },
      dragHandle: '.session-drag-handle',
    }))
    const recordingNodes = Object.values(recordings).filter(r => r.events.length > 0).map(r => {
      const session = sessions[r.sessionId]
      return {
        id: r.id, type: 'recording' as const,
        position: session ? { x: session.position.x, y: session.position.y + session.size.height + 40 } : { x: 0, y: 0 },
        data: { recording: r, position: { x: 0, y: 0 } },
        width: 380, height: 260, style: { width: 380, height: 260 },
        dragHandle: '.session-drag-handle',
      }
    })
    return [...sessionNodes, ...previewNodes, ...noteNodes, ...timelineNodes, ...recordingNodes]
  }, [sessions, previews, notes, timelines, recordings])

  const edges: Edge[] = useMemo(() =>
    connections.map(c => {
      const preview = previews[c.target]
      const isSessionToSession = !preview && sessions[c.source] && sessions[c.target]
      const color = preview
        ? preview.type === 'web' ? '#4EC9B0' : preview.type === 'mobile' ? '#378ADD' : '#BA7517'
        : '#D3D1C7'
      return {
        id: c.id, source: c.source, target: c.target, type: 'default',
        style: { stroke: color, strokeWidth: 1.5, opacity: 0.5 },
        animated: !!preview && preview.status === 'live',
        ...(preview ? {
          label: preview.type,
          labelStyle: { fontSize: 9, fill: color, fontWeight: 500 },
          labelBgStyle: { fill: 'var(--bg-canvas)', fillOpacity: 0.85 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 3,
        } : {}),
        ...(isSessionToSession ? {
          label: 'connected',
          labelStyle: { fontSize: 9, fill: '#8A857A', fontWeight: 500 },
          labelBgStyle: { fill: 'var(--bg-canvas)', fillOpacity: 0.85 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 3,
        } : {}),
      }
    }),
  [connections, previews])

  const onNodesChange = useCallback((changes: any[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        updateSessionPosition(change.id, change.position)
      }
    })
  }, [updateSessionPosition])

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) addConnection(params.source, params.target)
  }, [addConnection])

  const onPaneDoubleClick = useCallback(() => onNewSession(), [onNewSession])

  // Cmd+0 → fit all
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '0') { e.preventDefault(); fitView({ padding: 0.2, duration: 300 }) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fitView])

  // focus-session → scroll to session
  useEffect(() => {
    const h = (e: Event) => {
      const { sessionId } = (e as CustomEvent).detail
      const s = useStore.getState().sessions[sessionId]
      if (!s) return
      setCenter(s.position.x + s.size.width / 2, s.position.y + s.size.height / 2, { zoom: 1.2, duration: 500 })
    }
    window.addEventListener('focus-session', h)
    window.addEventListener('agent-assigned', h)
    return () => { window.removeEventListener('focus-session', h); window.removeEventListener('agent-assigned', h) }
  }, [setCenter])

  return (
    <ReactFlow
      nodes={nodes} edges={edges} nodeTypes={nodeTypes}
      onNodesChange={onNodesChange} onConnect={onConnect}
      onPaneClick={() => {}} onDoubleClick={onPaneDoubleClick}
      onPaneContextMenu={(e: any) => e.preventDefault()}
      fitView snapToGrid snapGrid={[20, 20]}
      defaultEdgeOptions={{ type: 'default', style: { stroke: '#D3D1C7', strokeWidth: 1.5 } }}
      proOptions={{ hideAttribution: true }}
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--grid-dot)" />
      <Controls position="bottom-left" />
      <MiniMap
        position="bottom-right"
        style={{ width: 120, height: 80, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-canvas)' }}
        nodeColor={(n) => {
          if (previews[n.id]) return previews[n.id].type === 'web' ? '#4EC9B0' : previews[n.id].type === 'mobile' ? '#378ADD' : '#BA7517'
          if (sessions[n.id]) return sessions[n.id].status === 'active' ? '#534AB7' : '#B4B2A9'
          if (notes[n.id]) return '#FAEEDA'
          return '#E5E3DD'
        }}
        maskColor="rgba(250,250,248,0.6)" pannable zoomable
      />
    </ReactFlow>
  )
}
