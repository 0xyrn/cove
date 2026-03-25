import { memo, useEffect } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Preview } from '../../store/store'
import { useStore } from '../../store/store'

function PreviewCardNode({ data, selected }: NodeProps & { data: Preview }) {
  const preview = data
  const removePreview = useStore(s => s.removePreview)
  const updatePreviewStatus = useStore(s => s.updatePreviewStatus)

  // Periodic health check every 10s
  useEffect(() => {
    if (!preview.port) return
    const check = () => {
      fetch(`http://localhost:${preview.port}`, { mode: 'no-cors' })
        .then(() => { if (preview.status !== 'live') updatePreviewStatus(preview.id, 'live') })
        .catch(() => { if (preview.status === 'live') updatePreviewStatus(preview.id, 'offline') })
    }
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [preview.port, preview.id])

  const typeConfig = {
    web: { icon: '🌐', label: 'Web preview', color: '#4EC9B0' },
    mobile: { icon: '📱', label: 'Mobile', color: '#378ADD' },
    api: { icon: '⇄', label: 'API preview', color: '#BA7517' },
  }
  const cfg = typeConfig[preview.type]

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        width: '100%', height: '100%',
        backgroundColor: 'var(--bg-card)',
        border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
        boxShadow: '0 2px 8px var(--shadow)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ width: 8, height: 8, background: cfg.color, border: '1px solid var(--border)' }} />

      {/* Header */}
      <div className="session-drag-handle flex items-center h-7 px-2.5 cursor-grab select-none"
        style={{ backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs mr-1.5">{cfg.icon}</span>
        <span className="text-[10px] font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{cfg.label}</span>

        {/* LIVE badge */}
        {preview.status === 'live' && (
          <div className="flex items-center gap-1 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E24B4A]" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span className="text-[8px] font-mono text-[#E24B4A]">LIVE</span>
          </div>
        )}
        {preview.status === 'offline' && (
          <span className="text-[8px] font-mono mr-2" style={{ color: 'var(--text-muted)' }}>OFFLINE</span>
        )}

        <button onClick={() => removePreview(preview.id)}
          className="hover:text-[#E24B4A] text-sm" style={{ color: 'var(--text-muted)' }}>×</button>
      </div>

      {/* Content */}
      <div style={{ height: 'calc(100% - 28px)' }}>
        {preview.type === 'web' && <WebContent preview={preview} />}
        {preview.type === 'mobile' && <MobileContent preview={preview} />}
        {preview.type === 'api' && <ApiContent preview={preview} />}
      </div>
    </div>
  )
}

function WebContent({ preview }: { preview: Preview }) {
  return (
    <div className="h-full flex flex-col">
      {/* Mini browser chrome */}
      <div className="flex items-center h-6 px-2 gap-1.5" style={{ backgroundColor: 'var(--bg-canvas)', borderBottom: '1px solid var(--border)' }}>
        <button className="text-[8px]" style={{ color: 'var(--text-muted)' }}>◄</button>
        <button className="text-[8px]" style={{ color: 'var(--text-muted)' }}>►</button>
        <button className="text-[8px]" style={{ color: 'var(--text-muted)' }}>↻</button>
        <div className="flex-1 px-2 py-0.5 rounded text-[8px] font-mono truncate" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          {preview.url || 'localhost'}
        </div>
      </div>
      {/* Webview area */}
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-canvas)' }}>
        {preview.url ? (
          <iframe
              src={preview.url}
              className="w-full h-full"
              style={{ border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
            />
        ) : (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Waiting for server...</span>
        )}
      </div>
    </div>
  )
}

function MobileContent({ preview }: { preview: Preview }) {
  return (
    <div className="h-full flex items-center justify-center p-2" style={{ backgroundColor: 'var(--bg-header)' }}>
      <div className="relative" style={{ width: '100%', maxWidth: 160, aspectRatio: '9/19.5' }}>
        {/* Phone frame */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#2C2C2A] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Status bar */}
          <div className="h-4 bg-[#2C2C2A] flex items-center justify-center">
            <span className="text-[6px] text-white font-mono">9:41</span>
          </div>
          {/* Screen */}
          <div className="flex-1" style={{ height: 'calc(100% - 20px)' }}>
            {preview.url ? (
              <iframe
              src={preview.url}
              className="w-full h-full"
              style={{ border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
            />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>No server</span>
              </div>
            )}
          </div>
          {/* Home indicator */}
          <div className="h-4 flex items-center justify-center">
            <div className="w-8 h-1 rounded-full bg-[#2C2C2A]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiContent({ preview }: { preview: Preview }) {
  const resp = preview.lastResponse

  const methodColors: Record<string, string> = {
    GET: '#4EC9B0', POST: '#378ADD', PUT: '#BA7517', DELETE: '#E24B4A', PATCH: '#534AB7'
  }

  return (
    <div className="h-full flex flex-col text-[10px] font-mono">
      {resp ? (
        <>
          {/* Method + path */}
          <div className="flex items-center gap-2 px-2.5 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="px-1.5 py-0.5 rounded text-white text-[8px] font-bold"
              style={{ backgroundColor: methodColors[resp.method] || '#8A857A' }}>
              {resp.method}
            </span>
            <span className="truncate" style={{ color: 'var(--text-primary)' }}>{resp.path}</span>
            <span className="ml-auto px-1.5 py-0.5 rounded text-[8px]"
              style={{
                backgroundColor: resp.statusCode < 400 ? '#E1F5EE' : resp.statusCode < 500 ? '#FAEEDA' : '#FCEBEB',
                color: resp.statusCode < 400 ? '#085041' : resp.statusCode < 500 ? '#633806' : '#791F1F',
              }}>
              {resp.statusCode}
            </span>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-auto px-2.5 py-1.5" style={{ backgroundColor: 'var(--bg-canvas)' }}>
            <pre className="text-[9px] whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{resp.body}</pre>
          </div>
          {/* Footer */}
          <div className="px-2.5 py-1 text-[8px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {resp.time}ms · {resp.size} bytes
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          Waiting for API calls...
        </div>
      )}
    </div>
  )
}

export default memo(PreviewCardNode)
