import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, Code, Terminal, Zap, Layers, Share2, Download, 
  Palette, Keyboard, HelpCircle, ChevronRight, ArrowLeft,
  Sparkles, Globe, Database, GitBranch, Shield
} from 'lucide-react'
import SkemlyLogo from '../assets/Skemly.png'
import DocsCanvas from '../assets/docs.png'

const T = {
  bg: '#080808',
  surface: '#111111',
  surfaceHi: '#161616',
  border: '#1f1f1f',
  borderHi: '#2a2a2a',
  text: '#f2f0eb',
  textSub: '#8a8680',
  textMuted: '#3d3d3b',
  accent: '#c9b89a',
  accentDim: '#8a7d68',
  font: "'DM Sans', -apple-system, sans-serif",
  fontSerif: "'Cormorant Garamond', Georgia, serif",
  fontMono: "'DM Mono', 'Fira Code', monospace",
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
    code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
    description: 'Visualize processes and decision trees'
  },
  {
    title: 'System Architecture',
    code: `graph LR
    Client -->|HTTPS| LB[Load Balancer]
    LB --> API1[API Server 1]
    LB --> API2[API Server 2]
    API1 --> Cache[(Redis)]
    API2 --> Cache
    API1 --> DB[(Postgres)]
    API2 --> DB`,
    description: 'Document your infrastructure'
  },
  {
    title: 'Class Diagram',
    code: `classDiagram
    class User {
      +String email
      +String name
      +login()
      +logout()
    }
    class Order {
      +Int id
      +Date date
      +placeOrder()
    }
    User "1" --> "*" Order : places`,
    description: 'Model object-oriented systems'
  },
  {
    title: 'Sequence Diagram',
    code: `sequenceDiagram
    User->>+API: POST /login
    API->>+DB: Validate credentials
    DB-->>-API: User data
    API->>+Cache: Store session
    Cache-->>-API: OK
    API-->>-User: JWT Token`,
    description: 'Show interaction between components'
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
  { q: 'Is Skemly free to use?', a: 'Yes! Skemly has a generous free tier with 10 diagrams, 5 AI generations, and basic features. Upgrade to Starter (₹20/mo) or Basic (₹40/mo) for more power.' },
  { q: 'What file formats can I export to?', a: 'You can export diagrams as PNG, SVG, or PDF. Pro plans include high-resolution exports without watermarks.' },
  { q: 'Can I use Skemly offline?', a: 'Currently, Skemly requires an internet connection. We\'re working on offline support for the future.' },
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
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font }}>
      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 64, background: `rgba(8,8,8,0.95)`, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.div whileHover={{ scale: 1.02 }} transition={SP_BOUNCY} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src={SkemlyLogo} alt="Skemly" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Skemly</span>
          </motion.div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.a href="/" whileHover={{ color: T.text }} style={{ padding: '8px 16px', fontSize: 14, color: T.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={16} /> Back to Home
            </motion.a>
            <motion.a href="/editor" whileHover={{ scale: 1.02 }} style={{ padding: '10px 20px', fontSize: 14, fontWeight: 500, background: T.text, color: T.bg, borderRadius: 6, textDecoration: 'none' }}>
              Open Editor
            </motion.a>
          </div>
        </div>
      </nav>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* ── SIDEBAR ── */}
        <aside style={{ width: 280, flexShrink: 0, flexGrow: 0, borderRight: `1px solid ${T.border}`, background: T.surface, position: 'sticky', top: 64, alignSelf: 'flex-start', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
            {/* Logo */}
            <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.border}` }}>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                <img src={SkemlyLogo} alt="Skemly" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Skemly</span>
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
        <main style={{ flex: 1, padding: '48px 64px', minHeight: 'calc(100vh - 64px)' }}>
          {/* Getting Started */}
          <section id="getting-started" style={{ marginBottom: 80 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SP_SOFT}>
              <div style={{ fontSize: 11, color: T.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Documentation</div>
              <h1 style={{ fontSize: 42, fontWeight: 600, marginBottom: 20, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Getting Started with Skemly</h1>
              <p style={{ fontSize: 18, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
                Skemly is the fastest way to create professional system diagrams. Write code or use AI — 
                your diagrams update in real-time.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
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
                    <span style={{ marginLeft: 12, fontSize: 12, color: T.textMuted, fontFamily: T.fontMono }}>Skemly Editor</span>
                  </div>
                  {/* Canvas Image */}
                  <img 
                    src={DocsCanvas} 
                    alt="Skemly Editor Canvas" 
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
                    boxShadow: 'inset 0 0 60px rgba(201,184,154,0.05)'
                  }} />
                </motion.div>
                <p style={{ fontSize: 14, color: T.textSub, marginTop: 16, textAlign: 'center' }}>
                  The Skemly canvas — where code meets visual design. Write on the left, see diagrams on the right.
                </p>
              </div>

              <motion.a href="/editor" whileHover={{ scale: 1.02 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: T.text, color: T.bg, borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
                <Zap size={18} /> Create Your First Diagram
              </motion.a>
            </motion.div>
          </section>

          {/* Syntax */}
          <section id="syntax" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, fontFamily: T.fontSerif, fontStyle: 'italic' }}>Diagram Syntax</h2>
            <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32 }}>
              Skemly uses a clean, intuitive syntax inspired by Mermaid. Write text, see diagrams instantly.
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
              Describe your system in plain English, and Skemly AI will generate a complete diagram for you.
            </p>

            <div style={{ padding: 32, background: `linear-gradient(135deg, ${T.surface} 0%, ${T.surfaceHi} 100%)`, borderRadius: 16, border: `1px solid ${T.border}`, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(201,184,154,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  { title: 'Generate', desc: 'Press Ctrl/Cmd + / or click the AI button to generate your diagram' },
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {[
                { title: 'Drag & Drop', desc: 'Move nodes anywhere on the infinite canvas' },
                { title: 'Auto Layout', desc: 'Let Skemly arrange your diagram beautifully' },
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

            <div style={{ marginTop: 32, padding: 24, background: `rgba(201,184,154,0.05)`, borderRadius: 12, border: `1px solid ${T.accentDim}` }}>
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
              Skemly is built for every type of technical documentation. Here's how teams use it.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {USE_CASES.map((useCase, i) => {
                const Icon = useCase.icon
                return (
                  <motion.div key={i} whileHover={{ y: -4 }} style={{ padding: 28, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `rgba(201,184,154,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
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
