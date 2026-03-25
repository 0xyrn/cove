import { useStore } from '../../store/store'

export default function TokenCounter() {
  const daily = useStore(s => s.tokenUsage.daily)
  const sessions = useStore(s => s.sessions)
  const sessionCount = Object.keys(sessions).length

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return `${n}`
  }

  const formatCost = (n: number) => `$${n.toFixed(2)}`

  if (daily.cost === 0) return null

  return (
    <div className="titlebar-no-drag flex items-center gap-2 text-[9px] font-mono text-theme-muted">
      <span>{formatCost(daily.cost)}</span>
      <span>·</span>
      <span>{formatTokens(daily.input + daily.output)} tok</span>
      <span>·</span>
      <span>{sessionCount} sessions</span>
    </div>
  )
}
