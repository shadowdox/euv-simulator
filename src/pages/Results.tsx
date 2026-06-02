import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { REGION_NAMES, SYMPTOMS, TRANSISTORS, PRIORS, simulateOne } from '../lib/physics';
import { computePosterior, mapEstimate, top2, shannonEntropy, priorEntropy, heatColor } from '../lib/bayes';

const N_TRIALS = 10_000;
const LAMBDA = 120; const MU = 0.75; const KAPPA = 48;

interface Trial {
  trueRegion: number;
  mapRegion: number;
  top2Regions: [number, number];
  symptoms: boolean[];
  posterior: number[];
  entropy: number;
}

function runTrials(): Trial[] {
  const trials: Trial[] = [];
  let attempts = 0;
  while (trials.length < N_TRIALS && attempts < N_TRIALS * 300) {
    attempts++;
    const r = simulateOne(LAMBDA, MU, KAPPA);
    if (r.passed || r.trueRegion == null) continue;
    const post = computePosterior(r.symptoms);
    trials.push({
      trueRegion: r.trueRegion,
      mapRegion: mapEstimate(post),
      top2Regions: top2(post),
      symptoms: r.symptoms,
      posterior: post,
      entropy: shannonEntropy(post),
    });
  }
  return trials;
}

// Confusion matrix heatmap
function ConfusionMatrix({ matrix }: { matrix: number[][] }) {
  const n = REGION_NAMES.length;
  const maxVal = Math.max(...matrix.flat());
  const cellSize = 38;
  const labelW = 95;
  const totalW = labelW + n * cellSize;
  const totalH = 28 + n * cellSize;
  const shortNames = REGION_NAMES.map(r => r.split(' ')[0].slice(0, 6));

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ display: 'block', minWidth: 360 }}>
        {/* Column labels (predicted) */}
        {shortNames.map((s, j) => (
          <text key={j}
            x={labelW + j * cellSize + cellSize / 2} y={18}
            textAnchor="middle" fontSize={7.5}
            fill="#8a9eb0" fontFamily="'JetBrains Mono',monospace"
          >{s}</text>
        ))}
        {matrix.map((row, i) => (
          <g key={i}>
            <text x={labelW - 4} y={28 + i * cellSize + cellSize / 2 + 3}
              textAnchor="end" fontSize={8.5}
              fill="#8a9eb0" fontFamily="'JetBrains Mono',monospace"
            >{shortNames[i]}</text>
            {row.map((val, j) => {
              const t = maxVal > 0 ? val / maxVal : 0;
              const onDiag = i === j;
              return (
                <g key={j}>
                  <rect
                    x={labelW + j * cellSize + 1} y={28 + i * cellSize + 1}
                    width={cellSize - 2} height={cellSize - 2} rx={2}
                    fill={onDiag ? `rgba(0,255,136,${0.1 + t * 0.6})` : `rgba(255,59,59,${t * 0.55})`}
                    stroke={onDiag ? 'rgba(0,255,136,0.3)' : 'none'}
                    strokeWidth={0.8}
                  />
                  {val > 0 && (
                    <text
                      x={labelW + j * cellSize + cellSize / 2}
                      y={28 + i * cellSize + cellSize / 2 + 3.5}
                      textAnchor="middle" fontSize={t > 0.3 ? 9 : 7.5}
                      fill={onDiag ? '#00ff88' : '#c8d4e0'}
                      fontFamily="'JetBrains Mono',monospace"
                      opacity={t > 0.05 ? 1 : 0.5}
                    >{val}</text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
        <text x={labelW + n * cellSize / 2} y={totalH} textAnchor="middle" fontSize={8}
          fill="#4a6070" fontFamily="'JetBrains Mono',monospace">← PREDICTED REGION →</text>
      </svg>
    </div>
  );
}

export default function Results() {
  const trials = useMemo(() => runTrials(), []);

  const top1Correct = trials.filter(t => t.mapRegion === t.trueRegion).length;
  const top2Correct = trials.filter(t => t.top2Regions.includes(t.trueRegion)).length;
  const top1Acc = top1Correct / trials.length;
  const top2Acc = top2Correct / trials.length;
  const avgEntropy = trials.reduce((s, t) => s + t.entropy, 0) / trials.length;
  const priorEnt = priorEntropy();

  // Per-region accuracy
  const regionStats = REGION_NAMES.map((name, i) => {
    const regionTrials = trials.filter(t => t.trueRegion === i);
    const correct = regionTrials.filter(t => t.mapRegion === i).length;
    return {
      name: name.split(' ')[0],
      full: name,
      total: regionTrials.length,
      correct,
      accuracy: regionTrials.length > 0 ? correct / regionTrials.length : 0,
    };
  });

  // Per-symptom top-1 accuracy (accuracy when symptom is present)
  const symptomAcc = SYMPTOMS.map((sym, si) => {
    const syTrials = trials.filter(t => t.symptoms[si]);
    const correct = syTrials.filter(t => t.mapRegion === t.trueRegion).length;
    return {
      name: sym.split('/')[0].trim().split(' ').slice(-1)[0],
      accuracy: syTrials.length > 0 ? correct / syTrials.length : 0,
      count: syTrials.length,
    };
  });

  // Confusion matrix (true rows, predicted cols)
  const confMatrix = REGION_NAMES.map((_, i) =>
    REGION_NAMES.map((_, j) =>
      trials.filter(t => t.trueRegion === i && t.mapRegion === j).length
    )
  );

  // Entropy by number of observed symptoms
  const entropyBySympCount = Array.from({ length: 9 }, (_, k) => {
    const ts = trials.filter(t => t.symptoms.filter(Boolean).length === k);
    const avg = ts.length > 0 ? ts.reduce((s, t) => s + t.entropy, 0) / ts.length : null;
    return { symptoms: k, entropy: avg, count: ts.length };
  }).filter(d => d.entropy != null && d.count > 5);

  return (
    <div className="grid-bg" style={{ minHeight: '100%', padding: '2rem', paddingBottom: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ fontSize: 10, color: '#f5a623', letterSpacing: '0.18em' }}>
            SIMULATION RESULTS
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(22px,4vw,34px)', color: '#ffffff', letterSpacing: '0.06em', marginTop: 12 }}>
            10,000 Monte Carlo Trials
          </h1>
          <p style={{ fontSize: 14, color: '#8a9eb0', marginTop: 12, lineHeight: 1.75, maxWidth: 600 }}>
            All trials run at default parameters (λ=120, μ=0.75, κ=48). Only failed chips are evaluated
            for diagnosis accuracy.
          </p>
        </motion.div>

        {/* Top-line stats */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { label: 'TOP-1 ACCURACY',   value: `${(top1Acc * 100).toFixed(1)}%`,  color: '#00ff88', sub: `${top1Correct} / ${trials.length} correct` },
            { label: 'TOP-2 ACCURACY',   value: `${(top2Acc * 100).toFixed(1)}%`,  color: '#7c6fee', sub: `True region in top-2 predictions` },
            { label: 'TRIALS EVALUATED', value: trials.length.toLocaleString(),    color: '#c8d4e0', sub: 'Failed chips only' },
            { label: 'AVG POSTERIOR ENTROPY', value: `${avgEntropy.toFixed(2)} b`, color: '#f5a623', sub: `vs prior ${priorEnt.toFixed(2)} b` },
          ].map(({ label, value, color, sub }) => (
            <motion.div key={label}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="panel"
              style={{ padding: '1.25rem 1.5rem', flex: 1, minWidth: 180 }}
            >
              <div className="font-mono" style={{ fontSize: 8, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 8 }}>{label}</div>
              <div className="font-display" style={{ fontSize: 26, color, letterSpacing: '0.04em', marginBottom: 6 }}>{value}</div>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070' }}>{sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Per-region accuracy */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 16 }}>
              TOP-1 ACCURACY BY REGION
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={regionStats} margin={{ left: 0, right: 12, bottom: 20 }}>
                <XAxis dataKey="name"
                  tick={{ fill: '#8a9eb0', fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}
                  axisLine={false} tickLine={false} angle={-30} textAnchor="end" dy={8}
                />
                <YAxis domain={[0, 1]} tick={{ fill: '#4a6070', fontSize: 9 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  content={({ active, payload }) => active && payload?.length ? (
                    <div className="panel" style={{ padding: '8px 12px' }}>
                      <div className="font-mono" style={{ fontSize: 10, color: '#c8d4e0' }}>{payload[0]?.payload?.full}</div>
                      <div className="font-display" style={{ fontSize: 14, color: '#7c6fee', marginTop: 4 }}>
                        {((payload[0]?.value as number) * 100).toFixed(1)}%
                      </div>
                      <div className="font-mono" style={{ fontSize: 9, color: '#4a6070' }}>
                        {payload[0]?.payload?.correct} / {payload[0]?.payload?.total} correct
                      </div>
                    </div>
                  ) : null}
                />
                <Bar dataKey="accuracy" radius={[3, 3, 0, 0]}>
                  {regionStats.map((entry, i) => (
                    <Cell key={i} fill={heatColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy by symptom */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 16 }}>
              TOP-1 ACCURACY BY PRESENT SYMPTOM
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={symptomAcc} margin={{ left: 0, right: 12, bottom: 20 }}>
                <XAxis dataKey="name"
                  tick={{ fill: '#8a9eb0', fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}
                  axisLine={false} tickLine={false} angle={-30} textAnchor="end" dy={8}
                />
                <YAxis domain={[0, 1]} tick={{ fill: '#4a6070', fontSize: 9 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  content={({ active, payload }) => active && payload?.length ? (
                    <div className="panel" style={{ padding: '8px 12px' }}>
                      <div className="font-mono" style={{ fontSize: 10, color: '#c8d4e0' }}>{payload[0]?.payload?.name}</div>
                      <div className="font-display" style={{ fontSize: 14, color: '#f5a623', marginTop: 4 }}>
                        {((payload[0]?.value as number) * 100).toFixed(1)}%
                      </div>
                      <div className="font-mono" style={{ fontSize: 9, color: '#4a6070' }}>
                        n = {payload[0]?.payload?.count}
                      </div>
                    </div>
                  ) : null}
                />
                <Bar dataKey="accuracy" radius={[3, 3, 0, 0]}>
                  {symptomAcc.map((entry, i) => (
                    <Cell key={i} fill={heatColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Entropy curve + confusion matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Entropy by symptom count */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 16 }}>
              POSTERIOR ENTROPY VS. SYMPTOM COUNT
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={entropyBySympCount} margin={{ left: 0, right: 16 }}>
                <CartesianGrid stroke="rgba(124,111,238,0.06)" strokeDasharray="3,3" />
                <XAxis dataKey="symptoms" label={{ value: 'Symptoms observed', position: 'bottom', fill: '#4a6070', fontSize: 9 }}
                  tick={{ fill: '#8a9eb0', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, Math.ceil(priorEnt) + 0.5]}
                  tick={{ fill: '#4a6070', fontSize: 9 }} axisLine={false} tickLine={false}
                  label={{ value: 'bits', angle: -90, position: 'insideLeft', fill: '#4a6070', fontSize: 9 }}
                />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="panel" style={{ padding: '8px 12px' }}>
                    <div className="font-mono" style={{ fontSize: 10, color: '#c8d4e0' }}>
                      {payload[0]?.payload?.symptoms} symptoms
                    </div>
                    <div className="font-display" style={{ fontSize: 14, color: '#7c6fee', marginTop: 4 }}>
                      {(payload[0]?.value as number).toFixed(3)} bits
                    </div>
                  </div>
                ) : null} />
                {/* Prior entropy reference line */}
                <Line type="monotone" dataKey={() => priorEnt} stroke="rgba(245,166,35,0.4)"
                  strokeDasharray="4,3" dot={false} strokeWidth={1} legendType="none" />
                <Line type="monotone" dataKey="entropy" stroke="#7c6fee"
                  strokeWidth={2} dot={{ r: 3, fill: '#7c6fee' }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', marginTop: 8 }}>
              Prior entropy: {priorEnt.toFixed(3)} bits — posterior entropy falls as symptoms accumulate
            </div>
          </div>

          {/* Confusion matrix */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 8 }}>
              CONFUSION MATRIX (TRUE × PREDICTED)
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 9, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: 'rgba(0,255,136,0.5)', borderRadius: 1 }} />
                <span className="font-mono" style={{ color: '#4a6070' }}>Correct (diagonal)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: 'rgba(255,59,59,0.4)', borderRadius: 1 }} />
                <span className="font-mono" style={{ color: '#4a6070' }}>Misclassified</span>
              </div>
            </div>
            <ConfusionMatrix matrix={confMatrix} />
          </div>
        </div>

        {/* Per-region table */}
        <div className="panel" style={{ padding: '1.5rem' }}>
          <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 16 }}>
            PER-REGION ACCURACY TABLE
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(124,111,238,0.15)' }}>
                {['Region', 'Transistors (M)', 'Prior', 'Trials', 'Correct', 'Top-1 Acc', 'Top-2 Acc'].map(h => (
                  <th key={h} className="font-mono" style={{
                    textAlign: 'left', padding: '6px 12px', fontSize: 9,
                    color: '#4a6070', letterSpacing: '0.1em', fontWeight: 400,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REGION_NAMES.map((name, i) => {
                const rs = regionStats[i];
                const top2c = trials.filter(t => t.trueRegion === i && t.top2Regions.includes(i)).length;
                const t2acc = rs.total > 0 ? top2c / rs.total : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(124,111,238,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,111,238,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 12px' }}>
                      <span className="font-mono" style={{ fontSize: 11, color: '#c8d4e0' }}>{name}</span>
                    </td>
                    <td className="font-mono" style={{ padding: '8px 12px', fontSize: 11, color: '#8a9eb0' }}>
                      {TRANSISTORS[i].toLocaleString()}
                    </td>
                    <td className="font-mono" style={{ padding: '8px 12px', fontSize: 11, color: '#8a9eb0' }}>
                      {(PRIORS[i] * 100).toFixed(1)}%
                    </td>
                    <td className="font-mono" style={{ padding: '8px 12px', fontSize: 11, color: '#8a9eb0' }}>
                      {rs.total.toLocaleString()}
                    </td>
                    <td className="font-mono" style={{ padding: '8px 12px', fontSize: 11, color: '#8a9eb0' }}>
                      {rs.correct.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: 'var(--surface2)', borderRadius: 2 }}>
                          <div style={{ width: `${rs.accuracy * 100}%`, height: '100%', background: heatColor(rs.accuracy), borderRadius: 2 }} />
                        </div>
                        <span className="font-mono" style={{ fontSize: 11, color: heatColor(rs.accuracy) }}>
                          {(rs.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="font-mono" style={{ fontSize: 11, color: heatColor(t2acc) }}>
                        {(t2acc * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
