// Build MCP config JSON for Claude Code --mcp-config flag
// Only includes VERIFIED real MCP servers

interface McpServer {
  command: string
  args: string[]
  env?: Record<string, string>
}

// Verified MCP servers that actually exist on npm
const MCP_SERVERS: Record<string, McpServer> = {
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
  },
  browser: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
  },
  // filesystem-based tools use the official filesystem server
  supabase: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    env: { POSTGRES_CONNECTION_STRING: '' },
  },
}

// Tools without real MCP servers - shown in UI but noted as "manual"
export const MANUAL_TOOLS = new Set([
  'sentry', 'analytics', 'figma', 'linear', 'stripe',
  'vercel', 'slack', 'gsc', 'cloudflare'
])

export function buildMcpConfigJson(skillIds: string[]): string | null {
  const servers: Record<string, McpServer> = {}

  for (const skillId of skillIds) {
    const server = MCP_SERVERS[skillId]
    if (server) {
      servers[skillId] = { ...server }
      if (servers[skillId].env) {
        const env = servers[skillId].env!
        const filteredEnv: Record<string, string> = {}
        for (const [k, v] of Object.entries(env)) {
          if (v) filteredEnv[k] = v
        }
        if (Object.keys(filteredEnv).length > 0) {
          servers[skillId].env = filteredEnv
        } else {
          delete servers[skillId].env
        }
      }
    }
  }

  if (Object.keys(servers).length === 0) return null
  return JSON.stringify({ mcpServers: servers })
}
