import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { REGION_NAMES, TRANSISTORS, PRIORS, SYMPTOMS, LIKELIHOOD } from '../lib/physics';
import { computePosterior, heatColor } from '../lib/bayes';

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// Compound Poisson diagram — compact layout, main axis at y=46
function CascadeDiagram() {
  // Main horizontal flow axis
  const ax = 46;
  return (
    <svg viewBox="0 0 460 96" width="90%" style={{ display: 'block', margin: '0 auto' }}>
      {/* ── EUV PHOTONS box ── */}
      <rect x={10} y={ax - 22} width={88} height={44} rx={4}
        fill="#111d2e" stroke="rgba(124,111,238,0.3)" strokeWidth={1} />
      <text x={54} y={ax - 9} textAnchor="middle" fontSize={8} fill="#7c6fee"
        fontFamily="'JetBrains Mono',monospace" letterSpacing="0.06em">EUV PHOTONS</text>
      <text x={54} y={ax + 5} textAnchor="middle" fontSize={10} fill="#ffffff"
        fontFamily="'Orbitron',monospace">X~Poi(λ)</text>
      <text x={54} y={ax + 16} textAnchor="middle" fontSize={7.5} fill="#4a6070"
        fontFamily="'JetBrains Mono',monospace">λ=120</text>

      {/* ── ×μ arrow ── */}
      <line x1={98} y1={ax} x2={133} y2={ax} stroke="#f5a623" strokeWidth={1.5} />
      <polygon points={`133,${ax-4} 141,${ax} 133,${ax+4}`} fill="#f5a623" />
      <text x={117} y={ax - 6} textAnchor="middle" fontSize={8} fill="#f5a623"
        fontFamily="'JetBrains Mono',monospace">×μ</text>

      {/* ── SEC. ELECTRONS box ── */}
      <rect x={141} y={ax - 22} width={88} height={44} rx={4}
        fill="#111d2e" stroke="rgba(124,111,238,0.3)" strokeWidth={1} />
      <text x={185} y={ax - 9} textAnchor="middle" fontSize={8} fill="#7c6fee"
        fontFamily="'JetBrains Mono',monospace" letterSpacing="0.04em">SEC. ELECTRONS</text>
      <text x={185} y={ax + 5} textAnchor="middle" fontSize={10} fill="#ffffff"
        fontFamily="'Orbitron',monospace">E~Poi(Λ)</text>
      <text x={185} y={ax + 16} textAnchor="middle" fontSize={7.5} fill="#4a6070"
        fontFamily="'JetBrains Mono',monospace">Λ=λμ=90</text>

      {/* ── E<κ? arrow ── */}
      <line x1={229} y1={ax} x2={264} y2={ax} stroke="#f5a623" strokeWidth={1.5} />
      <polygon points={`264,${ax-4} 272,${ax} 264,${ax+4}`} fill="#f5a623" />
      <text x={248} y={ax - 6} textAnchor="middle" fontSize={8} fill="#f5a623"
        fontFamily="'JetBrains Mono',monospace">E&lt;κ?</text>

      {/* ── FEATURE FAIL box (above axis) ── */}
      <rect x={272} y={5} width={78} height={33} rx={4}
        fill="rgba(255,59,59,0.12)" stroke="rgba(255,59,59,0.4)" strokeWidth={1} />
      <text x={311} y={19} textAnchor="middle" fontSize={7.5} fill="#ff3b3b"
        fontFamily="'JetBrains Mono',monospace">FEATURE</text>
      <text x={311} y={31} textAnchor="middle" fontSize={9.5} fill="#ff3b3b"
        fontFamily="'Orbitron',monospace">FAIL</text>

      {/* ── FEATURE PASS box (below axis) ── */}
      <rect x={272} y={58} width={78} height={33} rx={4}
        fill="rgba(0,255,136,0.08)" stroke="rgba(0,255,136,0.3)" strokeWidth={1} />
      <text x={311} y={72} textAnchor="middle" fontSize={7.5} fill="#00ff88"
        fontFamily="'JetBrains Mono',monospace">FEATURE</text>
      <text x={311} y={84} textAnchor="middle" fontSize={9.5} fill="#00ff88"
        fontFamily="'Orbitron',monospace">PASS</text>

      {/* ── YES / NO branch labels ── */}
      <text x={261} y={28} fontSize={7.5} fill="#ff3b3b"
        fontFamily="'JetBrains Mono',monospace">YES</text>
      <text x={261} y={68} fontSize={7.5} fill="#00ff88"
        fontFamily="'JetBrains Mono',monospace">NO</text>

      {/* ── CHIP FAILS box ── */}
      <line x1={350} y1={21} x2={382} y2={21} stroke="rgba(255,59,59,0.5)" strokeWidth={1} />
      <polygon points="382,17 390,21 382,25" fill="rgba(255,59,59,0.7)" />
      <rect x={390} y={5} width={58} height={33} rx={4}
        fill="rgba(255,59,59,0.15)" stroke="rgba(255,59,59,0.5)" strokeWidth={1} />
      <text x={419} y={19} textAnchor="middle" fontSize={7} fill="#ff3b3b"
        fontFamily="'JetBrains Mono',monospace">CHIP</text>
      <text x={419} y={31} textAnchor="middle" fontSize={7} fill="#ff3b3b"
        fontFamily="'JetBrains Mono',monospace">FAILS</text>
    </svg>
  );
}

// Likelihood matrix heatmap
function LikelihoodHeatmap({ highlightRow }: { highlightRow: number | null }) {
  const cellSize = 36;
  const labelW = 115;
  const totalW = labelW + SYMPTOMS.length * cellSize;
  const totalH = 24 + REGION_NAMES.length * cellSize;

  const symShort = ['Int/Br', 'FP/SIMD', 'GPU', 'NPU', 'Cache', 'MemBW', 'Video', 'Power'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ display: 'block', minWidth: 460 }}>
        {/* Column headers */}
        {symShort.map((s, j) => (
          <text key={j}
            x={labelW + j * cellSize + cellSize / 2} y={16}
            textAnchor="middle" fontSize={7.5}
            fill="#8a9eb0" fontFamily="'JetBrains Mono',monospace"
          >{s}</text>
        ))}

        {REGION_NAMES.map((name, i) => (
          <g key={i}>
            {/* Row label */}
            <text x={labelW - 5} y={24 + i * cellSize + cellSize / 2 + 4}
              textAnchor="end" fontSize={8.5}
              fill={highlightRow === i ? '#7c6fee' : '#8a9eb0'}
              fontFamily="'JetBrains Mono',monospace"
              fontWeight={highlightRow === i ? '700' : '400'}
            >{name.split(' ')[0]}</text>

            {/* Cells */}
            {LIKELIHOOD[i].map((v, j) => (
              <g key={j}>
                <rect
                  x={labelW + j * cellSize + 1} y={24 + i * cellSize + 1}
                  width={cellSize - 2} height={cellSize - 2} rx={2}
                  fill={heatColor(v)}
                  opacity={highlightRow != null && highlightRow !== i ? 0.35 : 0.9}
                />
                <text
                  x={labelW + j * cellSize + cellSize / 2}
                  y={24 + i * cellSize + cellSize / 2 + 4}
                  textAnchor="middle" fontSize={8}
                  fill={v > 0.5 ? '#ffffff' : '#8a9eb0'}
                  fontFamily="'JetBrains Mono',monospace"
                >
                  {v.toFixed(2)}
                </text>
              </g>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

// Animated Bayesian walkthrough
const EXAMPLE_SYMPTOMS = [true, false, false, false, true, false, false, false]; // Int error + Cache fault

function BayesWalkthrough() {
  const [step, setStep] = useState(0);
  const maxStep = EXAMPLE_SYMPTOMS.filter(Boolean).length;

  const activeSymptomsForStep = EXAMPLE_SYMPTOMS.map((s, i) => {
    const symptomIdx = EXAMPLE_SYMPTOMS.slice(0, i + 1).filter(Boolean).length;
    return s && symptomIdx <= step;
  });

  const posterior = step === 0
    ? PRIORS
    : computePosterior(activeSymptomsForStep);

  const barData = REGION_NAMES.map((name, i) => ({
    name: name.split('/')[0].trim().split(' ')[0],
    value: posterior[i],
  }));

  const observedSyms = SYMPTOMS.filter((_, i) => activeSymptomsForStep[i]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {step === 0 ? (
          <div className="panel" style={{ padding: '10px 16px', borderColor: 'rgba(245,166,35,0.3)' }}>
            <span className="font-mono" style={{ fontSize: 10, color: '#f5a623' }}>Prior only (transistor-weighted)</span>
          </div>
        ) : observedSyms.map(s => (
          <div key={s} className="panel" style={{ padding: '6px 12px', borderColor: 'rgba(255,59,59,0.3)', background: 'rgba(255,59,59,0.06)' }}>
            <span className="font-mono" style={{ fontSize: 10, color: '#ff3b3b' }}>⚠ {s}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={barData} margin={{ top: 4, bottom: 4, left: 0, right: 16 }}>
          <XAxis dataKey="name" tick={{ fill: '#8a9eb0', fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}
            axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} tick={{ fill: '#4a6070', fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
          <Bar dataKey="value" animationDuration={600} radius={[2, 2, 0, 0]}>
            {barData.map((_, i) => (
              <Cell key={i} fill={heatColor(posterior[i] / Math.max(...posterior))} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="font-display"
          style={{
            padding: '6px 16px', fontSize: 9, letterSpacing: '0.12em',
            background: 'transparent', border: '1px solid rgba(124,111,238,0.2)',
            color: step === 0 ? '#4a6070' : '#7c6fee', cursor: step === 0 ? 'default' : 'pointer',
          }}
        >← BACK</button>
        <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: maxStep + 1 }, (_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === step ? '#7c6fee' : 'rgba(124,111,238,0.2)',
            }} />
          ))}
        </div>
        <button
          onClick={() => setStep(s => Math.min(maxStep, s + 1))}
          disabled={step === maxStep}
          className="font-display"
          style={{
            padding: '6px 16px', fontSize: 9, letterSpacing: '0.12em',
            background: 'transparent', border: '1px solid rgba(124,111,238,0.2)',
            color: step === maxStep ? '#4a6070' : '#7c6fee', cursor: step === maxStep ? 'default' : 'pointer',
          }}
        >NEXT →</button>
      </div>
      <div className="font-mono" style={{ fontSize: 10, color: '#4a6070', textAlign: 'center', marginTop: 8 }}>
        {step === 0
          ? 'Start: posterior = prior ∝ transistor count'
          : `After ${step} symptom${step > 1 ? 's' : ''}: log-posterior updated, re-normalized`}
      </div>
    </div>
  );
}

export default function ModelExplainer() {
  const [highlightRow, setHighlightRow] = useState<number | null>(null);

  const priorData = REGION_NAMES.map((name, i) => ({
    name: name.split(' ')[0],
    value: PRIORS[i],
    transistors: TRANSISTORS[i],
  }));

  const COLORS = ['#7c6fee','#5ba4ff','#00ff88','#c084fc','#f5a623','#ff3b3b','#00ffff','#8888ff'];

  return (
    <div className="grid-bg" style={{ minHeight: '100%', padding: '2rem', paddingBottom: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <motion.div initial="hidden" animate="show" variants={fade} style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ fontSize: 10, color: '#f5a623', letterSpacing: '0.18em' }}>
            PROBABILITY MODEL
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(22px,4vw,36px)', color: '#ffffff', letterSpacing: '0.06em', marginTop: 12 }}>
            From Photons to Posteriors
          </h1>
          <p style={{ fontSize: 14, color: '#8a9eb0', marginTop: 12, lineHeight: 1.75, maxWidth: 640 }}>
            A complete walkthrough of the stochastic physics model, the prior, the likelihood matrix,
            and sequential Bayesian updating that drives defect diagnosis.
          </p>
        </motion.div>

        {/* Section 1: Physics */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader n="01" title="The Compound Poisson Failure Model" />
          <div className="panel" style={{ padding: '1.5rem', marginBottom: 16 }}>
            <CascadeDiagram />
            <div style={{
              borderTop: '1px solid rgba(124,111,238,0.1)',
              marginTop: 16, paddingTop: 14,
              display: 'flex', flexWrap: 'wrap', gap: '24px 40px',
            }}>
              {[
                { label: 'Feature fail prob', formula: 'p = P(Poi(90) ≤ 47) ≈ 4.58×10⁻⁷' },
                { label: 'Chip fail prob',    formula: 'P(chip) = 1−(1−p)^100,000 ≈ 4.48%' },
                { label: 'Failure condition', formula: 'E < κ = 48  ⟹  ∃ defective feature' },
              ].map(({ label, formula }) => (
                <div key={label}>
                  <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.12em', marginBottom: 6 }}>
                    {label.toUpperCase()}
                  </div>
                  <div className="font-mono" style={{ fontSize: 13, color: '#7c6fee', letterSpacing: '0.04em' }}>
                    {formula}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormulaCard
              title="PHOTON ARRIVALS"
              formula="X ~ Poisson(λ)"
              note="λ = 120 photons/feature on TSMC N3E. Each feature receives a random number of photons per exposure shot."
            />
            <FormulaCard
              title="SECONDARY ELECTRONS"
              formula="E | X ~ Poisson(Xμ)"
              note="Each photon generates μ = 0.75 photoelectrons in the resist on average. Marginalizing over X: E ~ Poisson(λμ = 90)."
            />
            <FormulaCard
              title="FEATURE FAILURE"
              formula="fail iff E < κ = 48"
              note="The resist needs at least 48 electrons to trigger correctly. P(fail) = P(Poi(90) ≤ 47) ≈ 4.58×10⁻⁷."
            />
            <FormulaCard
              title="CHIP FAILURE"
              formula="P(chip) = 1−(1−p)^N"
              note="With N = 100,000 critical hotspot features, the chip fails if any one feature fails. P(chip fail) ≈ 4.48%, yield ≈ 95.5%."
            />
          </div>
        </section>

        {/* Section 2: Prior */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader n="02" title="Prior Probability — Where Can the Defect Live?" />
          <p style={{ fontSize: 14, color: '#8a9eb0', lineHeight: 1.75, marginBottom: 20, maxWidth: 680 }}>
            Before any symptoms are observed, we assign a prior over the 8 chip regions proportional to
            each region's transistor count. The NPU has 1,400M transistors — 30.1% of the die —
            so it gets the highest prior. MemCtrl has only 200M — a 4.3% prior.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="panel" style={{ padding: '1.5rem' }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 12 }}>
                PRIOR DISTRIBUTION
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name} ${(value * 100).toFixed(1)}%`}
                    labelLine={false}
                    fontSize={8}
                  >
                    {priorData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="panel" style={{ padding: '1.5rem' }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 12 }}>
                TRANSISTOR COUNT (MILLIONS)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorData} layout="vertical" margin={{ left: 0, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={55}
                    tick={{ fill: '#8a9eb0', fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}
                    tickLine={false} axisLine={false}
                  />
                  <Bar dataKey="transistors" radius={[0, 2, 2, 0]}>
                    {priorData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Section 3: Likelihood matrix */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader n="03" title="Likelihood Matrix — Symptoms by Region" />
          <p style={{ fontSize: 14, color: '#8a9eb0', lineHeight: 1.75, marginBottom: 20, maxWidth: 680 }}>
            Each cell L[region][symptom] = P(symptom observed | defect in that region). A P-Core defect
            almost certainly causes integer errors (0.92) but rarely GPU corruption (0.04). Hover rows to highlight.
          </p>
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {REGION_NAMES.map((name, i) => (
                <button key={i}
                  onMouseEnter={() => setHighlightRow(i)}
                  onMouseLeave={() => setHighlightRow(null)}
                  className="font-mono"
                  style={{
                    padding: '4px 10px', fontSize: 9, letterSpacing: '0.08em',
                    background: highlightRow === i ? 'rgba(124,111,238,0.15)' : 'transparent',
                    border: `1px solid ${highlightRow === i ? 'rgba(124,111,238,0.5)' : 'rgba(124,111,238,0.1)'}`,
                    color: highlightRow === i ? '#7c6fee' : '#4a6070',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {name.split(' ')[0]}
                </button>
              ))}
            </div>
            <LikelihoodHeatmap highlightRow={highlightRow} />
          </div>
        </section>

        {/* Section 4: Bayesian updating */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader n="04" title="Sequential Bayesian Updating" />
          <p style={{ fontSize: 14, color: '#8a9eb0', lineHeight: 1.75, marginBottom: 20, maxWidth: 680 }}>
            When symptoms arrive one by one, we multiply the current posterior by the likelihood of the new symptom.
            In log-space this is an addition; we normalize after each step using log-sum-exp.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="panel" style={{ padding: '1.5rem' }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.12em', marginBottom: 16 }}>
                UPDATE RULE (LOG SPACE)
              </div>
              {[
                'log P(Dₖ | s₁..sₙ)',
                '  = log P(Dₖ)',
                '  + Σ log P(sᵢ | Dₖ)',
              ].map((line, i) => (
                <div key={i} className="font-mono" style={{ fontSize: 13, color: i === 0 ? '#7c6fee' : '#c8d4e0', lineHeight: 2, letterSpacing: '0.04em' }}>
                  {line}
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(124,111,238,0.1)', marginTop: 16, paddingTop: 16 }}>
                <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', marginBottom: 8, letterSpacing: '0.1em' }}>NORMALIZATION</div>
                <div className="font-mono" style={{ fontSize: 12, color: '#c8d4e0', lineHeight: 2 }}>
                  log Z = log-sum-exp(log P(Dₖ|s))
                </div>
                <div className="font-mono" style={{ fontSize: 12, color: '#c8d4e0', lineHeight: 2 }}>
                  P(Dₖ|s) = exp(log P(Dₖ|s) − log Z)
                </div>
              </div>
            </div>
            <div className="panel" style={{ padding: '1.5rem' }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.12em', marginBottom: 12 }}>
                LIVE EXAMPLE — Integer Error + Cache Fault
              </div>
              <BayesWalkthrough />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function SectionHeader({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <span className="font-mono" style={{ fontSize: 10, color: '#f5a623', letterSpacing: '0.18em' }}>
        {n} /
      </span>
      <h2 className="font-display" style={{ fontSize: 18, color: '#ffffff', letterSpacing: '0.06em', marginTop: 8 }}>
        {title}
      </h2>
    </div>
  );
}

function FormulaCard({ title, formula, note }: { title: string; formula: string; note: string }) {
  return (
    <div className="panel" style={{ padding: '1.25rem' }}>
      <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 10 }}>{title}</div>
      <div className="font-display" style={{ fontSize: 16, color: '#7c6fee', letterSpacing: '0.06em', marginBottom: 10 }}>{formula}</div>
      <p style={{ fontSize: 13, color: '#8a9eb0', lineHeight: 1.65 }}>{note}</p>
    </div>
  );
}
