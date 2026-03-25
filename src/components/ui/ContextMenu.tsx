import { motion } from 'framer-motion'

export interface MenuItem {
  label: string
  icon?: string
  onClick: () => void
  color?: string
  divider?: boolean
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.08 }}
        className="fixed z-50 bg-theme-card border border-theme-border rounded-lg shadow-lg py-1 min-w-[180px]"
        style={{ left: x, top: y }}
      >
        {items.map((item, i) => (
          item.divider ? (
            <div key={i} className="h-px bg-theme-border my-1" />
          ) : (
            <button
              key={i}
              onClick={() => { item.onClick(); onClose() }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-theme-hover transition-colors text-left"
              style={{ color: item.color || 'var(--text-primary)' }}
            >
              {item.icon && <span className="text-sm w-5 text-center">{item.icon}</span>}
              {item.label}
            </button>
          )
        ))}
      </motion.div>
    </>
  )
}
