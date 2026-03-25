// Detects server ports from terminal output and triggers preview spawning

const PORT_PATTERNS = [
  /localhost:(\d+)/,
  /127\.0\.0\.1:(\d+)/,
  /0\.0\.0\.0:(\d+)/,
  /ready on :(\d+)/i,
  /listening on (?:port )?(\d+)/i,
  /started server on.*:(\d+)/i,
  /running at.*:(\d+)/i,
]

const TYPE_HINTS: { pattern: RegExp; type: 'web' | 'mobile' | 'api' }[] = [
  { pattern: /uvicorn|fastapi|express|flask|django/i, type: 'api' },
  { pattern: /expo start|expo devtools/i, type: 'mobile' },
  { pattern: /next dev|vite|webpack|nuxt|remix|astro/i, type: 'web' },
]

export function detectPort(output: string): { port: number; type: 'web' | 'mobile' | 'api' } | null {
  // Strip ANSI codes
  const clean = output.replace(/\x1b\[[0-9;]*m/g, '')

  for (const pattern of PORT_PATTERNS) {
    const match = clean.match(pattern)
    if (match) {
      const port = parseInt(match[1])
      if (port > 0 && port < 65536) {
        // Determine type from context
        let type: 'web' | 'mobile' | 'api' = 'web'
        for (const hint of TYPE_HINTS) {
          if (hint.pattern.test(clean)) {
            type = hint.type
            break
          }
        }
        return { port, type }
      }
    }
  }
  return null
}
