import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { SKILLS as TOOLS } from '../../data/skills'
import MarketplacePanel from '../marketplace/MarketplacePanel'

export default function SkillShelf() {
  const [showMarketplace, setShowMarketplace] = useState(false)

  return (
    <div className="w-44 bg-theme-header border-r border-theme-border flex flex-col shrink-0">
      <div className="px-3 py-2 border-b border-theme-border">
        <span className="text-[10px] font-mono tracking-[2px] text-theme-secondary">TOOLS</span>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {TOOLS.map(skill => (
          <div
            key={skill.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-theme-card transition-colors"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('skill-id', skill.id)
              e.dataTransfer.effectAllowed = 'copy'
            }}
          >
            <span className="text-sm">{skill.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold" style={{ color: skill.color }}>{skill.name}</div>
              <div className="text-[7px] text-theme-muted truncate">{skill.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Marketplace button */}
      <button
        onClick={() => setShowMarketplace(true)}
        className="mx-2 mb-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-theme-border text-[10px] font-mono text-theme-secondary hover:bg-theme-card hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
      >
        🏪 Marketplace
      </button>

      <div className="px-3 py-2 border-t border-theme-border">
        <span className="text-[8px] text-theme-muted font-mono">Drag tool to session card</span>
      </div>

      <AnimatePresence>
        {showMarketplace && <MarketplacePanel onClose={() => setShowMarketplace(false)} />}
      </AnimatePresence>
    </div>
  )
}
