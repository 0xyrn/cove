import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AGENTS } from '../data/agents'

// ── Types ──

export interface SessionCard {
  id: string
  name: string
  folderPath: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  status: 'empty' | 'active' | 'working' | 'error'
  assignedAgents: string[]
  activeAgentTab: string | null
  skills: string[]
  minimized: boolean
}

export interface Preview {
  id: string
  sessionId: string
  type: 'web' | 'mobile' | 'api'
  port: number | null
  url: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  status: 'live' | 'offline' | 'loading'
  deviceFrame?: 'iphone' | 'android'
  lastResponse?: {
    method: string
    path: string
    statusCode: number
    body: string
    time: number
    size: number
  }
}

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'gray'

export interface StickyNote {
  id: string
  text: string
  color: NoteColor
  position: { x: number; y: number }
  size: { width: number; height: number }
  author: string
  createdAt: string
}

export interface TokenUsage {
  daily: { input: number; output: number; cost: number }
  perSession: Record<string, { input: number; output: number; cost: number }>
  budget: { daily: number }
}

export interface Recording {
  id: string
  sessionId: string
  sessionName: string
  startTime: string
  events: Array<{ ts: number; data: string }>
  duration: number
}

export interface Snapshot {
  id: string
  name: string
  timestamp: string
  cardCount: number
  data: string // JSON serialized canvas state
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'git' | 'tool' | 'system'
  title: string
  message: string
  sessionId: string | null
  timestamp: string
  read: boolean
}

export interface Agent {
  id: string
  name: string
  role: string
  color: string
  letter: string
  skills: string[]
  assignedSessions: string[]  // can work on multiple sessions
}

export interface Connection {
  id: string
  source: string
  target: string
}

export interface HQStore {
  sessions: Record<string, SessionCard>
  agents: Record<string, Agent>
  previews: Record<string, Preview>
  notes: Record<string, StickyNote>
  notifications: Notification[]
  tokenUsage: TokenUsage
  timelines: Record<string, { id: string; sessionId: string; sessionName: string; position: { x: number; y: number } }>
  recordings: Record<string, Recording>
  snapshots: Snapshot[]
  theme: 'light' | 'dark'
  connections: Connection[]

  // Actions: Sessions
  createSession: (name: string, folderPath: string, position?: { x: number; y: number }) => string
  closeSession: (id: string) => void
  updateSessionPosition: (id: string, pos: { x: number; y: number }) => void
  updateSessionSize: (id: string, size: { width: number; height: number }) => void
  minimizeSession: (id: string) => void

  // Actions: Agents
  assignAgent: (agentId: string, sessionId: string) => void
  removeAgent: (agentId: string) => void

  // Actions: Skills
  addSkillToSession: (skillId: string, sessionId: string) => void
  removeSkillFromSession: (skillId: string, sessionId: string) => void

  // Actions: Previews
  addPreview: (sessionId: string, type: 'web' | 'mobile' | 'api', port?: number) => string
  removePreview: (id: string) => void
  updatePreviewStatus: (id: string, status: 'live' | 'offline' | 'loading') => void
  updatePreviewResponse: (id: string, response: Preview['lastResponse']) => void

  // Actions: Notes
  addNote: (position: { x: number; y: number }, color?: NoteColor) => string
  updateNoteText: (id: string, text: string) => void
  updateNoteColor: (id: string, color: NoteColor) => void
  removeNote: (id: string) => void

  // Actions: Token tracking
  addTokenUsage: (sessionId: string, input: number, output: number, costOverride?: number) => void

  // Actions: Notifications
  addNotification: (type: Notification['type'], title: string, message: string, sessionId?: string) => void
  markNotificationRead: (id: string) => void
  markAllRead: () => void
  clearNotifications: () => void

  // Actions: Timelines
  addTimeline: (sessionId: string) => void

  // Actions: Recordings
  startRecording: (sessionId: string) => string
  appendRecordingEvent: (recordingId: string, data: string) => void
  stopRecording: (recordingId: string) => void

  // Actions: Theme
  toggleTheme: () => void

  // Actions: Snapshots
  saveSnapshot: (name: string) => void
  loadSnapshot: (id: string) => void
  deleteSnapshot: (id: string) => void

  // Actions: Connections
  addConnection: (source: string, target: string) => void
  removeConnection: (id: string) => void
}

// Build initial agents
function buildAgents(): Record<string, Agent> {
  const map: Record<string, Agent> = {}
  AGENTS.forEach(def => {
    map[def.id] = {
      id: def.id,
      name: def.name,
      role: def.role,
      color: def.color,
      letter: def.name[0],
      skills: [],
      assignedSessions: [],
    }
  })
  return map
}

export const useStore = create<HQStore>()(persist((set, get) => ({
  sessions: {},
  agents: buildAgents(),
  previews: {},
  notes: {},
  notifications: [],
  tokenUsage: { daily: { input: 0, output: 0, cost: 0 }, perSession: {}, budget: { daily: 50 } },
  timelines: {},
  recordings: {},
  snapshots: [],
  theme: 'light' as const,
  connections: [],

  createSession: (name, folderPath, position) => {
    const id = `session-${Date.now()}`
    set(s => ({
      sessions: {
        ...s.sessions,
        [id]: {
          id, name, folderPath,
          position: position || { x: Math.random() * 400, y: Math.random() * 300 },
          size: { width: 480, height: 320 },
          status: 'empty',
          assignedAgents: [],
          activeAgentTab: null,
          skills: [],
          minimized: false,
        },
      },
    }))
    return id
  },

  closeSession: (id) => set(s => {
    // Free agents
    const session = s.sessions[id]
    if (!session) return s
    const agents = { ...s.agents }
    session.assignedAgents.forEach(aid => {
      if (agents[aid]) agents[aid] = { ...agents[aid], assignedSessions: agents[aid].assignedSessions.filter(s => s !== id) }
    })
    const { [id]: _, ...rest } = s.sessions
    return {
      sessions: rest,
      agents,
      connections: s.connections.filter(c => c.source !== id && c.target !== id),
    }
  }),

  updateSessionPosition: (id, pos) => set(s => ({
    sessions: { ...s.sessions, [id]: { ...s.sessions[id], position: pos } },
  })),

  updateSessionSize: (id, size) => set(s => ({
    sessions: { ...s.sessions, [id]: { ...s.sessions[id], size } },
  })),

  minimizeSession: (id) => set(s => ({
    sessions: { ...s.sessions, [id]: { ...s.sessions[id], minimized: !s.sessions[id].minimized } },
  })),

  assignAgent: (agentId, sessionId) => {
    const s = get()
    const session = s.sessions[sessionId]
    const agent = s.agents[agentId]
    if (!session || !agent) return
    if (session.assignedAgents.length >= 3) return
    if (session.assignedAgents.includes(agentId)) return // already on this card

    const mergedSkills = [...new Set([...session.skills, ...agent.skills])]

    set({
      sessions: {
        ...s.sessions,
        [sessionId]: {
          ...session,
          assignedAgents: [...session.assignedAgents, agentId],
          activeAgentTab: session.activeAgentTab || agentId,
          skills: mergedSkills,
          status: 'active',
        },
      },
      agents: {
        ...s.agents,
        [agentId]: { ...agent, assignedSessions: [...new Set([...agent.assignedSessions, sessionId])] },
      },
    })

    // Notify canvas to auto-focus the assigned session card
    window.dispatchEvent(new CustomEvent('agent-assigned', { detail: { sessionId } }))
  },

  removeAgent: (agentId) => set(s => {
    const agent = s.agents[agentId]
    if (!agent || agent.assignedSessions.length === 0) return s
    // Remove from all sessions
    const sessions = { ...s.sessions }
    agent.assignedSessions.forEach(sid => {
      if (sessions[sid]) {
        const remaining = sessions[sid].assignedAgents.filter(a => a !== agentId)
        sessions[sid] = { ...sessions[sid], assignedAgents: remaining, status: remaining.length ? 'active' : 'empty' }
      }
    })
    return {
      agents: { ...s.agents, [agentId]: { ...agent, assignedSessions: [] } },
      sessions,
    }
  }),

  addSkillToSession: (skillId, sessionId) => set(s => {
    const session = s.sessions[sessionId]
    if (!session || session.skills.includes(skillId)) return s
    return { sessions: { ...s.sessions, [sessionId]: { ...session, skills: [...session.skills, skillId] } } }
  }),

  removeSkillFromSession: (skillId, sessionId) => set(s => {
    const session = s.sessions[sessionId]
    if (!session) return s
    return { sessions: { ...s.sessions, [sessionId]: { ...session, skills: session.skills.filter(sk => sk !== skillId) } } }
  }),

  // ── Previews ──
  addPreview: (sessionId, type, port) => {
    const id = `preview-${Date.now()}`
    const s = get()
    const session = s.sessions[sessionId]
    if (!session) return id
    // Position to the right of session card, stagger if multiple previews
    const existingPreviews = Object.values(s.previews).filter(p => p.sessionId === sessionId).length
    const pos = { x: session.position.x + session.size.width + 40, y: session.position.y + existingPreviews * 250 }
    const sizes = { web: { width: 280, height: 220 }, mobile: { width: 180, height: 340 }, api: { width: 260, height: 200 } }
    set({
      previews: {
        ...s.previews,
        [id]: {
          id, sessionId, type,
          port: port || null,
          url: port ? `http://localhost:${port}` : '',
          position: pos,
          size: sizes[type],
          status: port ? 'loading' : 'offline',
        },
      },
      // Auto-connect session to preview
      connections: [...s.connections, { id: `conn-${Date.now()}`, source: sessionId, target: id }],
    })
    return id
  },

  removePreview: (id) => set(s => {
    const { [id]: _, ...rest } = s.previews
    return { previews: rest, connections: s.connections.filter(c => c.source !== id && c.target !== id) }
  }),

  updatePreviewStatus: (id, status) => set(s => ({
    previews: { ...s.previews, [id]: { ...s.previews[id], status } },
  })),

  updatePreviewResponse: (id, response) => set(s => ({
    previews: { ...s.previews, [id]: { ...s.previews[id], lastResponse: response } },
  })),

  // ── Timelines ──
  addTimeline: (sessionId) => {
    const s = get()
    const session = s.sessions[sessionId]
    if (!session) return
    const id = `timeline-${Date.now()}`
    set({
      timelines: {
        ...s.timelines,
        [id]: { id, sessionId, sessionName: session.name, position: { x: session.position.x, y: session.position.y + session.size.height + 40 } },
      },
      connections: [...s.connections, { id: `conn-${Date.now()}`, source: sessionId, target: id }],
    })
  },

  // ── Theme ──
  toggleTheme: () => set(s => {
    const next = s.theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    return { theme: next }
  }),

  // ── Snapshots ──
  saveSnapshot: (name) => {
    const s = get()
    const snapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      name,
      timestamp: new Date().toISOString(),
      cardCount: Object.keys(s.sessions).length,
      data: JSON.stringify({ sessions: s.sessions, notes: s.notes, connections: s.connections, previews: s.previews }),
    }
    set({ snapshots: [snapshot, ...s.snapshots].slice(0, 50) })
  },

  loadSnapshot: (id) => {
    const s = get()
    const snap = s.snapshots.find(sn => sn.id === id)
    if (!snap) return
    try {
      const data = JSON.parse(snap.data)
      set({ sessions: data.sessions || {}, notes: data.notes || {}, connections: data.connections || [], previews: data.previews || {} })
    } catch (e) { console.error('[Snapshot] Failed to load:', e) }
  },

  deleteSnapshot: (id) => set(s => ({
    snapshots: s.snapshots.filter(sn => sn.id !== id),
  })),

  // ── Recordings ──
  startRecording: (sessionId) => {
    const s = get()
    const session = s.sessions[sessionId]
    const id = `rec-${Date.now()}`
    set({
      recordings: {
        ...s.recordings,
        [id]: { id, sessionId, sessionName: session?.name || sessionId, startTime: new Date().toISOString(), events: [], duration: 0 },
      },
    })
    return id
  },

  appendRecordingEvent: (recordingId, data) => set(s => {
    const rec = s.recordings[recordingId]
    if (!rec) return s
    if (rec.events.length >= 10000) return s // cap at 10K events
    const ts = Date.now() - new Date(rec.startTime).getTime()
    return {
      recordings: {
        ...s.recordings,
        [recordingId]: { ...rec, events: [...rec.events, { ts, data }], duration: ts },
      },
    }
  }),

  stopRecording: (recordingId) => set(s => {
    const rec = s.recordings[recordingId]
    if (!rec) return s
    const duration = Date.now() - new Date(rec.startTime).getTime()
    return {
      recordings: { ...s.recordings, [recordingId]: { ...rec, duration } },
    }
  }),

  // ── Token tracking ──
  addTokenUsage: (sessionId, input, output, costOverride?) => set(s => {
    // Opus pricing: $3/M input, $15/M output
    const inputCost = (input / 1_000_000) * 3
    const outputCost = (output / 1_000_000) * 15
    const cost = costOverride ?? (inputCost + outputCost)
    const prev = s.tokenUsage.perSession[sessionId] || { input: 0, output: 0, cost: 0 }
    return {
      tokenUsage: {
        ...s.tokenUsage,
        daily: {
          input: s.tokenUsage.daily.input + input,
          output: s.tokenUsage.daily.output + output,
          cost: s.tokenUsage.daily.cost + cost,
        },
        perSession: {
          ...s.tokenUsage.perSession,
          [sessionId]: { input: prev.input + input, output: prev.output + output, cost: prev.cost + cost },
        },
      },
    }
  }),

  // ── Notes ──
  addNote: (position, color = 'yellow') => {
    const id = `note-${Date.now()}`
    set(s => ({
      notes: {
        ...s.notes,
        [id]: { id, text: '', color, position, size: { width: 200, height: 150 }, author: 'You', createdAt: new Date().toISOString() },
      },
    }))
    return id
  },

  updateNoteText: (id, text) => set(s => ({
    notes: { ...s.notes, [id]: { ...s.notes[id], text } },
  })),

  updateNoteColor: (id, color) => set(s => ({
    notes: { ...s.notes, [id]: { ...s.notes[id], color } },
  })),

  removeNote: (id) => set(s => {
    const { [id]: _, ...rest } = s.notes
    return { notes: rest, connections: s.connections.filter(c => c.source !== id && c.target !== id) }
  }),

  // ── Notifications ──
  addNotification: (type, title, message, sessionId) => set(s => ({
    notifications: [
      { id: `notif-${Date.now()}`, type, title, message, sessionId: sessionId || null, timestamp: new Date().toISOString(), read: false },
      ...s.notifications,
    ].slice(0, 100), // keep max 100
  })),

  markNotificationRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),

  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
  })),

  clearNotifications: () => set({ notifications: [] }),

  addConnection: (source, target) => {
    set(s => ({
      connections: [...s.connections, { id: `conn-${Date.now()}`, source, target }],
    }))

    // Sync connected-projects.md to both project directories
    const state = get()
    const sourceSession = state.sessions[source]
    const targetSession = state.sessions[target]
    if (sourceSession && targetSession && window?.connections?.sync) {
      window.connections.sync([
        { path: sourceSession.folderPath, connectedTo: [{ name: targetSession.name, path: targetSession.folderPath }] },
        { path: targetSession.folderPath, connectedTo: [{ name: sourceSession.name, path: sourceSession.folderPath }] },
      ]).catch(() => {})
    }
  },

  removeConnection: (id) => set(s => ({
    connections: s.connections.filter(c => c.id !== id),
  })),
}), {
  name: 'cove',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    _agentSkills: Object.fromEntries(
      Object.values(state.agents).map(a => [a.id, a.skills])
    ),
    notes: state.notes,
    snapshots: state.snapshots,
    // Save session layout (positions/names) but not running PTY state
    _sessionLayout: Object.fromEntries(
      Object.values(state.sessions).map(s => [s.id, {
        name: s.name, folderPath: s.folderPath,
        position: s.position, size: s.size,
        skills: s.skills,
        assignedAgents: s.assignedAgents,
      }])
    ),
    _agentAssignments: Object.fromEntries(
      Object.values(state.agents).map(a => [a.id, a.assignedSessions])
    ),
    theme: state.theme,
  }),
  onRehydrate: () => (state) => {
    if (!state) return
    // Restore agent skills + assignments
    const savedSkills = (state as any)._agentSkills as Record<string, string[]> | undefined
    const savedAssignments = (state as any)._agentAssignments as Record<string, string[]> | undefined
    if (savedSkills || savedAssignments) {
      const agents = { ...state.agents }
      Object.entries(agents).forEach(([id, agent]) => {
        if (savedSkills?.[id]) agents[id] = { ...agent, skills: savedSkills[id] }
        if (savedAssignments?.[id]) agents[id] = { ...agents[id], assignedSessions: savedAssignments[id] }
      })
      state.agents = agents
    }
    // Restore theme
    if (state.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  },
}))
