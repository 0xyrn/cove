export interface SkillDef {
  id: string
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export const SKILLS: SkillDef[] = [
  { id: 'github', name: 'GitHub', description: 'PR status, issues, actions, review', icon: '📦', color: '#2a2a2e', bgColor: '#F1EFE8' },
  { id: 'sentry', name: 'Sentry', description: 'Production errors, crash logs', icon: '🐛', color: '#E24B4A', bgColor: '#FCEBEB' },
  { id: 'analytics', name: 'Analytics', description: 'Mixpanel/GA4 events, user behavior', icon: '📊', color: '#378ADD', bgColor: '#E6F1FB' },
  { id: 'figma', name: 'Figma', description: 'Design to code, design tokens', icon: '🎨', color: '#D4537E', bgColor: '#FBEAF0' },
  { id: 'linear', name: 'Linear', description: 'Tasks, sprint board, wiki', icon: '📋', color: '#534AB7', bgColor: '#EEEDFE' },
  { id: 'stripe', name: 'Stripe', description: 'Payments, subscriptions, webhooks', icon: '💳', color: '#1D9E75', bgColor: '#E1F5EE' },
  { id: 'vercel', name: 'Vercel', description: 'Deploy, preview URL, build status', icon: '🚀', color: '#BA7517', bgColor: '#FAEEDA' },
  { id: 'slack', name: 'Slack', description: 'Messages, notifications, webhooks', icon: '💬', color: '#D85A30', bgColor: '#FAECE7' },
  { id: 'gsc', name: 'Search Console', description: 'SEO performance, indexing', icon: '🔍', color: '#639922', bgColor: '#EAF3DE' },
  { id: 'supabase', name: 'Supabase', description: 'Database access, queries, migrations', icon: '🗄️', color: '#185FA5', bgColor: '#E6F1FB' },
  { id: 'cloudflare', name: 'Cloudflare', description: 'DNS, cache, WAF rules', icon: '☁️', color: '#5F5E5A', bgColor: '#F1EFE8' },
  { id: 'browser', name: 'Browser', description: 'URL fetch, screenshot, lighthouse', icon: '🌐', color: '#854F0B', bgColor: '#FAEEDA' },
]
