export interface AgentDef {
  id: string
  name: string
  role: string
  color: string
  darkColor: string
  bgColor: string
  accessories: string[]
  systemPromptHint: string
}

export const AGENTS: AgentDef[] = [
  {
    id: 'aya', name: 'Aya', role: 'Full-stack Developer',
    color: '#534AB7', darkColor: '#3C3489', bgColor: '#EEEDFE',
    accessories: ['beanie'],
    systemPromptHint: 'Fast prototyper. Minimal plan, lots of iteration, many commits.',
  },
  {
    id: 'ben', name: 'Ben', role: 'Software Architect',
    color: '#1D9E75', darkColor: '#0F6E56', bgColor: '#E1F5EE',
    accessories: ['glasses'],
    systemPromptHint: 'Think before writing. Design doc first, architecture decisions, trade-off analysis.',
  },
  {
    id: 'mia', name: 'Mia', role: 'DevOps / Infra',
    color: '#D85A30', darkColor: '#A8441E', bgColor: '#FAECE7',
    accessories: ['bandana'],
    systemPromptHint: 'If it works, automate it. CI/CD, Docker, deploy, monitoring, rollback.',
  },
  {
    id: 'leo', name: 'Leo', role: 'Researcher / Analyst',
    color: '#BA7517', darkColor: '#8A5810', bgColor: '#FAEEDA',
    accessories: ['beard'],
    systemPromptHint: 'Deep research, compare alternatives, produce decision reports.',
  },
  {
    id: 'zara', name: 'Zara', role: 'QA / Code Reviewer',
    color: '#D4537E', darkColor: '#A33D5E', bgColor: '#FBEAF0',
    accessories: ['headphones'],
    systemPromptHint: 'Review every line. Ask about edge cases, write tests, find bugs. Defensive coding.',
  },
  {
    id: 'kai', name: 'Kai', role: 'UI/UX Designer',
    color: '#378ADD', darkColor: '#2568A8', bgColor: '#E6F1FB',
    accessories: ['pencil'],
    systemPromptHint: 'Think in components. Design system, responsive, accessibility, pixel perfect.',
  },
  {
    id: 'nyx', name: 'Nyx', role: 'Growth / SEO',
    color: '#639922', darkColor: '#4A7318', bgColor: '#EAF3DE',
    accessories: ['sunglasses'],
    systemPromptHint: 'Traffic, conversion, content strategy. SEO technical, meta tags, schema markup.',
  },
  {
    id: 'sam', name: 'Sam', role: 'Security Engineer',
    color: '#E24B4A', darkColor: '#B33938', bgColor: '#FCEBEB',
    accessories: ['hoodie-black'],
    systemPromptHint: 'Attack every endpoint. XSS, injection, auth bypass. OWASP top 10, security audit.',
  },
  {
    id: 'rio', name: 'Rio', role: 'SaaS Builder',
    color: '#993556', darkColor: '#732840', bgColor: '#F5E0EA',
    accessories: ['jacket'],
    systemPromptHint: 'MVP builder. Auth, payment, landing page, onboarding — full SaaS skeleton in a day.',
  },
  {
    id: 'dex', name: 'Dex', role: 'Data / Automation',
    color: '#5F5E5A', darkColor: '#3D3C3A', bgColor: '#F1EFE8',
    accessories: [],
    systemPromptHint: 'Data pipelines, API integrations, cron jobs, automation scripts.',
  },
  {
    id: 'eve', name: 'Eve', role: 'AI / ML Engineer',
    color: '#854F0B', darkColor: '#633B08', bgColor: '#FAEEDA',
    accessories: ['bun'],
    systemPromptHint: 'LLM integration, embeddings, vector DB, prompt chains, RAG pipelines.',
  },
  {
    id: 'teo', name: 'Teo', role: 'Tech Writer / Docs',
    color: '#0F6E56', darkColor: '#0A4F3D', bgColor: '#E1F5EE',
    accessories: ['glasses', 'book'],
    systemPromptHint: 'README, API docs, JSDoc/TSDoc, changelog, clean comments.',
  },
]
