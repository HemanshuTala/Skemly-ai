import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, Code, Terminal, Zap, Layers, Share2, Download, 
  Palette, Keyboard, HelpCircle, ChevronRight, ArrowLeft,
  Sparkles, Globe, Database, GitBranch, Shield, Menu, X
} from 'lucide-react'
import SkemlyLogo from '../assets/Skemly.png'
import DocsCanvas from '../assets/docs.png'

const T = {
  bg: '#09090b',
  surface: '#0e0e11',
  surfaceHi: '#18181b',
  border: 'rgba(255,255,255,0.06)',
  borderHi: '#27272a',
  text: '#ffffff',
  textSub: '#a1a1aa',
  textMuted: '#71717a',
  accent: '#ffffff',
  accentDim: '#71717a',
  font: '"Inter", -apple-system, sans-serif',
  fontSerif: '"Outfit", "Inter", sans-serif',
  fontMono: '"JetBrains Mono", monospace',
}

const SP_SOFT = { type: 'spring', stiffness: 100, damping: 20 }
const SP_BOUNCY = { type: 'spring', stiffness: 260, damping: 22 }

const SECTIONS = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'syntax', title: 'Diagram Syntax', icon: Code },
  { id: 'ai-generation', title: 'AI Generation', icon: Sparkles },
  { id: 'editor', title: 'Visual Editor', icon: Palette },
  { id: 'shortcuts', title: 'Keyboard Shortcuts', icon: Keyboard },
  { id: 'export', title: 'Export & Share', icon: Share2 },
  { id: 'use-cases', title: 'Use Cases', icon: Layers },
  { id: 'faq', title: 'FAQ', icon: HelpCircle },
]

const DIAGRAM_EXAMPLES = [
  {
    title: 'Flowchart',
    code: `(Start) --> [Validate Input]
[Validate Input] --> {Input Valid?}
{Input Valid?} -- Yes --> [Process Data]
{Input Valid?} -- No --> [Show Error]
[Show Error] --> [Validate Input]
[Process Data] --> (End)`,
    description: 'Visualize processes and decision trees'
  },
  {
    title: 'System Architecture',
    code: `[Client App] -- HTTPS --> [Load Balancer]
[Load Balancer] --> [API Server 1]
[Load Balancer] --> [API Server 2]
[API Server 1] --> [[Redis Cache]]
[API Server 2] --> [[Redis Cache]]
[API Server 1] --> [[PostgreSQL]]`,
    description: 'Document your infrastructure'
  },
  {
    title: 'Event Pipeline',
    code: `[Application] --> [Event Ingest]
[Event Ingest] --> [[Kafka Stream]]
[[Kafka Stream]] --> [Notification Worker]
[[Kafka Stream]] --> [Analytics Worker]
[Notification Worker] --> [Email Provider]
[Analytics Worker] --> [[Warehouse]]`,
    description: 'Map event producers, streams, and consumers'
  },
  {
    title: 'Authentication Flow',
    code: `[User] -- Sign in --> [Web App]
[Web App] --> [Auth Service]
[Auth Service] --> [[User Database]]
[Auth Service] -- Valid token --> [API]
[API] --> [Web App]`,
    description: 'Show authentication services and their connections'
  },
]

const SHORTCUTS = [
  { key: 'Ctrl/Cmd + S', action: 'Save diagram' },
  { key: 'Ctrl/Cmd + Z', action: 'Undo' },
  { key: 'Ctrl/Cmd + Shift + Z', action: 'Redo' },
  { key: 'Ctrl/Cmd + D', action: 'Duplicate selection' },
  { key: 'Delete / Backspace', action: 'Delete selection' },
  { key: 'Ctrl/Cmd + E', action: 'Export diagram' },
  { key: 'Ctrl/Cmd + A', action: 'Select all' },
  { key: 'Space + Drag', action: 'Pan canvas' },
  { key: 'Ctrl/Cmd + Scroll', action: 'Zoom in/out' },
  { key: 'Ctrl/Cmd + /', action: 'Toggle AI panel' },
]

const USE_CASES = [
  { icon: Globe, title: 'Cloud Infrastructure', desc: 'Document AWS, GCP, or Azure architectures with all services and connections.' },
  { icon: Database, title: 'Database Design', desc: 'Create ER diagrams and schema visualizations for your data models.' },
  { icon: GitBranch, title: 'API Documentation', desc: 'Visualize API flows, request/response cycles, and endpoint relationships.' },
  { icon: Shield, title: 'Security Architecture', desc: 'Map out security layers, authentication flows, and access controls.' },
  { icon: Zap, title: 'Microservices', desc: 'Show service dependencies, communication patterns, and data flows.' },
  { icon: Layers, title: 'System Design', desc: 'Design scalable systems for interviews or documentation.' },
]

const FAQS = [
  { q: 'Is Schemely AI free to use?', a: 'Yes! Schemely has a generous free tier with 10 diagrams, 5 AI generations, and basic features. Upgrade to Starter (₹20/mo) or Basic (₹40/mo) for more power.' },
  { q: 'What file formats can I export to?', a: 'You can export diagrams as PNG, SVG, or PDF. Pro plans include high-resolution exports without watermarks.' },
  { q: 'Can I use Schemely AI offline?', a: 'Currently, Schemely requires an internet connection. We\'re working on offline support for the future.' },
  { q: 'How does AI generation work?', a: 'Describe your system in plain English, and our AI will generate a complete diagram. Edit it visually or in code as needed.' },
  { q: 'Is my data secure?', a: 'Absolutely. All diagrams are encrypted at rest and in transit. We never train AI on your private diagrams.' },
  { q: 'Can I collaborate with my team?', a: 'Team collaboration is available on Basic and higher plans. Share diagrams, leave comments, and work together in real-time.' },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: T.bg, color: T.text, fontFamily: T.font }}>
      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 64, background: `rgba(9,9,11,0.95)`, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}` }}>
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-6" style={{ margin: '0 auto' }}>
          <motion.div whileHover={{ scale: 1.02 }} transition={SP_BOUNCY} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src={SkemlyLogo} alt="Schemely AI" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Schemely AI</span>
          </motion.div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.a href="/" whileHover={{ color: T.text }} className="hidden items-center gap-1.5 px-3 py-2 text-sm no-underline sm:flex" style={{ fontSize: 14, color: T.textMuted }}>
              <ArrowLeft size={16} /> Back to Home
            </motion.a>
            <motion.a href="/diagram/new" whileHover={{ scale: 1.02 }} className="rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition hover:opacity-90 sm:px-5" style={{ fontSize: 14, background: T.text, color: T.bg }}>
              Open Editor
            </motion.a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close documentation navigation' : 'Open documentation navigation'}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/[0.06] md:hidden"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-16 z-50 grid gap-1 border-b border-white/[0.08] bg-[#0e0e11] p-3 shadow-2xl md:hidden">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${activeSection === section.id ? 'bg-white/[0.07] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
                >
                  <Icon size={16} />
                  {section.title}
                </button>
              )
            })}
          </div>
        )}
      </nav>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* ── SIDEBAR ── */}
        <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.06] bg-[#0e0e11] md:sticky md:top-16 md:block md:h-[calc(100vh-64px)] md:overflow-y-auto" style={{ flexGrow: 0, alignSelf: 'flex-start' }}>
            {/* Logo */}
            <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.border}` }}>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                <img src={SkemlyLogo} alt="Schemely AI" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Schemely AI</span>
              </a>
            </div>

            {/* Nav */}
            <div style={{ padding: '24px 20px' }}>
              <h2 style={{ fontSize: 11, fontWeight: 600, color: T.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Documentation</h2>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {SECTIONS.map(section => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      whileHover={{ x: 4 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: isActive ? T.bg : 'transparent',
                        color: isActive ? T.text : T.textSub,
                        fontSize: 14,
                        fontWeight: isActive ? 500 : 400,
                        cursor: 'pointer',
                        fontFamily: T.font,
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <Icon size={16} color={isActive ? T.accent : T.textMuted} />
                      {section.title}
                    </motion.button>
                  )
                })}
              </nav>
            </div>
          </aside>

        {/* ── CONTENT ── */}
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12" style={{ minHeight: 'calc(100vh - 64px)' }}>
          {/* Getting Started */}
          <section id="getting-started" style={{ marginBottom: 80 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SP_SOFT}>
              <div style={{ fontSize: 11, color: T.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Documentation</div>
              <h1 className="text-3xl sm:text-4xl" style={{ fontWeight: 600, marginBottom: 20, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Getting Started with Schemely AI</h1>
              <p style={{ fontSize: 18, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
                Schemely AI is the fastest way to create professional system diagrams. Write code or use AI — 
                your diagrams update in real-time.
              </p>
              
              <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { step: '1', title: 'Create', desc: 'Start from scratch or use AI to generate a diagram' },
                  { step: '2', title: 'Edit', desc: 'Refine visually or in code — changes sync both ways' },
                  { step: '3', title: 'Share', desc: 'Export, embed, or collaborate with your team' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 24, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: T.bg, marginBottom: 16 }}>{item.step}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Canvas Showcase */}
              <div style={{ marginBottom: 48 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Palette size={22} color={T.accent} /> The Editor
                </h3>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.2, duration: 0.6 }}
                  style={{ 
                    position: 'relative',
                    borderRadius: 16, 
                    overflow: 'hidden',
                    border: `1px solid ${T.border}`,
                    boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5)`
                  }}
                >
                  {/* Window Controls */}
                  <div style={{ 
                    height: 40, 
                    background: T.surfaceHi, 
                    borderBottom: `1px solid ${T.border}`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 16px', 
                    gap: 8 
                  }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                    <span style={{ marginLeft: 12, fontSize: 12, color: T.textMuted, fontFamily: T.fontMono }}>Schemely AI Editor</span>
                  </div>
                  {/* Canvas Image */}
                  <img 
                    src={DocsCanvas} 
                    alt="Schemely AI Editor Canvas" 
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      display: 'block' 
                    }} 
                  />
                  {/* Glow Effect */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    boxShadow: 'inset 0 0 60px rgba(255,255,255,0.03)'
                  }} />
                </motion.div>
                <p style={{ fontSize: 14, color: T.textSub, marginTop: 16, textAlign: 'center' }}>
                  The Schemely AI canvas — where code meets visual design. Write on the left, see diagrams on the right.
                </p>
              </div>

              <motion.a href="/dashboard" whileHover={{ scale: 1.02 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: T.text, color: T.bg, borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
                <Zap size={18} /> Create Your First Diagram
              </motion.a>
            </motion.div>
          </section>

          {/* Syntax */}
          <section id="syntax" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Diagram Syntax</h2>
            <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
              Use bracketed nodes, arrows, and optional edge labels to describe a diagram. Your canvas updates as you edit.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {DIAGRAM_EXAMPLES.map((example, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, ...SP_SOFT }}>
                  <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Code size={20} color={T.accent} /> {example.title}
                  </h3>
                  <p style={{ fontSize: 14, color: T.textSub, marginBottom: 16 }}>{example.description}</p>
                  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: T.surfaceHi, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Terminal size={14} color={T.accent} />
                      <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.fontMono }}>diagram.skm</span>
                    </div>
                    <pre style={{ padding: 20, margin: 0, fontSize: 13, fontFamily: T.fontMono, color: T.textSub, lineHeight: 1.8, overflow: 'auto' }}>{example.code}</pre>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* AI Generation */}
          <section id="ai-generation" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>AI Generation</h2>
            <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
              Describe your system in plain English, and Schemely AI will generate a complete diagram for you.
            </p>

            <div style={{ padding: 32, background: `linear-gradient(135deg, ${T.surface} 0%, ${T.surfaceHi} 100%)`, borderRadius: 16, border: `1px solid ${T.border}`, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color={T.accent} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>How it works</h3>
                  <p style={{ fontSize: 14, color: T.textSub }}>5 AI generations included on free plan</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: 'Describe', desc: 'Type a description like "E-commerce system with React frontend, Node.js API, and PostgreSQL database"' },
                  { title: 'Generate', desc: 'Describe the architecture, then review the AI proposal before applying it to your diagram.' },
                  { title: 'Refine', desc: 'Edit the generated code or use the visual editor to make adjustments' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: T.bg, flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{step.title}</h4>
                      <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 24, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: T.accent, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Example Prompts</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Microservices architecture with API gateway, auth service, payment service, and notification service',
                  'React component hierarchy for a dashboard with sidebar, header, main content, and footer',
                  'AWS infrastructure with S3, CloudFront, EC2, RDS, and ElastiCache',
                  'OAuth 2.0 flow showing user, client app, authorization server, and resource server',
                ].map((prompt, i) => (
                  <li key={i} style={{ fontSize: 14, color: T.textSub, padding: '12px 16px', background: T.bg, borderRadius: 8, fontFamily: T.font }}>{prompt}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Visual Editor */}
          <section id="editor" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Visual Editor</h2>
            <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
              Drag, drop, and connect. The visual editor gives you pixel-perfect control over your diagrams.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { title: 'Drag & Drop', desc: 'Move nodes anywhere on the infinite canvas' },
                { title: 'Auto Layout', desc: 'Let Schemely AI arrange your diagram beautifully' },
                { title: 'Custom Styling', desc: 'Change colors, fonts, and shapes' },
                { title: 'Zoom & Pan', desc: 'Navigate large diagrams with ease' },
                { title: 'Snap to Grid', desc: 'Align elements perfectly' },
                { title: 'Undo History', desc: 'Never lose your work with version history' },
              ].map((feature, i) => (
                <div key={i} style={{ padding: 20, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{feature.title}</h4>
                  <p style={{ fontSize: 14, color: T.textSub }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section id="shortcuts" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Keyboard Shortcuts</h2>
            <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
              Work faster with keyboard shortcuts. Press <kbd style={{ padding: '4px 8px', background: T.surface, borderRadius: 4, fontFamily: T.fontMono, fontSize: 13 }}>?</kbd> anytime in the editor to see this list.
            </p>

            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {SHORTCUTS.map((shortcut, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < SHORTCUTS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.textSub }}>{shortcut.action}</span>
                  <kbd style={{ padding: '6px 12px', background: T.bg, borderRadius: 6, fontFamily: T.fontMono, fontSize: 12, color: T.text, border: `1px solid ${T.border}` }}>{shortcut.key}</kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Export & Share */}
          <section id="export" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Export & Share</h2>
            <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
              Get your diagrams where they need to go. Multiple formats, instant sharing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { icon: Download, title: 'PNG', desc: 'High-res raster images for presentations' },
                { icon: Download, title: 'SVG', desc: 'Scalable vectors for web and print' },
                { icon: Download, title: 'PDF', desc: 'Professional documents for sharing' },
              ].map((format, i) => {
                const Icon = format.icon
                return (
                  <div key={i} style={{ padding: 28, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Icon size={24} color={T.accent} />
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{format.title}</h4>
                    <p style={{ fontSize: 14, color: T.textSub }}>{format.desc}</p>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 32, padding: 24, background: `rgba(255,255,255,0.02)`, borderRadius: 12, border: `1px solid ${T.borderHi}` }}>
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={18} color={T.accent} /> Share Links
              </h4>
              <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>
                Generate public or password-protected links to share your diagrams. Recipients can view 
                without signing up. Perfect for embedding in documentation or sending to clients.
              </p>
            </div>
          </section>

          {/* Use Cases */}
          <section id="use-cases" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Use Cases</h2>
            <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
              Schemely AI is built for every type of technical documentation. Here's how teams use it.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {USE_CASES.map((useCase, i) => {
                const Icon = useCase.icon
                return (
                  <motion.div key={i} whileHover={{ y: -4 }} style={{ padding: 28, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Icon size={22} color={T.accent} />
                    </div>
                    <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{useCase.title}</h4>
                    <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{useCase.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Frequently Asked Questions</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {FAQS.map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, ...SP_SOFT }} style={{ padding: 24, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HelpCircle size={18} color={T.accent} /> {faq.q}
                  </h4>
                  <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7 }}>{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section style={{ textAlign: 'center', padding: '48px 32px', background: `linear-gradient(135deg, ${T.surface} 0%, ${T.surfaceHi} 100%)`, borderRadius: 16, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Ready to start diagramming?</h3>
            <p style={{ fontSize: 16, color: T.textSub, marginBottom: 24 }}>Create your first diagram in seconds — no credit card required.</p>
            <motion.a href="/editor" whileHover={{ scale: 1.02 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: T.text, color: T.bg, borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
              Get Started Free <ChevronRight size={18} />
            </motion.a>
          </section>
        </main>
      </div>
    </div>
  )
}
