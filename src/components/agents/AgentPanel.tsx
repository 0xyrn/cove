import { useStore } from '../../store/store'

export default function AgentPanel() {
  const agents = useStore(s => s.agents)
  const agentList = Object.values(agents)
  const idle = agentList.filter(a => a.assignedSessions.length === 0)
  const working = agentList.filter(a => a.assignedSessions.length > 0)

  return (
    <div className="w-52 flex flex-col shrink-0" style={{ backgroundColor: 'var(--bg-header)', borderLeft: '1px solid var(--border)' }}>
      <div className="px-3 py-2 border-b border-theme-border">
        <span className="text-[10px] font-mono tracking-[2px] text-theme-secondary">AGENTS ({agentList.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {working.length > 0 && (
          <>
            <div className="text-[8px] font-mono text-theme-muted px-1 pt-1">WORKING</div>
            {working.map((a, i) => <AgentItem key={a.id} agent={a} index={i} />)}
          </>
        )}
        <div className="text-[8px] font-mono text-theme-muted px-1 pt-2">AVAILABLE</div>
        {idle.map((a, i) => <AgentItem key={a.id} agent={a} index={i} />)}
      </div>

      <div className="px-3 py-2 border-t border-theme-border">
        <span className="text-[8px] text-theme-muted font-mono">Drag to session card</span>
      </div>
    </div>
  )
}

function AgentItem({ agent, index }: { agent: any; index: number }) {
  const isWorking = agent.assignedSessions && agent.assignedSessions.length > 0

  if (isWorking) {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-lg opacity-50">
        <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: agent.color }}>
          {agent.letter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold" style={{ color: agent.color }}>{agent.name}</div>
          <div className="text-[8px] text-theme-muted truncate">{agent.role}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-theme-card cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData('agent-id', agent.id)
        e.dataTransfer.effectAllowed = 'all'
      }}
    >
      <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{
          backgroundColor: agent.color,
          animation: 'agent-float 3s ease-in-out infinite',
          animationDelay: `${index * 0.4}s`,
        }}>
        {agent.letter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold" style={{ color: agent.color }}>{agent.name}</div>
        <div className="text-[8px] text-theme-muted truncate">{agent.role}</div>
      </div>
    </div>
  )
}
