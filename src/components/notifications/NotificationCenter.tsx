import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/store'

export default function NotificationCenter() {
  const notifications = useStore(s => s.notifications)
  const markNotificationRead = useStore(s => s.markNotificationRead)
  const markAllRead = useStore(s => s.markAllRead)
  const [open, setOpen] = useState(false)

  const unread = notifications.filter(n => !n.read).length

  const typeConfig: Record<string, { color: string; icon: string }> = {
    success: { color: '#4EC9B0', icon: '🟢' },
    error: { color: '#E24B4A', icon: '🔴' },
    git: { color: '#BA7517', icon: '🟡' },
    tool: { color: '#378ADD', icon: '🔵' },
    system: { color: '#8A857A', icon: '⚪' },
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="titlebar-no-drag flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] hover:bg-theme-hover transition-colors relative"
      >
        <span>🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E24B4A] text-white text-[8px] flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute right-0 top-8 z-40 w-72 bg-theme-card border border-theme-border rounded-xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border">
                <span className="text-[11px] font-medium">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[9px] text-[#534AB7] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-theme-muted">No notifications</div>
                ) : (
                  notifications.slice(0, 20).map(n => {
                    const cfg = typeConfig[n.type] || typeConfig.system
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id)
                          if (n.sessionId) {
                            window.dispatchEvent(new CustomEvent('focus-session', { detail: { sessionId: n.sessionId } }))
                            setOpen(false)
                          }
                        }}
                        className={`flex gap-2 px-3 py-2 cursor-pointer hover:bg-theme-canvas transition-colors ${!n.read ? 'bg-theme-canvas' : ''}`}
                      >
                        <span className="text-xs mt-0.5">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium text-theme-primary">{n.title}</span>
                            {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#534AB7]" />}
                          </div>
                          <div className="text-[9px] text-theme-secondary truncate">{n.message}</div>
                        </div>
                        <span className="text-[8px] text-theme-muted shrink-0">{formatTime(n.timestamp)}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
