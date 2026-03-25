import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/store'

const MARKETPLACE_URL = 'https://raw.githubusercontent.com/cove-workspace/marketplace/main/index.json'
const CACHE_KEY = 'cove-marketplace-cache'

interface MarketItem {
  id: string
  type: 'tool' | 'agent' | 'template'
  name: string
  description: string
  icon: string
  author: string
  downloads: number
  color: string
}

const MARKETPLACE_ITEMS: MarketItem[] = [
  // Tools
  { id: 'jira', type: 'tool', name: 'Jira', description: 'Issue tracking, sprint boards, ticket sync', icon: '🎫', author: 'community', downloads: 2340, color: '#0052CC' },
  { id: 'notion-ai', type: 'tool', name: 'Notion AI', description: 'Doc generation, wiki sync, knowledge base', icon: '📓', author: 'community', downloads: 1890, color: '#2C2C2A' },
  { id: 'aws', type: 'tool', name: 'AWS', description: 'S3, Lambda, CloudWatch, EC2 management', icon: '☁️', author: 'community', downloads: 1560, color: '#FF9900' },
  { id: 'postgres', type: 'tool', name: 'PostgreSQL', description: 'Direct DB queries, schema inspection, migrations', icon: '🐘', author: 'community', downloads: 1420, color: '#336791' },
  { id: 'redis', type: 'tool', name: 'Redis', description: 'Cache management, key inspection, pub/sub', icon: '🔴', author: 'community', downloads: 980, color: '#DC382D' },
  { id: 'datadog', type: 'tool', name: 'Datadog', description: 'Monitoring, APM traces, log search', icon: '🐕', author: 'community', downloads: 870, color: '#632CA6' },

  // Agents
  { id: 'devrel', type: 'agent', name: 'DevRel Writer', description: 'Blog posts, tutorials, API guides, changelogs', icon: '✍️', author: 'community', downloads: 1200, color: '#E24B4A' },
  { id: 'pm', type: 'agent', name: 'Product Manager', description: 'PRDs, user stories, acceptance criteria, roadmap', icon: '📊', author: 'community', downloads: 1050, color: '#534AB7' },
  { id: 'dba', type: 'agent', name: 'DBA Expert', description: 'Query optimization, indexing, schema design, migrations', icon: '🗄️', author: 'community', downloads: 890, color: '#336791' },
  { id: 'mobile', type: 'agent', name: 'Mobile Dev', description: 'React Native, Flutter, iOS/Android patterns, app store', icon: '📱', author: 'community', downloads: 760, color: '#378ADD' },

  // Templates
  { id: 'saas-starter', type: 'template', name: 'SaaS Starter', description: 'Auth + Stripe + Landing + Dashboard workspace', icon: '🚀', author: 'community', downloads: 2100, color: '#1D9E75' },
  { id: 'api-project', type: 'template', name: 'API Project', description: 'Backend + DB + Tests + Docs workspace', icon: '⚡', author: 'community', downloads: 1400, color: '#BA7517' },
  { id: 'fullstack', type: 'template', name: 'Full-Stack', description: 'Frontend + Backend + Mobile preview workspace', icon: '🏗️', author: 'community', downloads: 1800, color: '#D85A30' },
]

interface Props {
  onClose: () => void
}

export default function MarketplacePanel({ onClose }: Props) {
  const [filter, setFilter] = useState<'all' | 'tool' | 'agent' | 'template'>('all')
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [items, setItems] = useState<MarketItem[]>(MARKETPLACE_ITEMS)
  const [source, setSource] = useState<'remote' | 'cache' | 'local'>('local')
  const [loading, setLoading] = useState(true)

  // Fetch from GitHub, fallback to cache, fallback to hardcoded
  useEffect(() => {
    fetch(MARKETPLACE_URL, { signal: AbortSignal.timeout(5000) })
      .then(r => r.json())
      .then(data => {
        const remote = [
          ...(data.tools || []).map((t: any) => ({ ...t, type: 'tool' as const })),
          ...(data.agents || []).map((a: any) => ({ ...a, type: 'agent' as const })),
          ...(data.templates || []).map((t: any) => ({ ...t, type: 'template' as const })),
        ]
        if (remote.length > 0) {
          setItems(remote)
          setSource('remote')
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(remote)) } catch {}
        }
      })
      .catch(() => {
        // Try cache
        try {
          const cached = localStorage.getItem(CACHE_KEY)
          if (cached) {
            setItems(JSON.parse(cached))
            setSource('cache')
          }
        } catch {}
        // If no cache, MARKETPLACE_ITEMS (hardcoded) stays as fallback
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  const handleInstall = (item: MarketItem) => {
    setInstalled(prev => new Set([...prev, item.id]))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-theme-card border border-theme-border rounded-xl shadow-lg w-[520px] max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <span className="text-sm font-medium">Marketplace</span>
            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full ${
              source === 'remote' ? 'bg-[#E1F5EE] text-[#085041]' :
              source === 'cache' ? 'bg-[#FAEEDA] text-[#633806]' :
              'bg-[#F1EFE8] text-[#5F5E5A]'
            }`}>
              {source === 'remote' ? 'live' : source === 'cache' ? 'cached' : 'local'}
            </span>
          </div>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary text-lg">×</button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-theme-border">
          {(['all', 'tool', 'agent', 'template'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono capitalize transition-colors
                ${filter === f ? 'bg-[#534AB7] text-white' : 'text-theme-secondary hover:bg-theme-hover'}
              `}>
              {f === 'all' ? 'All' : f + 's'}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-theme-canvas transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: item.color + '15' }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-theme-primary">{item.name}</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: item.type === 'tool' ? '#E6F1FB' : item.type === 'agent' ? '#EEEDFE' : '#E1F5EE',
                      color: item.type === 'tool' ? '#0C447C' : item.type === 'agent' ? '#3C3489' : '#085041',
                    }}>
                    {item.type}
                  </span>
                </div>
                <div className="text-[10px] text-theme-secondary mt-0.5">{item.description}</div>
                <div className="text-[8px] text-theme-muted mt-1">by {item.author} · {item.downloads.toLocaleString()} installs</div>
              </div>
              <button
                onClick={() => handleInstall(item)}
                disabled={installed.has(item.id)}
                className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors
                  ${installed.has(item.id)
                    ? 'bg-[#E1F5EE] text-[#085041]'
                    : 'border border-theme-border text-theme-primary hover:bg-theme-hover'
                  }
                `}>
                {installed.has(item.id) ? '✓ Installed' : 'Install'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-theme-border text-center">
          <span className="text-[9px] text-theme-muted">Submit your own tools, agents & templates →</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
