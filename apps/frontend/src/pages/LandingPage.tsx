import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence, useSpring, useMotionValue, animate } from 'framer-motion'
import { ArrowRight, MousePointer2, Cpu, Globe, Database, GitBranch, Shield, LayoutTemplate, Terminal, Sparkles, PenTool, Star, Network, Workflow, Braces, Zap, Check, ArrowUpRight, Layers, Loader2 } from 'lucide-react'
import SkemlyLogo from '../assets/Skemly.png'
import docsImage from '../assets/docs.png'
import { useAuthStore } from '@/stores/authStore'
import { billingAPI } from '@/services/api.service'
import toast from 'react-hot-toast'

/* ── Font injection ── */
;(function injectFonts() {
  if (document.getElementById('skemly-fonts')) return
  const link = document.createElement('link')
  link.id = 'skemly-fonts'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap'
  document.head.appendChild(link)
})()

/* ── Design Tokens ── */
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
  green: '#4ade80',
  font: "'DM Sans', -apple-system, sans-serif",
  fontSerif: "'Cormorant Garamond', Georgia, serif",
  fontMono: "'DM Mono', 'Fira Code', monospace",
  nodeR: 8,
}

const SP_SOFT = { type: 'spring', stiffness: 100, damping: 20 }
const SP_BOUNCY = { type: 'spring', stiffness: 260, damping: 22 }
const SP_SLOW = { type: 'spring', stiffness: 50, damping: 18 }

/* ── Data ── */
const FEATURES = [
  { icon: Braces, tag: '01', title: 'Code syntax', desc: 'Write diagrams with clean, predictable syntax. Structure your thinking, let Skemly render it beautifully.' },
  { icon: Sparkles, tag: '02', title: 'AI generation', desc: 'Describe your system in plain English. Skemly understands architecture and produces exact diagrams instantly.' },
  { icon: MousePointer2, tag: '03', title: 'Visual canvas', desc: 'Infinite workspace. Drag, align, and refine. Export to SVG, PNG, Notion, and Confluence.' },
]
const USE_CASES = [
  { icon: Cpu, label: 'System Design' },
  { icon: Globe, label: 'Cloud Infra' },
  { icon: Database, label: 'Data Flows' },
  { icon: GitBranch, label: 'API Design' },
  { icon: Shield, label: 'Security' },
  { icon: Network, label: 'Microservices' },
  { icon: LayoutTemplate, label: 'Wireframes' },
  { icon: Workflow, label: 'Workflows' },
]
const TESTIMONIALS = [
  { name: 'Alex Chen', role: 'Senior Architect, Stripe', text: 'Every PR we ship now includes a Skemly diagram. It fundamentally changed how our team reviews architecture decisions.', initial: 'A' },
  { name: 'Sarah Miller', role: 'Engineering Lead, Linear', text: 'I describe a system in one sentence and get back exactly what I would have drawn in two hours. Remarkable.', initial: 'S' },
  { name: 'James Wilson', role: 'CTO, Vercel', text: 'Nothing else comes close for documenting how our systems actually work at scale. It\'s become essential.', initial: 'J' },
]
const CODE_LINES = [
  { t: 'graph TD', indent: 0 },
  { t: 'Client[Browser] -->|HTTPS| LB', indent: 1, hi: false },
  { t: 'LB --> API1[API Server 1]', indent: 1, hi: false },
  { t: 'LB --> API2[API Server 2]', indent: 1, hi: false },
  { t: 'API1 --> Cache[(Redis)]', indent: 1, hi: true },
  { t: 'API2 --> Cache', indent: 1, hi: true },
  { t: 'API1 --> DB[(Postgres)]', indent: 1, hi: true },
  { t: 'API2 --> DB', indent: 1, hi: true },
]
const BRANDS = ['Stripe','Vercel','Linear','Notion','Figma','GitHub','Datadog','Cloudflare','Loom','PlanetScale']

/* ── UTILS ── */
function Counter({ target }: { target: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  useEffect(() => {
    if (!inView) return
    const end = parseInt(target.replace(/\D/g, ''))
    const ctrl = animate(0, end, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: v => setVal(Math.round(v)) })
    return () => ctrl.stop()
  }, [inView, target])
  const pre = target.match(/^[^\d]*/)?.[0] || ''
  const post = target.match(/[^\d]*$/)?.[0] || ''
  return <span ref={ref}>{pre}{val.toLocaleString()}{post}</span>
}

function Typewriter({ lines }: { lines: string[] }) {
  const [txt, setTxt] = useState('')
  const [li, setLi] = useState(0)
  const [ci, setCi] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const cur = lines[li]
    if (!del && ci < cur.length) { const t = setTimeout(() => { setTxt(cur.slice(0,ci+1)); setCi(c=>c+1) }, 50); return () => clearTimeout(t) }
    if (!del && ci === cur.length) { const t = setTimeout(() => setDel(true), 2400); return () => clearTimeout(t) }
    if (del && ci > 0) { const t = setTimeout(() => { setTxt(cur.slice(0,ci-1)); setCi(c=>c-1) }, 24); return () => clearTimeout(t) }
    if (del && ci === 0) { setDel(false); setLi(i => (i+1) % lines.length) }
  }, [ci, del, li, lines])
  return (
    <span>
      <span style={{ color: T.accent, fontStyle: 'italic', fontFamily: T.fontSerif, fontWeight: 300, fontSize: '1.05em' }}>{txt}</span>
      <span style={{ opacity: 0.25, fontFamily: T.fontMono, fontSize: '0.85em', animation: 'blink 1s step-end infinite' }}>|</span>
    </span>
  )
}

function MagneticBtn({ children, style = {}, onClick, variant = 'solid' }: { children: React.ReactNode, style?: React.CSSProperties, onClick?: () => void, variant?: 'solid' | 'ghost' }) {
  const ref = useRef<HTMLButtonElement>(null)
  const mx = useMotionValue(0); const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 180, damping: 16 })
  const sy = useSpring(my, { stiffness: 180, damping: 16 })
  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left - r.width/2) * 0.3)
    my.set((e.clientY - r.top - r.height/2) * 0.3)
  }, [mx, my])
  const onLeave = useCallback(() => { mx.set(0); my.set(0) }, [mx, my])
  const solid = { background: T.text, color: T.bg, border: 'none' }
  const ghost = { background: 'transparent', color: T.textSub, border: `1px solid ${T.border}` }
  return (
    <motion.button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}
      style={{ ...(variant === 'solid' ? solid : ghost), x: sx, y: sy, padding: '10px 24px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: T.font, display: 'inline-flex', alignItems: 'center', gap: 7, letterSpacing: '-0.01em', ...style }}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SP_BOUNCY}>
      {children}
    </motion.button>
  )
}

/* ── COMPONENTS ── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  return <motion.div style={{ position: 'fixed', top: 64, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${T.accent}, ${T.accentDim})`, transformOrigin: '0%', scaleX, zIndex: 200, opacity: 0.7 }} />
}

function DiagramCanvas() {
  const NODES = [
    { label: 'Browser', x: 151, y: 14, d: 0.3 },
    { label: 'Load Balancer', x: 124, y: 88, d: 0.45, sel: true },
    { label: 'API Server 1', x: 26, y: 172, d: 0.6 },
    { label: 'API Server 2', x: 240, y: 172, d: 0.6 },
    { label: 'Redis', x: 26, y: 256, d: 0.78 },
    { label: 'Postgres', x: 240, y: 256, d: 0.78 },
  ]
  const EDGES = [
    { d: 'M 205 48 C 205 70 188 70 188 88', delay: 0.5 },
    { d: 'M 178 122 C 178 148 82 148 82 172', delay: 0.6 },
    { d: 'M 188 122 C 188 148 296 148 296 172', delay: 0.65 },
    { d: 'M 82 206 L 82 256', delay: 0.78 },
    { d: 'M 296 206 L 296 256', delay: 0.78 },
    { d: 'M 136 272 L 240 272', delay: 0.86 },
  ]
  return (
    <div style={{ background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${T.border} 1px, transparent 1px)`, backgroundSize: '22px 22px', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ height: 42, background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 7, zIndex: 2, position: 'relative' }}>
        {['#ff5f57','#febc2e','#28c840'].map((c,i)=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:c}}/>)}
        <span style={{ marginLeft:10, fontSize:11.5, color:T.textSub, fontFamily:T.fontMono }}>architecture.skm</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:14 }}>
          {['Export','Share'].map(l=><span key={l} style={{fontSize:11,color:T.textMuted,fontFamily:T.font}}>{l}</span>)}
        </div>
      </div>
      <div style={{ display:'flex', height:340, position:'relative' }}>
        <div style={{ width:40, background:T.surface, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:14, zIndex:2 }}>
          {[MousePointer2,Network,PenTool,Database].map((Icon,i)=>(
            <motion.div key={i} whileHover={{ scale:1.2 }} style={{ cursor:'pointer' }}>
              <Icon size={13} color={i===0 ? T.accent : T.textMuted} />
            </motion.div>
          ))}
        </div>
        <div style={{ flex:1, position:'relative', zIndex:1 }}>
          <svg width="100%" height="100%" viewBox="0 0 420 310">
            {EDGES.map((e,i)=>(
              <motion.path key={i} d={e.d} fill="none" stroke={T.borderHi} strokeWidth={1}
                initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }}
                transition={{ pathLength: { delay:e.delay, duration:0.65, ease:'easeOut' }, opacity: { delay:e.delay, duration:0.15 } }} />
            ))}
            {NODES.map(n=>(
              <motion.g key={n.label} initial={{ opacity:0, scale:0.7, y:-10 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ delay:n.d, ...SP_BOUNCY }} whileHover={{ scale:1.03 }} style={{ cursor:'pointer' }}>
                <rect x={n.x} y={n.y} width={118} height={34} rx={T.nodeR} fill={T.surface} stroke={n.sel ? T.accent : T.border} strokeWidth={1} />
                {n.sel && <rect x={n.x} y={n.y} width={118} height={34} rx={T.nodeR} fill="rgba(201,184,154,0.04)" />}
                <text x={n.x+59} y={n.y+22} textAnchor="middle" fill={n.sel ? T.accent : T.text} fontSize={11.5} fontFamily={T.font} fontWeight={n.sel?600:400}>{n.label}</text>
              </motion.g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}

function CodeEditor() {
  return (
    <div style={{ background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ height: 42, background: T.surface, borderBottom: `1px solid ${T.border}`, display:'flex', alignItems:'center', padding:'0 14px', gap:7 }}>
        {['#ff5f57','#febc2e','#28c840'].map((c,i)=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:c}}/>)}
        <span style={{ marginLeft:10, fontSize:11.5, color:T.textSub, fontFamily:T.fontMono }}>diagram.skm</span>
        <motion.div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:T.green }} animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.8, repeat:Infinity }} />
      </div>
      <div style={{ padding:'16px 18px', lineHeight:1.9 }}>
        {CODE_LINES.map((line,i)=>(
          <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.28+i*0.055, ...SP_SOFT }} style={{ display:'flex', gap:14, alignItems:'baseline' }}>
            <span style={{ color:T.textMuted, minWidth:16, fontSize:10.5, userSelect:'none', textAlign:'right', fontFamily:T.fontMono }}>{i+1}</span>
            <span style={{ fontSize:12, color: line.indent === 0 ? T.accent : (line.hi ? T.textSub : T.textMuted), fontFamily:T.fontMono, paddingLeft: line.indent ? 16 : 0 }}>{line.t}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Marquee() {
  const doubled = [...BRANDS, ...BRANDS]
  return (
    <div style={{ borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:'12px 0', overflow:'hidden', background:T.surface, position:'relative', zIndex:1 }}>
      <div style={{ display:'flex', gap:52, whiteSpace:'nowrap', animation:'marquee 28s linear infinite', fontSize:11.5, color:T.textMuted, fontWeight:500, letterSpacing:'0.06em', willChange:'transform', fontFamily:T.font }}>
        {doubled.map((n,i)=>(
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ color:T.textMuted, opacity:0.4 }}>◆</span>{n.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProcessSteps() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const STEPS = [
    { num:'01', icon:Terminal, title:'Write or describe', desc:'Use Skemly syntax, or describe your architecture in plain English.' },
    { num:'02', icon:Sparkles, title:'AI generates it', desc:'Get precise, production-quality diagrams in under a second.' },
    { num:'03', icon:PenTool, title:'Refine and share', desc:'Edit on the canvas. Export to SVG, PNG, or embed anywhere.' },
  ]
  return (
    <div ref={ref} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40, position:'relative' }}>
      <svg style={{ position:'absolute', top:20, left:'16%', width:'68%', height:2, overflow:'visible' }} viewBox="0 0 100 2" preserveAspectRatio="none">
        <motion.line x1="0" y1="1" x2="100" y2="1" stroke={T.border} strokeWidth="0.6" strokeDasharray="4 4" initial={{ pathLength:0 }} animate={inView ? { pathLength:1 } : {}} transition={{ duration:1, delay:0.3, ease:'easeOut' }} />
      </svg>
      {STEPS.map((s,i)=>(
        <motion.div key={i} initial={{ opacity:0, y:28 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ delay:0.2+i*0.15, ...SP_SOFT }} style={{ textAlign:'center' }}>
          <motion.div whileHover={{ scale:1.08, borderColor:T.accentDim }} transition={SP_BOUNCY} style={{ width:42, height:42, borderRadius:10, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', position:'relative', zIndex:1, cursor:'default' }}>
            <s.icon size={16} color={T.accent} />
          </motion.div>
          <div style={{ fontSize:10, color:T.accent, fontWeight:500, letterSpacing:'0.12em', marginBottom:8, fontFamily:T.fontMono }}>{s.num}</div>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:8, fontFamily:T.font }}>{s.title}</h3>
          <p style={{ fontSize:13, color:T.textSub, lineHeight:1.7, fontFamily:T.font }}>{s.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}

function FeatureCard({ f, i, last }: { f: { tag: string, title: string, desc: string, icon: React.ComponentType<{ size?: string | number, color?: string }> }, i: number, last?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1, ...SP_SOFT }} onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)} style={{ padding:'36px 28px', background: hov ? T.surfaceHi : T.surface, borderRight: !last ? `1px solid ${T.border}` : 'none', transition:'background 0.25s', cursor:'default', position:'relative', overflow:'hidden' }}>
      <motion.div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${T.accent}, transparent)`, transformOrigin:'left', scaleX: hov ? 1 : 0 }} transition={{ duration:0.4, ease:'easeOut' }} />
      <div style={{ fontSize:10, color: hov ? T.accent : T.textMuted, fontWeight:500, letterSpacing:'0.12em', marginBottom:20, fontFamily:T.fontMono, transition:'color 0.2s' }}>{f.tag}</div>
      <motion.div animate={{ y: hov ? -2 : 0, borderColor: hov ? T.accentDim : T.border }} transition={SP_SOFT} style={{ width:38, height:38, borderRadius:9, background:T.bg, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <f.icon size={16} color={hov ? T.accent : T.textSub} />
      </motion.div>
      <h3 style={{ fontSize:14.5, fontWeight:600, color:T.text, marginBottom:10, fontFamily:T.font }}>{f.title}</h3>
      <p style={{ fontSize:13, color:T.textSub, lineHeight:1.72, fontFamily:T.font }}>{f.desc}</p>
    </motion.div>
  )
}

function TestimonialCard({ t, i }: { t: { text: string, name: string, role: string, initial: string }, i: number }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1, ...SP_SOFT }} onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)} animate={{ y: hov ? -5 : 0 }} style={{ padding:'26px', borderRadius:10, background: hov ? T.surfaceHi : T.surface, border:`1px solid ${ hov ? T.borderHi : T.border}`, cursor:'default', transition:'background 0.2s, border-color 0.2s' }}>
      <div style={{ display:'flex', gap:2, marginBottom:16 }}>
        {[...Array(5)].map((_,j)=>(
          <motion.div key={j} initial={{ opacity:0, scale:0 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ delay:i*0.1+j*0.07, ...SP_BOUNCY }}>
            <Star size={11} fill={T.accent} color={T.accent} />
          </motion.div>
        ))}
      </div>
      <p style={{ fontSize:15, color:T.textSub, lineHeight:1.75, marginBottom:20, fontFamily:T.fontSerif, fontWeight:300 }}>"{t.text}"</p>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:T.bg, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:T.accent, fontFamily:T.font }}>{t.initial}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>{t.name}</div>
          <div style={{ fontSize:11, color:T.textMuted, fontFamily:T.font }}>{t.role}</div>
        </div>
      </div>
    </motion.div>
  )
}

function FloatingOrbs() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {[{ x:'8%', y:'15%', size:320, delay:0 }, { x:'85%', y:'25%', size:240, delay:2 }, { x:'55%', y:'70%', size:180, delay:4 }, { x:'20%', y:'80%', size:200, delay:1.5 }].map((o,i)=>(
        <motion.div key={i} style={{ position:'absolute', left:o.x, top:o.y, width:o.size, height:o.size, borderRadius:'50%', background:`radial-gradient(circle, rgba(201,184,154,0.025) 0%, transparent 70%)`, filter:'blur(40px)' }} animate={{ y:[-20,20,-20], x:[-10,10,-10] }} transition={{ duration:8+i*2, delay:o.delay, repeat:Infinity, ease:'easeInOut' }} />
      ))}
    </div>
  )
}

function NoiseOverlay() {
  return <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:'180px' }} />
}

function CursorGlow() {
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  useEffect(() => { const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }; window.addEventListener('mousemove', move); return () => window.removeEventListener('mousemove', move) }, [])
  return <motion.div style={{ position:'fixed', top:0, left:0, pointerEvents:'none', zIndex:0, x, y, translateX:'-50%', translateY:'-50%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,184,154,0.04) 0%, transparent 70%)' }} />
}

/* ════════════════ PRICING SECTION ════════════════ */
interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  popular?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'month',
    features: ['10 diagrams', '5 AI generations', '5 version history', 'Export with watermark', '50 MB storage', 'Community support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 20,
    currency: 'INR',
    interval: 'month',
    features: ['25 diagrams', '20 AI generations', '10 version history', 'Export with watermark', '200 MB storage', '2 custom templates', 'Email support'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 40,
    currency: 'INR',
    interval: 'month',
    popular: true,
    features: ['50 diagrams', '50 AI generations', '15 version history', 'Export without watermark', '500 MB storage', '5 custom templates', 'Priority support'],
  },
]

function PricingSection({ sec, wrap, lbl, serifHdg, T, SP_SOFT, SP_BOUNCY }: any) {
  const { isAuthenticated } = useAuthStore()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    // Require login for paid plans
    if (planId !== 'free' && !isAuthenticated) {
      toast.error('Please sign in to subscribe to a plan')
      // Redirect to login with redirect back to pricing
      window.location.href = `/login?redirect=${encodeURIComponent('/#pricing')}`
      return
    }

    // Free plan - just go to editor
    if (planId === 'free') {
      window.location.href = '/editor'
      return
    }

    // Paid plans - create Razorpay subscription
    setLoadingPlan(planId)
    try {
      const response = await billingAPI.subscribe({ planId })
      const { shortUrl } = response.data.data

      // Redirect to Razorpay hosted checkout
      if (shortUrl) {
        window.location.href = shortUrl
      } else {
        toast.error('Failed to create subscription. Please try again.')
      }
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || 'Failed to start subscription process'
      toast.error(message)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" style={{ ...sec({ padding:'100px 24px' }), background:T.surface, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
      <div style={wrap}>
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={SP_SOFT} style={{ textAlign:'center', marginBottom:60 }}>
          <div style={lbl}>Pricing</div>
          <h2 style={serifHdg(40)}>Simple, transparent pricing</h2>
          <p style={{ fontSize:15, color:T.textSub, marginTop:16, maxWidth:480, margin:'16px auto 0', fontFamily:T.font }}>Start free, upgrade when you need more power. All prices in INR.</p>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity:0, y:30 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay:i*0.1, ...SP_SOFT }}
              whileHover={{ y:-8, borderColor: plan.popular ? T.accent : T.accentDim }}
              style={{
                padding:32,
                borderRadius:16,
                background:T.bg,
                border:`${plan.popular ? 2 : 1}px solid ${plan.popular ? T.accent : T.border}`,
                position:'relative'
              }}
            >
              {plan.popular && (
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', padding:'6px 14px', borderRadius:20, background:T.accent, fontSize:12, fontWeight:600, color:T.bg, fontFamily:T.font }}>Most Popular</div>
              )}
              <div style={{ fontSize:12, color:plan.popular ? T.accent : T.textMuted, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{plan.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:24 }}>
                <span style={{ fontSize:40, fontWeight:700, color:T.text, fontFamily:T.font }}>₹{plan.price}</span>
                <span style={{ fontSize:14, color:T.textMuted }}>/{plan.interval}</span>
              </div>
              <p style={{ fontSize:14, color:T.textSub, marginBottom:24, lineHeight:1.6 }}>
                {plan.id === 'free' && 'Perfect for personal projects and trying out Skemly.'}
                {plan.id === 'starter' && 'Great for solo developers building documentation.'}
                {plan.id === 'basic' && 'For professionals who need more power and features.'}
              </p>
              <ul style={{ listStyle:'none', padding:0, margin:0, marginBottom:32, display:'flex', flexDirection:'column', gap:12 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:T.textSub }}>
                    <Check size={16} color={T.accent} />{f}
                  </li>
                ))}
              </ul>
              <motion.button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingPlan === plan.id}
                whileHover={{ scale: loadingPlan === plan.id ? 1 : 1.02 }}
                whileTap={{ scale: loadingPlan === plan.id ? 1 : 0.97 }}
                transition={SP_BOUNCY}
                style={{
                  width:'100%',
                  padding:'12px 24px',
                  borderRadius:6,
                  fontSize:13,
                  fontWeight:500,
                  cursor: loadingPlan === plan.id ? 'not-allowed' : 'pointer',
                  fontFamily:T.font,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:8,
                  background: plan.id === 'free' ? 'transparent' : (plan.popular ? T.text : T.text),
                  color: plan.id === 'free' ? T.textSub : T.bg,
                  border: plan.id === 'free' ? `1px solid ${T.border}` : 'none',
                  opacity: loadingPlan === plan.id ? 0.7 : 1
                }}
              >
                {loadingPlan === plan.id ? (
                  <><Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                ) : (
                  plan.id === 'free' ? 'Get Started Free' : `Subscribe to ${plan.name}`
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:0.3 }} style={{ textAlign:'center', marginTop:32, fontSize:12, color:T.textMuted, fontFamily:T.font }}>
          Secure payments powered by Razorpay. Cancel anytime.
        </motion.p>
      </div>
    </section>
  )
}

/* ════════════════ MAIN PAGE ════════════════ */
export default function LandingPage() {
  const [tab, setTab] = useState('diagram')
  const { scrollY } = useScroll()
  const heroRightY = useTransform(scrollY, [0, 700], [0, -50])
  const heroRightS = useSpring(heroRightY, SP_SLOW)
  const heroTextY = useTransform(scrollY, [0, 500], [0, 40])

  const sec = (ex={}) => ({ position:'relative' as const, zIndex:1, padding:'96px 24px', ...ex })
  const wrap = { maxWidth:1080, margin:'0 auto' }
  const lbl = { fontSize:10.5, color:T.accent, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500, marginBottom:14, fontFamily:T.fontMono }
  const hdg = (sz=38) => ({ fontSize:`clamp(24px, 3.5vw, ${sz}px)`, fontWeight:600, letterSpacing:'-0.03em', color:T.text, lineHeight:1.1, fontFamily:T.font })
  const serifHdg = (sz=42) => ({ fontSize:`clamp(28px, 4vw, ${sz}px)`, fontWeight:300, letterSpacing:'-0.02em', color:T.text, lineHeight:1.08, fontFamily:T.fontSerif, fontStyle:'italic' })

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, overflowX:'hidden' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing:border-box; margin:0; padding:0 }
        ::selection { background:rgba(201,184,154,0.18); color:${T.text} }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-track { background:${T.bg} }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:2px }
        body { background:${T.bg} }
        a { text-decoration:none }
      `}</style>

      {/* Ambient */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', backgroundImage:`radial-gradient(circle, ${T.border} 1px, transparent 1px)`, backgroundSize:'28px 28px', opacity:0.4 }} />
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:`radial-gradient(ellipse 70% 50% at 50% 0%, transparent 30%, ${T.bg} 100%)` }} />
      <NoiseOverlay />
      <FloatingOrbs />
      <CursorGlow />
      <ScrollProgress />

      {/* ── NAV ── */}
      <motion.nav initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, ...SP_SOFT }} style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:64, background:`rgba(8,8,8,0.9)`, backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'0 32px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <motion.div whileHover={{ scale:1.02 }} transition={SP_BOUNCY} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => window.location.href = '/'}>
            <img src={SkemlyLogo} alt="Skemly" style={{ width:36, height:36, borderRadius:8, objectFit:'cover' }} />
            <span style={{ fontSize:18, fontWeight:700, color:T.text, letterSpacing:'-0.02em', fontFamily:T.font }}>Skemly</span>
          </motion.div>
          <div style={{ display:'flex', gap:4, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
            {['Features','Pricing','Docs'].map(l=>(
              <motion.a key={l} href={l === 'Features' ? '#features' : `/${l.toLowerCase()}`} whileHover={{ color:T.text }} style={{ padding:'8px 16px', fontSize:14, color:T.textMuted, cursor:'pointer', fontFamily:T.font, letterSpacing:'-0.01em', transition:'color 0.15s', fontWeight:500 }}>{l}</motion.a>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <motion.button whileHover={{ color:T.text }} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }} onClick={() => window.location.href = '/login'} style={{ padding:'8px 18px', fontSize:14, background:'none', border:'none', color:T.textSub, cursor:'pointer', fontFamily:T.font, letterSpacing:'-0.01em', fontWeight:500 }}>Sign in</motion.button>
            <motion.div initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3, ...SP_BOUNCY }}>
              <MagneticBtn onClick={() => window.location.href = '/editor'} style={{ padding:'10px 20px', borderRadius:8, fontSize:14 }}>Get Started</MagneticBtn>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section style={{ ...sec(), minHeight:'100vh', display:'flex', alignItems:'center', padding:'80px 24px' }}>
        <div style={{ ...wrap, width:'100%' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
            <motion.div style={{ y: heroTextY }}>
              <motion.div initial={{ opacity:0, y:14, scale:0.94 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.55, ...SP_BOUNCY }} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'4px 10px 4px 8px', borderRadius:40, background:T.surface, border:`1px solid ${T.border}`, marginBottom:32 }}>
                <motion.span animate={{ scale:[1,1.7,1], opacity:[0.7,1,0.7] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }} style={{ width:6, height:6, borderRadius:'50%', background:T.green, display:'inline-block' }} />
                <span style={{ fontSize:11, color:T.textSub, fontWeight:500, fontFamily:T.font }}>Now in public beta</span>
              </motion.div>
              <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, ...SP_SOFT }} style={{ fontSize:'clamp(36px, 4.8vw, 62px)', fontWeight:600, lineHeight:1.06, letterSpacing:'-0.035em', color:T.text, marginBottom:10, fontFamily:T.font }}>Diagram your systems</motion.h1>
              <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16, ...SP_SOFT }} style={{ fontSize:'clamp(36px, 4.8vw, 62px)', fontWeight:300, lineHeight:1.06, letterSpacing:'-0.03em', color:T.text, marginBottom:28, fontFamily:T.fontSerif, fontStyle:'italic' }}>
                <Typewriter lines={['with clarity.', 'at speed.', 'that scale.', 'beautifully.']} />
              </motion.h1>
              <motion.p initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, ...SP_SOFT }} style={{ fontSize:15, color:T.textSub, lineHeight:1.76, maxWidth:380, marginBottom:34, fontFamily:T.font }}>
                AI generation, code-first syntax, and a visual canvas — one workspace built for engineering teams who care about clarity.
              </motion.p>
              <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28, ...SP_SOFT }} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <MagneticBtn onClick={() => window.location.href = '/editor'} style={{ padding:'11px 24px', fontSize:13.5 }}>Start for free <ArrowRight size={14} /></MagneticBtn>
                <MagneticBtn variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'11px 20px', fontSize:13.5 }}>View examples <ArrowUpRight size={13} /></MagneticBtn>
              </motion.div>
              <motion.div initial="hidden" animate="show" variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.1, delayChildren:0.55 } } }} style={{ display:'flex', gap:40, marginTop:48, paddingTop:32, borderTop:`1px solid ${T.border}` }}>
                {[['50K+','Diagrams made'],['12ms','AI latency'],['4.9★','Rating']].map(([v,l],i)=>(
                  <motion.div key={i} variants={{ hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0, transition:SP_SOFT } }}>
                    <div style={{ fontSize:24, fontWeight:600, color:T.text, letterSpacing:'-0.03em', fontFamily:T.font }}>
                      {v.includes('ms') ? <span>{v}</span> : v.includes('★') ? <span>{v.replace('★','')}<span style={{ color:T.accent }}>★</span></span> : <Counter target={v} />}
                    </div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3, fontFamily:T.font, letterSpacing:'0.02em' }}>{l}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity:0, x:40, scale:0.96 }} animate={{ opacity:1, x:0, scale:1 }} transition={{ delay:0.22, ...SP_SLOW }} style={{ y: heroRightS, position:'relative' }}>
              <div style={{ display:'flex', gap:2, marginBottom:10, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:3, width:'fit-content' }}>
                {[['diagram','◈  Diagram'],['code','{ }  Code']].map(([k,l])=>(
                  <motion.button key={k} onClick={() => setTab(k)} whileTap={{ scale:0.96 }} style={{ padding:'5px 14px', borderRadius:5, border:'none', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:T.font, background: tab===k ? T.bg : 'transparent', color: tab===k ? T.text : T.textMuted, transition:'all 0.15s', position:'relative', letterSpacing:'-0.01em' }}>
                    {tab===k && <motion.div layoutId="tabInd" style={{ position:'absolute', inset:0, borderRadius:5, background:T.bg, zIndex:-1 }} transition={SP_BOUNCY} />}{l}
                  </motion.button>
                ))}
              </div>
              <div style={{ position:'absolute', inset:'-20px', borderRadius:20, background:`radial-gradient(ellipse at 50% 50%, rgba(201,184,154,0.06) 0%, transparent 70%)`, pointerEvents:'none', zIndex:0 }} />
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity:0, y:12, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-10, scale:0.98 }} transition={SP_SOFT} style={{ position:'relative', zIndex:1 }}>
                  {tab === 'diagram' ? <DiagramCanvas /> : <CodeEditor />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      {/* <Marquee /> */}

      {/* ── DOCS SHOWCASE ── */}
      <section style={{ ...sec(), background: T.bg, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={wrap}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SP_SOFT} style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={lbl}>Documentation</div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, ...SP_SOFT }} style={hdg(36)}>Beautiful docs, automatically</motion.h2>
            <p style={{ fontSize: 16, color: T.textSub, maxWidth: 600, margin: '16px auto 0', lineHeight: 1.6 }}>Generate comprehensive documentation from your diagrams. Export to Notion, Confluence, or share as a public link.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }} 
            whileInView={{ opacity: 1, y: 0, scale: 1 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.2, ...SP_SLOW }}
            style={{ 
              position: 'relative',
              borderRadius: 16, 
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
              background: T.surface,
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            }}
          >
            {/* Browser Chrome */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '12px 16px', 
              background: T.surface,
              borderBottom: `1px solid ${T.border}`
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
              </div>
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4px 16px',
                background: T.bg,
                borderRadius: 6,
                fontSize: 12,
                color: T.textMuted,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                skemly.ai/docs
              </div>
            </div>
            
            {/* Image Container with Loading */}
            <div style={{ position: 'relative', width: '100%', background: T.bg }}>
              <motion.img 
                src={docsImage} 
                alt="Skemly Documentation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={sec()}>
        <div style={wrap}>
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={SP_SOFT} style={{ marginBottom:56 }}>
            <div style={lbl}>How it works</div>
            <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.1, ...SP_SOFT }} style={hdg(42)}>Three ways to build diagrams</motion.h2>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden' }}>
            {FEATURES.map((f,i)=><FeatureCard key={i} f={f} i={i} last={i===FEATURES.length-1} />)}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section style={{ ...sec(), background:T.surface, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
        <div style={wrap}>
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={SP_SOFT} style={{ textAlign:'center', marginBottom:60 }}>
            <div style={lbl}>Process</div>
            <h2 style={serifHdg(40)}>From idea to shared diagram</h2>
          </motion.div>
          <ProcessSteps />
        </div>
      </section>

      {/* ── PRICING ── */}
      <PricingSection sec={sec} wrap={wrap} lbl={lbl} serifHdg={serifHdg} T={T} SP_SOFT={SP_SOFT} SP_BOUNCY={SP_BOUNCY} />

      {/* ── USE CASES ── */}
      <section style={sec({ padding:'80px 24px' })}>
        <div style={wrap}>
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={SP_SOFT} style={{ marginBottom:36 }}>
            <div style={lbl}>Use cases</div>
            <h2 style={hdg(34)}>Built for every team</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true, margin:'-60px' }} variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.05 } } }} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {USE_CASES.map((item,i)=>(
              <motion.div key={i} variants={{ hidden:{ opacity:0, scale:0.88, y:14 }, show:{ opacity:1, scale:1, y:0, transition:SP_BOUNCY } }} whileHover={{ background:T.surfaceHi, borderColor:T.borderHi, y:-3 }} transition={{ duration:0.2 }} style={{ padding:'14px 16px', borderRadius:T.nodeR, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:10, cursor:'default' }}>
                <item.icon size={13} color={T.accent} />
                <span style={{ fontSize:13, fontWeight:500, color:T.textSub, fontFamily:T.font }}>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ ...sec({ padding:'80px 24px' }), background:T.surface, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
        <div style={wrap}>
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={SP_SOFT} style={{ marginBottom:44 }}>
            <div style={lbl}>Testimonials</div>
            <h2 style={serifHdg(36)}>What teams are saying</h2>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {TESTIMONIALS.map((t,i)=><TestimonialCard key={i} t={t} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={sec({ padding:'130px 24px', overflow:'hidden' })}>
        <div style={{ maxWidth:540, margin:'0 auto', textAlign:'center', position:'relative' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:480, height:480, borderRadius:'50%', border:`1px solid ${T.border}`, opacity:0.3, pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:320, height:320, borderRadius:'50%', border:`1px solid ${T.border}`, opacity:0.2, pointerEvents:'none' }} />
          <div style={lbl}>Get started</div>
          <motion.h2 initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={SP_SOFT} style={{ ...serifHdg(56), marginBottom:16 }}>Your next system design<br />starts here.</motion.h2>
          <motion.p initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:0.12 }} style={{ fontSize:14, color:T.textSub, marginBottom:36, lineHeight:1.75, fontFamily:T.font }}>No credit card required. Open Skemly and start building in seconds.</motion.p>
          <motion.div initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ delay:0.2, ...SP_BOUNCY }}>
            <MagneticBtn onClick={() => window.location.href = '/editor'} style={{ padding:'12px 32px', fontSize:14 }}>Start for free <ArrowRight size={14} /></MagneticBtn>
          </motion.div>
          <motion.div initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.32 }} style={{ display:'flex', justifyContent:'center', gap:10, marginTop:28, flexWrap:'wrap' }}>
            {['No credit card','Cancel anytime','Free forever plan'].map((txt,i)=>(
              <motion.span key={i} whileHover={{ borderColor:T.accentDim, color:T.textSub }} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:T.textMuted, padding:'4px 12px', borderRadius:40, border:`1px solid ${T.border}`, fontFamily:T.font, transition:'all 0.2s' }}>
                <Check size={10} color={T.accentDim} />{txt}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:1, padding:'48px 24px 32px', borderTop:`1px solid ${T.border}`, background:T.surface }}>
        <div style={{ maxWidth:1080, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
            {/* Logo and Description */}
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <motion.div whileHover={{ scale:1.02 }} transition={SP_BOUNCY} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => window.location.href = '/'}>
                <img src={SkemlyLogo} alt="Skemly" style={{ width:32, height:32, borderRadius:8, objectFit:'cover' }} />
                <span style={{ fontSize:18, fontWeight:700, color:T.text, letterSpacing:'-0.02em', fontFamily:T.font }}>Skemly</span>
              </motion.div>
              <p style={{ fontSize:14, color:T.textSub, fontFamily:T.font, marginLeft:16, paddingLeft:16, borderLeft:`1px solid ${T.border}` }}>
                Create system diagrams with AI and code.
              </p>
            </div>

            {/* Simple Nav Links */}
            <div style={{ display:'flex', gap:32 }}>
              {['Features', 'Pricing', 'Docs'].map(item => (
                <motion.a key={item} href={`/${item.toLowerCase()}`} whileHover={{ color:T.text }} style={{ fontSize:14, color:T.textSub, fontFamily:T.font, transition:'color 0.15s' }}>{item}</motion.a>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{ paddingTop:24, borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:13, color:T.textMuted, fontFamily:T.font }}>
              © 2026 Skemly
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
