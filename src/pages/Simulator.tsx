import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import DieFlorplan from '../components/DieFlorplan';
import { GlassButton } from '@/components/ui/apple-tahoe-liquid-glass-button';
import {
  REGION_NAMES, SYMPTOMS, simulateOne, chipFailProb, featureFailProb,
  type SimResult,
} from '../lib/physics';
import { computePosterior, mapEstimate, shannonEntropy, heatColor } from '../lib/bayes';

// Technical hardware aliases for the true-defect region.
// Used when the MAP estimate matches the true region — prevents both labels
// reading identically, making clear the diagnosis was inferred from symptoms.
const FAULT_LABELS = [
  'Big Core Complex (BCC)',       // P-Core Cluster
  'Efficiency Core Array (ECA)',  // E-Core Cluster
  'Shader Processing Grid',       // GPU Array
  'Matrix Multiply Fabric',       // Neural Engine / NPU
  'Shared L3 SRAM Bank',          // System-Level Cache
  'DRAM PHY Interface',           // Memory Controller
  'Video Encode Pipeline',        // Media Engine / ISP
  'AXI Interconnect Mesh',        // Fabric / IO / SE
];

interface RunRecord {
  id: number;
  lambda: number; mu: number; kappa: number;
  passed: boolean;
  trueRegion: number | null;
  mapRegion: number | null;
  correct: boolean | null;
  symptoms: boolean[];
}

interface LogEntry {
  ts: string;
  text: string;
  color?: string;
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="font-mono" style={{ fontSize: 11, color: '#8a9eb0', letterSpacing: '0.06em' }}>{label}</span>
        <span className="font-display" style={{ fontSize: 13, color: '#7c6fee' }}>
          {value.toFixed(step < 1 ? 2 : 0)}<span style={{ fontSize: 9, marginLeft: 3 }}>{unit}</span>
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span className="font-mono" style={{ fontSize: 9, color: '#4a6070' }}>{min}</span>
        <span className="font-mono" style={{ fontSize: 9, color: '#4a6070' }}>{max}</span>
      </div>
    </div>
  );
}

export default function Simulator() {
  const [lambda, setLambda] = useState(120);
  const [mu, setMu]         = useState(0.75);
  const [kappa, setKappa]   = useState(48);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [posterior, setPosterior] = useState<number[] | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [log, setLog] = useState<LogEntry[]>([
    { ts: now(), text: 'System initialized. EUV source ready.', color: '#7c6fee' },
    { ts: now(), text: 'Awaiting fabrication command…', color: '#4a6070' },
  ]);
  const runIdRef = useRef(0);

  const addLog = useCallback((text: string, color?: string) => {
    setLog(prev => [...prev.slice(-40), { ts: now(), text, color }]);
  }, []);

  const fabricate = useCallback(() => {
    if (scanning) return;
    setScanning(true);
    setResult(null);
    setPosterior(null);
    addLog(`Firing EUV source — λ=${lambda}, μ=${mu}, κ=${kappa}`, '#f5a623');
  }, [scanning, lambda, mu, kappa, addLog]);

  const onScanEnd = useCallback(() => {
    const r = simulateOne(lambda, mu, kappa);
    setResult(r);

    const id = ++runIdRef.current;
    if (r.passed) {
      addLog('Chip passed — no defect detected.', '#00ff88');
      setPosterior(null);
      setHistory(prev => [{ id, lambda, mu, kappa, passed: true, trueRegion: null, mapRegion: null, correct: null, symptoms: [] }, ...prev.slice(0, 49)]);
    } else {
      const post = computePosterior(r.symptoms);
      const map = mapEstimate(post);
      const correct = map === r.trueRegion;
      setPosterior(post);
      addLog(`Defect detected! True region: ${REGION_NAMES[r.trueRegion!]}`, '#ff3b3b');
      addLog(`Bayesian MAP → ${REGION_NAMES[map]} (${(post[map]*100).toFixed(1)}%)`, correct ? '#00ff88' : '#f5a623');
      addLog(`Symptoms: ${r.symptoms.map((s, i) => s ? SYMPTOMS[i] : null).filter(Boolean).join(', ') || 'none'}`, '#8a9eb0');
      const ent = shannonEntropy(post);
      addLog(`Posterior entropy: ${ent.toFixed(2)} bits`, '#4a6070');
      setHistory(prev => [{ id, lambda, mu, kappa, passed: false, trueRegion: r.trueRegion!, mapRegion: map, correct, symptoms: r.symptoms }, ...prev.slice(0, 49)]);
    }
    setScanning(false);
  }, [lambda, mu, kappa, addLog]);

  const p = featureFailProb(lambda, mu, kappa);
  const chipP = chipFailProb(lambda, mu, kappa);
  const yieldPct = (1 - chipP) * 100;
  const yieldColor = yieldPct > 97 ? '#00ff88' : yieldPct > 92 ? '#f5a623' : '#ff3b3b';

  const passes = history.filter(r => r.passed).length;
  const fails  = history.filter(r => !r.passed).length;
  const correct = history.filter(r => r.correct === true).length;
  const accuracy = fails > 0 ? ((correct / fails) * 100).toFixed(1) : '—';

  const barData = posterior
    ? REGION_NAMES.map((name, i) => ({ name: name.split(' ')[0], full: name, value: posterior[i] }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="grid-bg" style={{ minHeight: '100%', padding: '1.5rem' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="font-display" style={{ fontSize: 13, color: '#7c6fee', letterSpacing: '0.12em' }}>
              FABRICATION SIMULATOR
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: '#4a6070', marginTop: 4 }}>
              Apple M4 · TSMC N3E · 28B transistors · 100k hotspot features
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
            {[
              { label: 'RUN', value: String(history.length).padStart(4, '0'), color: '#c8d4e0' },
              { label: 'PASS', value: String(passes), color: '#00ff88' },
              { label: 'FAIL', value: String(fails), color: '#ff3b3b' },
              { label: 'ACC', value: `${accuracy}%`, color: '#f5a623' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: 16, color }}>{value}</div>
                <div className="font-mono" style={{ fontSize: 8, color: '#4a6070', letterSpacing: '0.1em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 14, alignItems: 'start' }}>

          {/* ── Left: controls ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel" style={{ padding: '1.25rem' }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 16 }}>
                EUV PARAMETERS
              </div>
              <Slider label="Photon dose λ" value={lambda} min={80} max={160} step={1} unit="ph/feature" onChange={setLambda} />
              <Slider label="Quantum yield μ" value={mu} min={0.30} max={1.20} step={0.01} unit="e⁻/ph" onChange={setMu} />
              <Slider label="Threshold κ" value={kappa} min={40} max={56} step={1} unit="e⁻" onChange={setKappa} />

              {/* Derived metrics */}
              <div style={{ borderTop: '1px solid rgba(124,111,238,0.1)', paddingTop: 14, marginTop: 4 }}>
                {[
                  { l: 'Mean electrons Λ', v: (lambda * mu).toFixed(1) },
                  { l: 'Feature fail prob',  v: `${(p * 1e7).toFixed(2)}×10⁻⁷` },
                  { l: 'Chip fail prob',     v: `${(chipP * 100).toFixed(3)}%` },
                ].map(({ l, v }) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="font-mono" style={{ fontSize: 9, color: '#4a6070' }}>{l}</span>
                    <span className="font-mono" style={{ fontSize: 10, color: '#7c6fee' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Yield meter */}
            <div className="panel" style={{ padding: '1.25rem' }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 12 }}>
                EXPECTED YIELD
              </div>
              <div className="font-display" style={{ fontSize: 28, color: yieldColor, textAlign: 'center', marginBottom: 10, letterSpacing: '0.04em' }}>
                {yieldPct.toFixed(2)}%
              </div>
              <div style={{ background: 'var(--surface2)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${yieldPct}%`, background: yieldColor }}
                  transition={{ duration: 0.4 }}
                  style={{ height: '100%', boxShadow: `0 0 8px ${yieldColor}` }}
                />
              </div>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', textAlign: 'center', marginTop: 8 }}>
                {(chipP * 100).toFixed(3)}% fail rate
              </div>
            </div>

            {/* Fabricate button */}
            <GlassButton
              onClick={fabricate}
              disabled={scanning}
              size="default"
              glassColor={scanning ? 'rgba(74,96,112,0.10)' : 'rgba(124,111,238,0.12)'}
              style={{
                width: '100%',
                fontFamily: "'IBM Plex Mono','JetBrains Mono',monospace",
                fontSize: 12,
                letterSpacing: '0.14em',
                cursor: scanning ? 'wait' : 'pointer',
                color: scanning ? '#4a6070' : '#7c6fee',
              }}
            >
              {scanning ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  SCANNING…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  FABRICATE CHIP
                </>
              )}
            </GlassButton>
          </div>

          {/* ── Center: die ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel" style={{ padding: '1rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.12em' }}>
                  DIE FLOORPLAN — APPLE M4 (28B TRANSISTORS)
                </span>
                <span className="font-mono" style={{ fontSize: 9, color: scanning ? '#f5a623' : '#4a6070' }}>
                  {scanning ? '◉ EUV SCANNING' : result ? (result.passed ? '● PASS' : '● DEFECT DETECTED') : '○ IDLE'}
                </span>
              </div>
              <DieFlorplan
                posterior={posterior ?? undefined}
                defectRegion={posterior ? mapEstimate(posterior) : result?.trueRegion ?? undefined}
                scanning={scanning}
                onScanEnd={onScanEnd}
              />
              {/* Legend */}
              {posterior && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="font-mono" style={{ fontSize: 8, color: '#4a6070' }}>POSTERIOR:</span>
                  {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 10, height: 10, background: heatColor(t), borderRadius: 1 }} />
                      <span className="font-mono" style={{ fontSize: 8, color: '#4a6070' }}>{(t * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Result banner */}
            <AnimatePresence>
              {result && !scanning && (
                <motion.div
                  key={result.passed ? 'pass' : 'fail'}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="panel"
                  style={{
                    padding: '1rem 1.25rem',
                    borderColor: result.passed ? 'rgba(0,255,136,0.3)' : 'rgba(255,59,59,0.3)',
                    background: result.passed ? 'rgba(0,255,136,0.05)' : 'rgba(255,59,59,0.05)',
                  }}
                >
                  {result.passed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 22 }}>✓</span>
                      <div>
                        <div className="font-display" style={{ fontSize: 13, color: '#00ff88', letterSpacing: '0.1em' }}>
                          CHIP PASSED
                        </div>
                        <div className="font-mono" style={{ fontSize: 10, color: '#4a6070', marginTop: 3 }}>
                          All 100,000 hotspot features within spec
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.1em', marginBottom: 4 }}>TRUE DEFECT</div>
                        <div className="font-display" style={{ fontSize: 13, color: '#ff3b3b', letterSpacing: '0.06em' }}>
                          {posterior && mapEstimate(posterior) === result.trueRegion
                            ? FAULT_LABELS[result.trueRegion!]
                            : REGION_NAMES[result.trueRegion!]}
                        </div>
                      </div>
                      {posterior && (
                        <>
                          <div>
                            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', marginBottom: 4, letterSpacing: '0.1em' }}>MAP ESTIMATE</div>
                            <div className="font-display" style={{ fontSize: 13, color: mapEstimate(posterior) === result.trueRegion ? '#00ff88' : '#f5a623', letterSpacing: '0.06em' }}>
                              {REGION_NAMES[mapEstimate(posterior)]}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', marginBottom: 4, letterSpacing: '0.1em' }}>CONFIDENCE</div>
                            <div className="font-display" style={{ fontSize: 13, color: '#7c6fee', letterSpacing: '0.06em' }}>
                              {(posterior[mapEstimate(posterior)] * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', marginBottom: 4, letterSpacing: '0.1em' }}>DIAGNOSIS</div>
                            <div className="font-display" style={{ fontSize: 13, letterSpacing: '0.06em', color: mapEstimate(posterior) === result.trueRegion ? '#00ff88' : '#f5a623' }}>
                              {mapEstimate(posterior) === result.trueRegion ? '✓ CORRECT' : '✗ INCORRECT'}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* History table */}
            {history.length > 0 && (
              <div className="panel" style={{ padding: '1rem', maxHeight: 220, overflow: 'hidden' }}>
                <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 10 }}>
                  PRODUCTION RUN HISTORY
                </div>
                <div style={{ overflowY: 'auto', maxHeight: 170 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(124,111,238,0.1)' }}>
                        {['RUN', 'λ', 'RESULT', 'REGION', 'MAP', 'ACC'].map(h => (
                          <th key={h} className="font-mono" style={{ textAlign: 'left', padding: '3px 6px', fontSize: 8, color: '#4a6070', letterSpacing: '0.1em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 20).map(run => (
                        <tr key={run.id} style={{ borderBottom: '1px solid rgba(124,111,238,0.05)' }}>
                          <td className="font-mono" style={{ padding: '3px 6px', color: '#4a6070' }}>
                            {String(run.id).padStart(4, '0')}
                          </td>
                          <td className="font-mono" style={{ padding: '3px 6px', color: '#8a9eb0' }}>{run.lambda}</td>
                          <td style={{ padding: '3px 6px' }}>
                            <span className="font-mono" style={{ fontSize: 9, color: run.passed ? '#00ff88' : '#ff3b3b' }}>
                              {run.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="font-mono" style={{ padding: '3px 6px', color: '#8a9eb0', fontSize: 9 }}>
                            {run.trueRegion != null ? REGION_NAMES[run.trueRegion].split(' ')[0] : '—'}
                          </td>
                          <td className="font-mono" style={{ padding: '3px 6px', color: '#8a9eb0', fontSize: 9 }}>
                            {run.mapRegion != null ? REGION_NAMES[run.mapRegion].split(' ')[0] : '—'}
                          </td>
                          <td style={{ padding: '3px 6px' }}>
                            {run.correct != null && (
                              <span className="font-mono" style={{ fontSize: 9, color: run.correct ? '#00ff88' : '#ff3b3b' }}>
                                {run.correct ? '✓' : '✗'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: posterior + log ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Posterior bar chart */}
            <div className="panel" style={{ padding: '1.25rem' }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 12 }}>
                POSTERIOR P(REGION | SYMPTOMS)
              </div>
              {posterior ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 1]} hide />
                    <YAxis type="category" dataKey="name" width={56}
                      tick={{ fill: '#8a9eb0', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                      tickLine={false} axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => active && payload?.length ? (
                        <div className="panel" style={{ padding: '8px 12px', fontSize: 11 }}>
                          <div className="font-mono" style={{ color: '#c8d4e0' }}>{payload[0]?.payload?.full}</div>
                          <div className="font-display" style={{ color: '#7c6fee', marginTop: 4 }}>
                            {((payload[0]?.value as number) * 100).toFixed(2)}%
                          </div>
                        </div>
                      ) : null}
                    />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={heatColor(entry.value / (barData[0]?.value || 1))} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="font-mono" style={{ fontSize: 10, color: '#4a6070' }}>
                    {scanning ? 'Computing…' : 'Awaiting run…'}
                  </span>
                </div>
              )}
            </div>

            {/* Symptom log */}
            <div className="panel" style={{ padding: '1.25rem', flex: 1 }}>
              <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 10 }}>
                TELEMETRY LOG
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {log.slice().reverse().map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span className="font-mono" style={{ fontSize: 9, color: '#4a6070', flexShrink: 0 }}>{entry.ts}</span>
                    <span className="font-mono" style={{ fontSize: 10, color: entry.color ?? '#8a9eb0', lineHeight: 1.5 }}>{entry.text}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: 9, color: '#4a6070' }}>{now()}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: '#4a6070' }}>
                    _<span className="cursor-blink">█</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Active symptoms */}
            {result && !result.passed && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="panel"
                  style={{ padding: '1.25rem' }}
                >
                  <div className="font-mono" style={{ fontSize: 9, color: '#4a6070', letterSpacing: '0.14em', marginBottom: 10 }}>
                    OBSERVED SYMPTOMS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {SYMPTOMS.map((sym, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: result.symptoms[i] ? '#ff3b3b' : '#1a2436',
                          boxShadow: result.symptoms[i] ? '0 0 6px #ff3b3b' : 'none',
                        }} />
                        <span className="font-mono" style={{
                          fontSize: 10,
                          color: result.symptoms[i] ? '#c8d4e0' : '#4a6070',
                        }}>
                          {sym}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
