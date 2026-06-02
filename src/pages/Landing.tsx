import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { chipFailProb, featureFailProb } from '../lib/physics'
import { GlassButton } from '@/components/ui/apple-tahoe-liquid-glass-button'

const fade  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.10 } } }

/* ── tiny Poisson PMF bar chart ─────────────────────────── */
function PoissonChart() {
  const lambda = 90; const kappa = 48
  const bars: { k: number; p: number }[] = []
  let term = Math.exp(-lambda)
  for (let k = 0; k <= 130; k++) {
    if (k > 0) term = term * lambda / k
    bars.push({ k, p: term })
  }
  const max = Math.max(...bars.map(b => b.p))
  const W = 460; const H = 80; const bw = W / bars.length

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {bars.map(({ k, p }) => {
        const bh = (p / max) * H
        return (
          <rect key={k}
            x={k * bw} y={H - bh} width={Math.max(bw - 0.4, 0.4)} height={bh}
            fill={k < kappa ? 'rgba(255,59,59,0.65)' : 'rgba(124,111,238,0.35)'}
          />
        )
      })}
      <line x1={kappa * bw} y1={0} x2={kappa * bw} y2={H + 3}
        stroke="#f5a623" strokeWidth={1.5} strokeDasharray="3,2" />
      <text x={kappa * bw + 3} y={10} fill="#f5a623" fontSize={8.5}
        fontFamily="'IBM Plex Mono',monospace">κ=48</text>
      <text x={4} y={H + 14} fill="rgba(255,59,59,0.75)" fontSize={8.5}
        fontFamily="'IBM Plex Mono',monospace">fail (E &lt; κ)</text>
      <text x={kappa * bw + 6} y={H + 14} fill="rgba(124,111,238,0.75)" fontSize={8.5}
        fontFamily="'IBM Plex Mono',monospace">pass</text>
    </svg>
  )
}

/* ── animated chip die silhouette ───────────────────────── */
function ChipSilhouette() {
  const regions = [
    { x: 2,   y: 2,   w: 108, h: 148, c: '#1a3060' },
    { x: 112, y: 2,   w: 68,  h: 148, c: '#1a2e50' },
    { x: 182, y: 2,   w: 183, h: 148, c: '#1a4030' },
    { x: 2,   y: 152, w: 248, h: 162, c: '#2a1a50' },
    { x: 367, y: 2,   w: 131, h: 258, c: '#1a3a40' },
    { x: 252, y: 152, w: 113, h: 88,  c: '#30201a' },
    { x: 252, y: 242, w: 113, h: 72,  c: '#1a3020' },
    { x: 2,   y: 316, w: 496, h: 62,  c: '#1a2030' },
  ]
  return (
    <motion.svg
      viewBox="0 0 500 380" width="100%"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.4 }}
      style={{ display: 'block', maxWidth: 400, margin: '0 auto' }}
    >
      <rect x={0} y={0} width={500} height={380} fill="#0d0d18" />
      <defs>
        <pattern id="lp-grid" width={8} height={8} patternUnits="userSpaceOnUse">
          <path d="M8 0L0 0 0 8" fill="none" stroke="rgba(124,111,238,0.04)" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={500} height={380} fill="url(#lp-grid)" />
      {regions.map((r, i) => (
        <motion.rect key={i}
          x={r.x} y={r.y} width={r.w} height={r.h}
          fill={r.c} rx={1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.07, duration: 0.5 }}
        />
      ))}
      {/* region borders */}
      {regions.map((r, i) => (
        <rect key={`b${i}`} x={r.x} y={r.y} width={r.w} height={r.h}
          fill="none" stroke="rgba(124,111,238,0.18)" strokeWidth={0.7} rx={1} />
      ))}
      {/* scanning line animation */}
      <motion.line
        x1={0} y1={0} x2={0} y2={380}
        stroke="rgba(124,111,238,0.7)" strokeWidth={1.5}
        initial={{ x: 0, opacity: 1 }}
        animate={{ x: [0, 500, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        style={{ filter: 'drop-shadow(0 0 4px #7c6fee)' }}
      />
      {/* die border */}
      <rect x={1} y={1} width={498} height={378} fill="none"
        stroke="rgba(124,111,238,0.3)" strokeWidth={1.5} />
      {/* corner marks */}
      {([[0,0],[490,0],[0,370],[490,370]] as [number,number][]).map(([cx,cy],i) => (
        <g key={i} transform={`translate(${cx},${cy})`}>
          <line x1={0} y1={0} x2={10} y2={0} stroke="#7c6fee" strokeWidth={1} />
          <line x1={0} y1={0} x2={0}  y2={10} stroke="#7c6fee" strokeWidth={1} />
        </g>
      ))}
    </motion.svg>
  )
}

/* ── page ────────────────────────────────────────────────── */
export default function Landing() {
  const nav  = useNavigate()
  const p    = featureFailProb(120, 0.75, 48)
  const chipP = chipFailProb(120, 0.75, 48)

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--void)',
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
      paddingBottom: 80,
    }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <motion.div
        initial="hidden" animate="show" variants={stagger}
        style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem 0' }}
      >
        {/* Label */}
        <motion.p variants={fade} style={{
          fontSize: 12, color: '#4a6070', letterSpacing: '0.16em',
          textTransform: 'uppercase', marginBottom: 24,
        }}>
          The EUV Defect Lab &nbsp;·&nbsp; CS109 Challenge &nbsp;·&nbsp; Apple M4
        </motion.p>

        {/* Big title — robots.rmrm.io style */}
        <motion.h1 variants={fade} style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'clamp(32px, 6vw, 64px)',
          fontWeight: 700,
          fontStyle: 'italic',
          lineHeight: 1.1,
          marginBottom: 28,
          color: '#ffffff',
        }}>
          <span style={{ color: '#7c6fee' }}>Stochastic defects,</span><br />
          quantum cures.
        </motion.h1>

        {/* Attribution */}
        <motion.p variants={fade} style={{
          fontSize: 12, color: '#4a6070', marginBottom: 40, letterSpacing: '0.04em',
        }}>
          EUV stochastic failure model &nbsp;·&nbsp; Compound-Poisson physics &nbsp;·&nbsp; Bayesian localization
        </motion.p>

        {/* Body paragraphs */}
        <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
          {[
            `This simulator models EUV stochastic lithography failures\non the Apple M4 die — 28 billion transistors, TSMC N3E process.\nQuantum shot noise from individual photons is the root cause.`,
            `Photons arrive at X ~ Poisson(λ=120) per feature. Each generates
μ=0.75 secondary electrons, so E ~ Poisson(90). The feature
fails if E < κ=48 — a probability of ${(p * 1e7).toFixed(2)}×10⁻⁷. With
100,000 critical features per die, ~${(chipP*100).toFixed(2)}% of chips fail.`,
            `When a chip fails we observe symptoms — integer errors, GPU
corruption, cache faults, power anomalies — and run sequential
Bayesian updating (log-space, log-sum-exp normalization) across
8 die regions to identify the defect with 79.1% top-1 accuracy.`,
            `So go on. Adjust λ, μ, and κ. Hit Fabricate. The EUV beam
will sweep the die. If a defect emerges, the posterior heat
map will tell you exactly where to look.`,
          ].map((txt, i) => (
            <motion.p key={i} variants={fade} style={{
              fontSize: 14, lineHeight: 1.85, color: '#8a9eb0',
              whiteSpace: 'pre-line',
            }}>
              {txt}
            </motion.p>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div variants={fade} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 56 }}>
          <GlassButton
            size="default"
            glassColor="rgba(124,111,238,0.12)"
            onClick={() => nav('/simulator')}
            style={{ fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em', fontSize: 13 }}
          >
            <span>Fabricate a chip</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </GlassButton>
          <GlassButton
            size="default"
            glassColor="rgba(245,166,35,0.06)"
            onClick={() => nav('/model')}
            style={{ fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em', fontSize: 13 }}
          >
            Read the model
          </GlassButton>
        </motion.div>
      </motion.div>

      {/* ── Die + chart split ────────────────────────────── */}
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
        style={{ maxWidth: 800, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}
      >
        {/* Die silhouette */}
        <motion.div variants={fade}>
          <p style={{ fontSize: 10, color: '#4a6070', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
            Apple M4 die · 8 regions
          </p>
          <ChipSilhouette />
        </motion.div>

        {/* Stats + PMF */}
        <motion.div variants={fade} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Key numbers */}
          {[
            { v: '28B',                                      l: 'transistors' },
            { v: `${(p*1e7).toFixed(2)}×10⁻⁷`,             l: 'per-feature fail prob' },
            { v: `${(chipP*100).toFixed(2)}%`,              l: 'chip fail rate' },
            { v: '79.1%',                                    l: 'top-1 diag accuracy' },
          ].map(({ v, l }) => (
            <div key={l}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#7c6fee', lineHeight: 1, fontFamily: "'IBM Plex Mono',monospace" }}>{v}</div>
              <div style={{ fontSize: 11, color: '#4a6070', marginTop: 4, letterSpacing: '0.06em' }}>{l}</div>
            </div>
          ))}

          {/* PMF chart */}
          <div>
            <p style={{ fontSize: 10, color: '#4a6070', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              E ~ Poisson(90) — failure region
            </p>
            <PoissonChart />
          </div>
        </motion.div>
      </motion.div>

      {/* ── How it works ─────────────────────────────────── */}
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
        style={{ maxWidth: 800, margin: '4rem auto 0', padding: '0 2rem' }}
      >
        <motion.p variants={fade} style={{
          fontSize: 10, color: '#f5a623', letterSpacing: '0.18em',
          textTransform: 'uppercase', marginBottom: 20,
        }}>
          How it works
        </motion.p>

        {[
          { n: '01', title: 'Photon → Electron cascade',
            body: 'X ~ Poisson(λ) photons arrive. Each generates E|X ~ Poisson(Xμ) electrons. Marginalizing: E ~ Poisson(λμ). Feature fails if E < κ.' },
          { n: '02', title: 'Transistor-weighted prior',
            body: 'Before observing any symptoms, P(defect in region k) ∝ transistor count. NPU (1,400M) has 30.1% prior; MemCtrl (200M) has 4.3%.' },
          { n: '03', title: 'Sequential Bayesian updating',
            body: 'Each observed symptom updates the posterior: log P(Dₖ|s) = log P(Dₖ) + Σlog P(sᵢ|Dₖ), normalized via log-sum-exp. MAP = argmax.' },
        ].map(({ n, title, body }) => (
          <motion.div key={n} variants={fade} style={{
            display: 'flex', gap: 24, marginBottom: 28,
            borderBottom: '1px solid rgba(124,111,238,0.08)', paddingBottom: 28,
          }}>
            <div style={{ fontSize: 11, color: '#4a6070', minWidth: 28, paddingTop: 2, letterSpacing: '0.08em' }}>{n}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#c8d4e0', marginBottom: 8 }}>{title}</div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: '#4a6070' }}>{body}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Bottom CTA ───────────────────────────────────── */}
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
        style={{ maxWidth: 800, margin: '3rem auto 0', padding: '0 2rem', textAlign: 'center' }}
      >
        <p style={{ fontSize: 13, color: '#4a6070', marginBottom: 24, lineHeight: 1.7 }}>
          Results page: 10,000 Monte Carlo trials · confusion matrix · per-region accuracy · entropy curves
        </p>
        <GlassButton
          size="lg"
          glassColor="rgba(124,111,238,0.10)"
          onClick={() => nav('/simulator')}
          style={{ fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.12em', fontSize: 14 }}
        >
          Open simulator →
        </GlassButton>
      </motion.div>
    </div>
  )
}
