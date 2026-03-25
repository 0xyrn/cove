import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useStore, type SessionCard as SessionType } from '../../store/store'
import { registerPty, unregisterPty } from '../../lib/ptyRegistry'
import { AGENTS } from '../../data/agents'
import { SKILLS } from '../../data/skills'
import AgentAvatar from '../agents/AgentAvatar'
import { detectPort } from '../preview/PortDetector'
import { buildMcpConfigJson } from '../../lib/mcpConfig'
import ContextMenu, { type MenuItem } from '../ui/ContextMenu'

function SessionCardNode({ data, selected }: NodeProps & { data: SessionType }) {
  const session = data
  const agents = useStore(s => s.agents)
  const assignedAgents = session.assignedAgents.map(id => agents[id]).filter(Boolean)
  const closeSession = useStore(s => s.closeSession)
  const minimizeSession = useStore(s => s.minimizeSession)
  const assignAgent = useStore(s => s.assignAgent)
  const addSkillToSession = useStore(s => s.addSkillToSession)
  const addPreview = useStore(s => s.addPreview)
  const updatePreviewStatus = useStore(s => s.updatePreviewStatus)
  const removeAgent = useStore(s => s.removeAgent)
  const updateSessionSize = useStore(s => s.updateSessionSize)
  const addNotification = useStore(s => s.addNotification)
  const addTokenUsage = useStore(s => s.addTokenUsage)
  const addTimeline = useStore(s => s.addTimeline)
  const startRecording = useStore(s => s.startRecording)
  const stopRecording = useStore(s => s.stopRecording)
  const appendRecordingEvent = useStore(s => s.appendRecordingEvent)
  const recordingIdRef = useRef<string | null>(null)
  const recBufferRef = useRef<string>('')
  const recTimerRef = useRef<NodeJS.Timeout | null>(null)
  const detectedPortsRef = useRef<Set<number>>(new Set())
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [detectedPort, setDetectedPort] = useState<number | null>(null)
  const [detectedType, setDetectedType] = useState<'web' | 'mobile' | 'api'>('web')
  const [isRecording, setIsRecording] = useState(false)
  const skillDefs = SKILLS

  const termRef = useRef<HTMLDivElement>(null)
  const termInstanceRef = useRef<Terminal | null>(null)
  const ptyIdRef = useRef(`pty-${session.id}-${Date.now()}`)
  const cleanupRef = useRef<(() => void)[]>([])

  // Build and launch claude with proper flags
  // Uses single-quote shell escaping to prevent injection
  const shellEscape = (s: string) => "'" + s.replace(/'/g, "'\\''") + "'"

  const launchClaude = async () => {
    const ptyId = ptyIdRef.current
    const args: string[] = ['$HOME/.local/bin/claude']

    // MCP config if tools assigned
    if (session.skills.length > 0) {
      const mcpJson = buildMcpConfigJson(session.skills)
      if (mcpJson && window.mcp) {
        try {
          const configPath = await window.mcp.writeConfig(session.id, mcpJson)
          if (typeof configPath === 'string' && configPath.startsWith('/')) {
            args.push('--mcp-config', shellEscape(configPath))
          }
        } catch (e) { console.error('[MCP] writeConfig failed:', e) }
      }
    }

    // System prompt if agent assigned - properly escaped
    if (session.assignedAgents.length > 0) {
      const agentDef = AGENTS.find(a => a.id === session.assignedAgents[0])
      if (agentDef) {
        const prompt = `You are ${agentDef.name}, a ${agentDef.role}. ${agentDef.systemPromptHint}`
        args.push('--append-system-prompt', shellEscape(prompt))
      }
    }

    window.pty.write(ptyId, args.join(' ') + '\r')
  }

  // Terminal setup
  useEffect(() => {
    if (!termRef.current || !window.pty) return
    if (termInstanceRef.current) return // already initialized

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 12,
      fontFamily: '"JetBrains Mono", "SF Mono", monospace',
      lineHeight: 1.3,
      theme: {
        background: '#1A1A2E',
        foreground: '#C8C8D4',
        cursor: '#534AB7',
        cursorAccent: '#1A1A2E',
        selectionBackground: '#534AB740',
        black: '#1A1A2E', red: '#E24B4A', green: '#4EC9B0',
        yellow: '#D4A276', blue: '#7EB8DA', magenta: '#C586C0',
        cyan: '#378ADD', white: '#C8C8D4',
        brightBlack: '#8A857A', brightRed: '#FF6B6B', brightGreen: '#6EDCCA',
        brightYellow: '#E8C9A8', brightBlue: '#9ED0F0', brightMagenta: '#D9A6D6',
        brightCyan: '#5AA4E8', brightWhite: '#F0EDE4',
      },
      allowProposedApi: true,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(termRef.current)
    setTimeout(() => fit.fit(), 50)
    termInstanceRef.current = term

    const ptyId = ptyIdRef.current
    registerPty(session.id, ptyId)

    const { cols, rows } = term
    window.pty.create({ id: ptyId, cwd: session.folderPath, cols, rows }).then(() => {
      const offData = window.pty.onData(ptyId, (d) => {
        term.write(d)

        // Capture to recording (batched - buffer 500ms, cap 10K events)
        if (recordingIdRef.current) {
          if (!recBufferRef.current) recBufferRef.current = ''
          recBufferRef.current += d
          if (!recTimerRef.current) {
            recTimerRef.current = setTimeout(() => {
              if (recordingIdRef.current && recBufferRef.current) {
                appendRecordingEvent(recordingIdRef.current, recBufferRef.current)
              }
              recBufferRef.current = ''
              recTimerRef.current = null
            }, 500)
          }
        }
        // Token tracking: parse Claude Code's human-readable output
        // Pattern 1: "$0.0234 session" → direct session cost
        const costMatch = d.match(/\$(\d+\.?\d*)\s*session/i)
        if (costMatch) {
          addTokenUsage(session.id, 0, 0, parseFloat(costMatch[1]))
        }
        // Pattern 2: "1.2k in, 0.5k out" → token counts with k suffix
        const kInMatch = d.match(/(\d+\.?\d*)\s*[kK]\s*in/i)
        const kOutMatch = d.match(/(\d+\.?\d*)\s*[kK]\s*out/i)
        if (kInMatch && !costMatch) {
          addTokenUsage(session.id, parseFloat(kInMatch[1]) * 1000, kOutMatch ? parseFloat(kOutMatch[1]) * 1000 : 0)
        }
        // Pattern 3: "tokens: 1234 input, 567 output" → raw token counts
        const rawInMatch = d.match(/tokens?:\s*(\d+)\s*input/i)
        const rawOutMatch = d.match(/(\d+)\s*output/i)
        if (rawInMatch && !kInMatch && !costMatch) {
          addTokenUsage(session.id, parseInt(rawInMatch[1], 10), rawOutMatch ? parseInt(rawOutMatch[1], 10) : 0)
        }

        // Detect ports (store for manual preview spawn via footer buttons)
        const detected = detectPort(d)
        if (detected && !detectedPortsRef.current.has(detected.port)) {
          detectedPortsRef.current.add(detected.port)
          setDetectedPort(detected.port)
          setDetectedType(detected.type)
        }
      })
      cleanupRef.current.push(offData)
      const offExit = window.pty.onExit(ptyId, (code) => {
        term.write(`\r\n\x1b[33m-- exited (${code}) --\x1b[0m\r\n`)
      })
      cleanupRef.current.push(offExit)

      // Launch claude - flags added when agent/skills are assigned
      setTimeout(() => {
        launchClaude()
      }, 2500)
    })

    const d1 = term.onData((d) => window.pty.write(ptyId, d))
    cleanupRef.current.push(() => d1.dispose())

    const d2 = term.onResize(({ cols, rows }) => window.pty.resize(ptyId, cols, rows))
    cleanupRef.current.push(() => d2.dispose())

    const ro = new ResizeObserver(() => fit.fit())
    ro.observe(termRef.current)
    cleanupRef.current.push(() => ro.disconnect())

    return () => {
      cleanupRef.current.forEach(fn => fn())
      cleanupRef.current = []
      unregisterPty(session.id)
      window.pty.kill(ptyId)
      term.dispose()
      termInstanceRef.current = null
    }
  }, [])

  // Track previous agents/skills to detect new additions
  const prevAgentsRef = useRef<string[]>([])
  const prevSkillsRef = useRef<string[]>([])

  // When a new agent is assigned → send role prompt to terminal
  useEffect(() => {
    const prev = prevAgentsRef.current
    const curr = session.assignedAgents
    const newAgents = curr.filter(id => !prev.includes(id))

    newAgents.forEach(agentId => {
      const agentDef = AGENTS.find(a => a.id === agentId)
      if (agentDef && termInstanceRef.current) {
        // Visual notification in terminal
        termInstanceRef.current.write(
          `\r\n\x1b[36m▸ Agent joined: ${agentDef.name} (${agentDef.role})\x1b[0m\r\n` +
          `\x1b[90m  ${agentDef.systemPromptHint}\x1b[0m\r\n`
        )

        addNotification('success', `${agentDef.name} joined`, `${agentDef.role} → ${session.name}`, session.id)

        // Restart claude with --append-system-prompt flag
        const ptyId = ptyIdRef.current
        // Send Ctrl+C to stop current claude, then relaunch with agent prompt
        window.pty.write(ptyId, '\x03') // Ctrl+C
        setTimeout(() => launchClaude(), 1500)
      }
    })

    prevAgentsRef.current = [...curr]
  }, [session.assignedAgents])

  // When a new skill is added → notify in terminal
  useEffect(() => {
    const prev = prevSkillsRef.current
    const curr = session.skills
    const newSkills = curr.filter(id => !prev.includes(id))

    newSkills.forEach(skillId => {
      const skillDef = skillDefs.find(s => s.id === skillId)
      if (skillDef && termInstanceRef.current) {
        termInstanceRef.current.write(
          `\r\n\x1b[33m▸ Tool connected: ${skillDef.name} — ${skillDef.description}\x1b[0m\r\n` +
          `\x1b[90m  Restarting claude with MCP config...\x1b[0m\r\n`
        )
        addNotification('tool', `Tool connected`, `${skillDef.name} → ${session.name}`, session.id)

        // Restart claude with updated MCP config
        const ptyId = ptyIdRef.current
        window.pty.write(ptyId, '\x03')
        setTimeout(() => launchClaude(), 1500)
      }
    })

    prevSkillsRef.current = [...curr]
  }, [session.skills])

  // Resize handle logic
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: session.size.width,
      startH: session.size.height,
    }

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const dx = ev.clientX - resizeRef.current.startX
      const dy = ev.clientY - resizeRef.current.startY
      const newW = Math.min(800, Math.max(300, resizeRef.current.startW + dx))
      const newH = Math.min(600, Math.max(200, resizeRef.current.startH + dy))
      updateSessionSize(session.id, { width: newW, height: newH })
    }

    const onMouseUp = () => {
      resizeRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [session.id, session.size.width, session.size.height, updateSessionSize])

  const boundSkills = session.skills.map(sid => skillDefs.find(s => s.id === sid)).filter(Boolean)
  const sessionTokens = useStore(s => s.tokenUsage.perSession[session.id])
  const statusColor = session.status === 'active' ? '#4EC9B0' : session.status === 'working' ? '#BA7517' : session.status === 'error' ? '#E24B4A' : '#B4B2A9'

  // Minimized view
  if (session.minimized) {
    return (
      <div
        className="rounded-lg overflow-hidden cursor-pointer"
        style={{ width: 160, height: 36, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 1px 4px var(--shadow)' }}
        onClick={() => minimizeSession(session.id)}
      >
        <Handle type="target" position={Position.Left} className="session-handle session-handle-left" title="Drag to connect">
          <span className="session-handle-icon">&#9675;</span>
        </Handle>
        <Handle type="source" position={Position.Right} className="session-handle session-handle-right" title="Drag to connect">
          <span className="session-handle-icon">&#9675;</span>
        </Handle>
        <div className="flex items-center h-full px-2 gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-[10px] font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>{session.name}</span>
          {assignedAgents.slice(0, 2).map(a => (
            <div key={a.id} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold"
              style={{ backgroundColor: a.color }}>{a.letter}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-shadow"
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        backgroundColor: 'var(--bg-card)',
        border: selected ? '2px solid #534AB7' : '1px solid var(--border)',
        boxShadow: selected ? '0 4px 16px rgba(83,74,183,0.12)' : `0 2px 8px var(--shadow)`,
      }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY }) }}
      onDragOver={(e) => { e.preventDefault() }}
      onDrop={(e) => {
        e.preventDefault()
        const agentId = e.dataTransfer.getData('agent-id')
        const skillId = e.dataTransfer.getData('skill-id')
        if (agentId) assignAgent(agentId, session.id)
        if (skillId) addSkillToSession(skillId, session.id)
      }}
    >
      {/* Connection handles - always visible with icons */}
      <Handle type="target" position={Position.Left} className="session-handle session-handle-left" title="Drag to connect">
        <span className="session-handle-icon">&#9675;</span>
        <span className="session-handle-label">connect</span>
      </Handle>
      <Handle type="source" position={Position.Right} className="session-handle session-handle-right" title="Drag to connect">
        <span className="session-handle-icon">&#9675;</span>
        <span className="session-handle-label">connect</span>
      </Handle>

      {/* Header - drag handle */}
      <div className="session-drag-handle flex items-center h-8 px-3 cursor-grab active:cursor-grabbing select-none"
        style={{ backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        {/* Status dot */}
        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: statusColor }} />

        {/* Name */}
        <span className="text-[12px] font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
          {session.name}
        </span>

        {/* Agent avatars - sit on top-right edge of card */}
        <div className="flex -space-x-2 mr-2">
          {assignedAgents.map((a, i) => (
            <div key={a.id} className="relative" style={{ zIndex: 10 - i }}>
              <AgentAvatar
                agentId={a.id}
                name={a.name}
                color={a.color}
                size={24}
                status="working"
                showStatus={false}
                delay={i * 0.3}
              />
            </div>
          ))}
        </div>

        {/* Minimize */}
        <button
          onClick={(e) => { e.stopPropagation(); minimizeSession(session.id) }}
          className="hover:text-[#BA7517] text-[10px] transition-colors px-1"
          style={{ color: 'var(--text-muted)' }}
          title="Minimize"
        >
          −
        </button>
        {/* Close */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Close "${session.name}"? Terminal history will be lost.`)) {
              closeSession(session.id)
            }
          }}
          className="hover:text-[#E24B4A] text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Close session"
        >
          ×
        </button>
      </div>

      {/* Terminal */}
      <div
        ref={termRef}
        className="session-terminal flex-1"
        style={{ height: 'calc(100% - 32px - 28px)', backgroundColor: '#1A1A2E' }}
        onClick={() => termInstanceRef.current?.focus()}
      />

      {/* Footer - action icons + skill badges */}
      <div className="flex items-center h-8 px-2 gap-0.5 overflow-x-auto"
        style={{ backgroundColor: 'var(--bg-header)', borderTop: '1px solid var(--border)' }}>

        {/* Action icon buttons */}
        <button
          onClick={(e) => { e.stopPropagation();
            if (!isRecording) { recordingIdRef.current = startRecording(session.id); setIsRecording(true) }
            else { if (recordingIdRef.current) { stopRecording(recordingIdRef.current) }; setIsRecording(false) }
          }}
          className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors
            ${isRecording ? 'bg-[#FCEBEB] text-[#E24B4A]' : ''}`}
          style={!isRecording ? { color: 'var(--text-muted)' } : undefined}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? '⏺' : '📹'}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); addTimeline(session.id) }}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Show timeline"
        >📋</button>

        {detectedPort && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const pid = addPreview(session.id, 'web', detectedPort)
                // Health check
                const check = (n: number) => {
                  fetch(`http://localhost:${detectedPort}`, { mode: 'no-cors' })
                    .then(() => updatePreviewStatus(pid, 'live'))
                    .catch(() => n > 0 ? setTimeout(() => check(n-1), 2000) : updatePreviewStatus(pid, 'offline'))
                }
                setTimeout(() => check(5), 500)
              }}
              className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title={`Web preview :${detectedPort}`}
            >🌐</button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                const pid = addPreview(session.id, 'mobile', detectedPort)
                setTimeout(() => updatePreviewStatus(pid, 'live'), 2000)
              }}
              className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title={`Mobile preview :${detectedPort}`}
            >📱</button>
          </>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); addPreview(session.id, 'api', 8000) }}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="API preview"
        >⇄</button>

        {/* Divider */}
        <div className="w-px h-4 mx-0.5 shrink-0" style={{ backgroundColor: 'var(--border)' }} />

        {/* Skill badges */}
        {boundSkills.map((sk: any) => (
          <span key={sk.id} className="text-[8px] font-medium px-1 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: sk.bgColor, color: sk.color }}>
            {sk.icon}
          </span>
        ))}

        {/* Token cost (right-aligned) */}
        {sessionTokens && sessionTokens.cost > 0 && (
          <span className="ml-auto text-[8px] font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
            ${sessionTokens.cost.toFixed(2)}
          </span>
        )}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 16,
          height: 16,
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 8,
          userSelect: 'none',
          zIndex: 10,
        }}
        title="Resize"
      >
        ▾
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: 'Add Web Preview', icon: '🌐', onClick: () => addPreview(session.id, 'web', 3000) },
            { label: 'Add Mobile Preview', icon: '📱', onClick: () => addPreview(session.id, 'mobile', 3000) },
            { label: 'Add API Preview', icon: '⇄', onClick: () => addPreview(session.id, 'api', 8000) },
            ...(session.assignedAgents.length > 0 ? [
              { label: 'Show Timeline', icon: '📅', onClick: () => addTimeline(session.id) },
              { label: 'Quick: Analyze', icon: '🔍', onClick: () => window.pty.write(ptyIdRef.current, 'Analyze this project and summarize key issues\r') },
              { label: 'Quick: Test', icon: '🧪', onClick: () => window.pty.write(ptyIdRef.current, 'Run tests and report results\r') },
              { label: 'Quick: Review', icon: '📋', onClick: () => window.pty.write(ptyIdRef.current, 'Review the last commit for issues\r') },
            ] : []),
            { divider: true, label: '', onClick: () => {} },
            ...assignedAgents.map(a => ({
              label: `Remove ${a.name}`, icon: '👤', onClick: () => removeAgent(a.id), color: '#E24B4A',
            })),
            { divider: true, label: '', onClick: () => {} },
            { label: 'Minimize', icon: '−', onClick: () => minimizeSession(session.id) },
            { label: 'Close Session', icon: '×', onClick: () => closeSession(session.id), color: '#E24B4A' },
          ]}
        />
      )}
    </div>
  )
}

export default memo(SessionCardNode)
