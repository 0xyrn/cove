interface Props {
  agentId: string
  name: string
  color: string
  size?: number
  status?: 'idle' | 'working' | 'error' | 'offline'
  showStatus?: boolean
  delay?: number
}

// Agent-specific visual data
const AGENT_VISUALS: Record<string, {
  skinTone: string
  hair: JSX.Element
  accessory?: JSX.Element
  clothingColor: string
  mouthWide?: boolean
  mouthSerious?: boolean
}> = {
  aya: {
    skinTone: '#f5dcc3',
    hair: <>
      <ellipse cx="24" cy="12" rx="13" ry="6" fill="#3C3489" />
      <rect x="11" y="14" width="26" height="4" rx="2" fill="#3C3489" />
    </>,
    clothingColor: '#534AB7',
    mouthWide: true,
  },
  ben: {
    skinTone: '#e8c9a8',
    hair: <path d="M12,18 Q14,8 24,7 Q34,8 36,18" fill="#3a3a3a" />,
    accessory: <>
      <rect x="14" y="19" width="9" height="6" rx="2" fill="none" stroke="#85B7EB" strokeWidth="1.2" />
      <rect x="25" y="19" width="9" height="6" rx="2" fill="none" stroke="#85B7EB" strokeWidth="1.2" />
      <line x1="23" y1="22" x2="25" y2="22" stroke="#85B7EB" strokeWidth="0.8" />
    </>,
    clothingColor: '#1D9E75',
  },
  mia: {
    skinTone: '#f5dcc3',
    hair: <>
      <path d="M14,16 L18,13 Q24,10 30,13 L34,16" fill="#A8441E" />
      <rect x="13" y="14" width="22" height="4" rx="2" fill="#D85A30" />
    </>,
    clothingColor: '#D85A30',
  },
  leo: {
    skinTone: '#e8c9a8',
    hair: <path d="M13,18 Q15,10 24,9 Q33,10 35,18" fill="#633806" />,
    accessory: <rect x="18" y="26" width="12" height="3" rx="1" fill="#633806" opacity="0.5" />,
    clothingColor: '#BA7517',
  },
  zara: {
    skinTone: '#f5dcc3',
    hair: <path d="M12,20 Q14,8 24,7 Q34,8 36,20" fill="#72243E" />,
    accessory: <>
      <ellipse cx="12" cy="18" rx="5" ry="4" fill="#D4537E" opacity="0.4" />
      <ellipse cx="36" cy="18" rx="5" ry="4" fill="#D4537E" opacity="0.4" />
    </>,
    clothingColor: '#D4537E',
    mouthWide: true,
  },
  kai: {
    skinTone: '#c4956a',
    hair: <path d="M14,20 Q16,10 24,9 Q32,10 34,20" fill="#2a2a2e" />,
    clothingColor: '#378ADD',
  },
  nyx: {
    skinTone: '#f5dcc3',
    hair: <>
      <path d="M13,17 Q15,9 24,8 Q33,9 35,17" fill="#27500A" />
      <rect x="13" y="17" width="22" height="3" rx="1" fill="#27500A" opacity="0.3" />
    </>,
    clothingColor: '#639922',
    mouthWide: true,
  },
  sam: {
    skinTone: '#e8c9a8',
    hair: <path d="M14,20 Q16,12 24,11 Q32,12 34,20" fill="#2a2a2e" />,
    clothingColor: '#2a2a2e',
    mouthSerious: true,
  },
  rio: {
    skinTone: '#f5dcc3',
    hair: <path d="M13,18 Q14,8 24,7 Q34,8 35,18" fill="#993556" />,
    clothingColor: '#993556',
    mouthWide: true,
  },
  dex: {
    skinTone: '#c4956a',
    hair: <path d="M16,18 Q17,14 24,13 Q31,14 32,18" fill="#2a2a2e" />,
    clothingColor: '#5F5E5A',
  },
  eve: {
    skinTone: '#f5dcc3',
    hair: <>
      <path d="M14,16 Q16,6 24,5 Q32,6 34,16 L32,18 Q24,16 16,18Z" fill="#412402" />
      <circle cx="24" cy="12" r="3" fill="#412402" />
    </>,
    clothingColor: '#854F0B',
  },
  teo: {
    skinTone: '#e8c9a8',
    hair: <path d="M14,18 Q15,10 24,9 Q33,10 34,18" fill="#3a3a3a" />,
    accessory: <>
      <rect x="15" y="19" width="8" height="6" rx="2" fill="none" stroke="#5DCAA5" strokeWidth="1.2" />
      <rect x="25" y="19" width="8" height="6" rx="2" fill="none" stroke="#5DCAA5" strokeWidth="1.2" />
      <line x1="23" y1="22" x2="25" y2="22" stroke="#5DCAA5" strokeWidth="0.8" />
    </>,
    clothingColor: '#0F6E56',
  },
}

export default function AgentAvatar({ agentId, name, color, size = 48, status = 'idle', showStatus = true, delay = 0 }: Props) {
  const v = AGENT_VISUALS[agentId] || { skinTone: '#f5dcc3', hair: <></>, clothingColor: color }

  const mouthPath = status === 'error'
    ? 'M21,28 Q24,26 27,28'
    : status === 'working'
      ? 'M22,27 L26,27'
      : v.mouthWide
        ? 'M20,27 Q24,31 28,27'
        : 'M21,27 Q24,30 27,27'

  const statusColor = status === 'working' ? '#BA7517' : status === 'error' ? '#E24B4A' : status === 'idle' ? '#4EC9B0' : '#888'

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      title={name}
    >
      {/* Working pulse ring */}
      {status === 'working' && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ animation: 'pulse-ring 2s ease-in-out infinite', '--agent-color': color } as any}
        />
      )}

      {/* Avatar circle */}
      <svg viewBox="0 0 48 48" width={size} height={size} className="rounded-full overflow-hidden" style={{ backgroundColor: color }}>
        {/* Clip circle */}
        <defs>
          <clipPath id={`clip-${agentId}`}>
            <circle cx="24" cy="24" r="24" />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${agentId})`}>
          {/* Face */}
          <circle cx="24" cy="22" r="12" fill={v.skinTone} />
          {/* Hair */}
          {v.hair}
          {/* Eyes */}
          <circle cx="19" cy="22" r="2" fill="#2a2a2e" />
          <circle cx="29" cy="22" r="2" fill="#2a2a2e" />
          <circle cx="19.7" cy="21.5" r="0.6" fill="white" />
          <circle cx="29.7" cy="21.5" r="0.6" fill="white" />
          {/* Mouth */}
          <path d={mouthPath} stroke="#2a2a2e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Accessory */}
          {v.accessory}
          {/* Clothing */}
          <rect x="8" y="34" width="32" height="14" rx="6" fill={v.clothingColor} />
        </g>
      </svg>

      {/* Status dot */}
      {showStatus && (
        <div
          className="absolute rounded-full"
          style={{
            bottom: 0, right: 0,
            width: Math.max(10, size * 0.22),
            height: Math.max(10, size * 0.22),
            backgroundColor: statusColor,
            border: '2px solid var(--bg-canvas)',
          }}
        />
      )}
    </div>
  )
}
