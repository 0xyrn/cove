import { useStore } from '../../store/store'
import NotificationCenter from '../notifications/NotificationCenter'
import TokenCounter from '../tracking/TokenCounter'
import SnapshotMenu from './SnapshotMenu'

interface Props {
  onNewSession: () => void
}

export default function Toolbar({ onNewSession }: Props) {
  const sessions = useStore(s => s.sessions)
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  const sessionCount = Object.keys(sessions).length

  return (
    <div className="titlebar-drag h-10 flex items-center justify-between px-4 shrink-0"
      style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      <div className="w-20" />

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono tracking-[3px] font-medium" style={{ color: 'var(--text-muted)' }}>
          COVE
        </span>
        {sessionCount > 0 && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-header)' }}>
            {sessionCount} session{sessionCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="titlebar-no-drag flex items-center gap-3">
        <TokenCounter />
        <SnapshotMenu />
        <NotificationCenter />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="px-2 py-1 rounded-lg text-[11px] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          + New Session
        </button>
      </div>
    </div>
  )
}
