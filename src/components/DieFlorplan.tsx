import { motion, AnimatePresence } from 'framer-motion';
import { heatColor } from '../lib/bayes';
import type { ChipConfig, RegionRect } from '../lib/chips';

interface Props {
  chip: ChipConfig;
  posterior?: number[];
  defectRegion?: number | null;
  scanning?: boolean;
  onScanEnd?: () => void;
  highlightRegion?: number | null;
}

// Internal detail patterns per region, dispatched by chip id and regionIdx
function RegionDetail({ chipId, regionIdx, rect }: { chipId: string; regionIdx: number; rect: RegionRect }) {
  const { x, y, w, h } = rect;
  const clip = `region-clip-${chipId}-${regionIdx}`;

  let detail: React.ReactNode = null;

  if (chipId === 'm4') {
    if (regionIdx === 0) {
      detail = (
        <>{Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => (
            <rect key={`${row}-${col}`}
              x={x + 6 + col * 24} y={y + 6 + row * 27}
              width={18} height={21}
              fill="none" stroke="#7c6fee" strokeWidth={0.6}
            />
          ))
        )}</>
      );
    } else if (regionIdx === 1) {
      detail = (
        <>{Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => (
            <rect key={`${row}-${col}`}
              x={x + 5 + col * 14} y={y + 5 + row * 22}
              width={10} height={16}
              fill="none" stroke="#7c6fee" strokeWidth={0.5}
            />
          ))
        )}</>
      );
    } else if (regionIdx === 2) {
      detail = (
        <>{Array.from({ length: 10 }, (_, row) =>
          Array.from({ length: 14 }, (_, col) => (
            <rect key={`${row}-${col}`}
              x={x + 4 + col * 13} y={y + 4 + row * 14}
              width={9} height={10}
              fill="none" stroke="#00ff88" strokeWidth={0.4}
            />
          ))
        )}</>
      );
    } else if (regionIdx === 3) {
      detail = (
        <>{Array.from({ length: 12 }, (_, row) =>
          Array.from({ length: 16 }, (_, col) => (
            <circle key={`${row}-${col}`}
              cx={x + 10 + col * 15} cy={y + 10 + row * 13}
              r={2.5}
              fill="#c084fc" opacity={0.7}
            />
          ))
        )}</>
      );
    } else if (regionIdx === 4) {
      detail = (
        <>{Array.from({ length: 22 }, (_, row) => (
          <line key={row}
            x1={x + 4} y1={y + 8 + row * 11}
            x2={x + w - 4} y2={y + 8 + row * 11}
            stroke="#7c6fee" strokeWidth={0.6}
          />
        ))}</>
      );
    } else if (regionIdx === 5) {
      detail = (
        <>{Array.from({ length: 10 }, (_, col) => (
          <line key={col}
            x1={x + 8 + col * 10} y1={y + 4}
            x2={x + 8 + col * 10} y2={y + h - 4}
            stroke="#f5a623" strokeWidth={0.6}
          />
        ))}</>
      );
    } else if (regionIdx === 6) {
      detail = (
        <>{Array.from({ length: 4 }, (_, i) => (
          <rect key={i}
            x={x + 6 + i * 25} y={y + 8}
            width={18} height={h - 16} rx={4}
            fill="none" stroke="#00ff88" strokeWidth={0.6}
          />
        ))}</>
      );
    } else if (regionIdx === 7) {
      detail = (
        <>
          {Array.from({ length: 6 }, (_, row) => (
            <line key={`h${row}`}
              x1={x + 4} y1={y + 10 + row * 9}
              x2={x + w - 4} y2={y + 10 + row * 9}
              stroke="#7c6fee" strokeWidth={0.4}
            />
          ))}
          {Array.from({ length: 30 }, (_, col) => (
            <line key={`v${col}`}
              x1={x + 10 + col * 16} y1={y + 4}
              x2={x + 10 + col * 16} y2={y + h - 4}
              stroke="#7c6fee" strokeWidth={0.4}
            />
          ))}
        </>
      );
    }
  } else if (chipId === 'snapdragon') {
    if (regionIdx === 0) {
      // Prime CPU: two large vertical blocks side by side (2 Oryon cores)
      detail = (
        <>
          {Array.from({ length: 2 }, (_, col) => (
            <rect key={col} x={x+6+col*(w/2-4)} y={y+6} width={w/2-8} height={h-12} rx={3}
              fill="none" stroke="#7c6fee" strokeWidth={0.9} />
          ))}
          {Array.from({ length: 2 }, (_, col) =>
            Array.from({ length: 3 }, (_, row) => (
              <line key={`${col}-${row}`} x1={x+8+col*(w/2-4)} y1={y+18+row*20} x2={x+w/2-6+col*(w/2-4)} y2={y+18+row*20}
                stroke="#7c6fee" strokeWidth={0.5} />
            ))
          )}
        </>
      );
    } else if (regionIdx === 1) {
      // Perf CPU: 6 smaller blocks in 2 rows of 3
      detail = (
        <>
          {Array.from({ length: 2 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => (
              <rect key={`${row}-${col}`} x={x+4+col*(w/3-2)} y={y+6+row*(h/2-4)} width={w/3-6} height={h/2-8} rx={2}
                fill="none" stroke="#7c6fee" strokeWidth={0.5} />
            ))
          )}
        </>
      );
    } else if (regionIdx === 2) {
      // GPU: dense shader tile grid 9 rows x 13 cols
      detail = (
        <>
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: 13 }, (_, col) => (
              <rect key={`${row}-${col}`} x={x+4+col*20} y={y+4+row*17} width={14} height={11}
                fill="none" stroke="#00ff88" strokeWidth={0.4} />
            ))
          )}
        </>
      );
    } else if (regionIdx === 3) {
      // NPU: dot matrix 8x10
      detail = (
        <>
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 10 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={x+8+col*9} cy={y+8+row*19} r={2.5} fill="#c084fc" opacity={0.7} />
            ))
          )}
        </>
      );
    } else if (regionIdx === 4) {
      // SLC: SRAM rows 12 rows
      detail = (
        <>
          {Array.from({ length: 12 }, (_, row) => (
            <line key={row} x1={x+4} y1={y+8+row*11} x2={x+w-4} y2={y+8+row*11}
              stroke="#7c6fee" strokeWidth={0.6} />
          ))}
        </>
      );
    } else if (regionIdx === 5) {
      // ISP/VPU: 4 codec sub-block rects
      detail = (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <rect key={i} x={x+6+i*43} y={y+8} width={36} height={h-16} rx={4}
              fill="none" stroke="#00ff88" strokeWidth={0.6} />
          ))}
        </>
      );
    } else if (regionIdx === 6) {
      // Fabric/MC: mesh routing lines
      detail = (
        <>
          {Array.from({ length: 5 }, (_, row) => (
            <line key={`h${row}`} x1={x+4} y1={y+8+row*10} x2={x+w-4} y2={y+8+row*10}
              stroke="#7c6fee" strokeWidth={0.4} />
          ))}
          {Array.from({ length: 14 }, (_, col) => (
            <line key={`v${col}`} x1={x+8+col*13} y1={y+4} x2={x+8+col*13} y2={y+h-4}
              stroke="#7c6fee" strokeWidth={0.4} />
          ))}
        </>
      );
    } else if (regionIdx === 7) {
      // Modem: parallel PHY lane lines (vertical, denser)
      detail = (
        <>
          {Array.from({ length: 16 }, (_, col) => (
            <line key={col} x1={x+6+col*7} y1={y+4} x2={x+6+col*7} y2={y+h-4}
              stroke="#f5a623" strokeWidth={0.7} />
          ))}
        </>
      );
    }
  } else if (chipId === 'dimensity') {
    if (regionIdx === 0) {
      // Prime CPU: single large tile with internal lines
      detail = (
        <>
          <rect x={x+6} y={y+6} width={w-12} height={h-12} rx={3}
            fill="none" stroke="#7c6fee" strokeWidth={0.9} />
          {Array.from({ length: 2 }, (_, row) => (
            <line key={row} x1={x+8} y1={y+18+row*14} x2={x+w-8} y2={y+18+row*14}
              stroke="#7c6fee" strokeWidth={0.5} />
          ))}
        </>
      );
    } else if (regionIdx === 1) {
      // Mid CPU: 3 blocks stacked
      detail = (
        <>
          {Array.from({ length: 3 }, (_, row) => (
            <rect key={row} x={x+6} y={y+6+row*(h/3-2)} width={w-12} height={h/3-6} rx={2}
              fill="none" stroke="#7c6fee" strokeWidth={0.5} />
          ))}
        </>
      );
    } else if (regionIdx === 2) {
      // Eff CPU: 4 smaller blocks in 2x2
      detail = (
        <>
          {Array.from({ length: 2 }, (_, row) =>
            Array.from({ length: 2 }, (_, col) => (
              <rect key={`${row}-${col}`} x={x+4+col*(w/2-2)} y={y+6+row*(h/2-4)} width={w/2-8} height={h/2-10} rx={2}
                fill="none" stroke="#7c6fee" strokeWidth={0.5} />
            ))
          )}
        </>
      );
    } else if (regionIdx === 3) {
      // GPU (Immortalis, 12 CU): large dense shader grid 12x14
      detail = (
        <>
          {Array.from({ length: 12 }, (_, row) =>
            Array.from({ length: 14 }, (_, col) => (
              <rect key={`${row}-${col}`} x={x+4+col*13} y={y+4+row*25} width={9} height={19}
                fill="none" stroke="#00ff88" strokeWidth={0.35} />
            ))
          )}
        </>
      );
    } else if (regionIdx === 4) {
      // NPU 890: dot matrix 10x12
      detail = (
        <>
          {Array.from({ length: 10 }, (_, row) =>
            Array.from({ length: 12 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={x+10+col*17} cy={y+10+row*18} r={2.5} fill="#c084fc" opacity={0.7} />
            ))
          )}
        </>
      );
    } else if (regionIdx === 5) {
      // ISP: 3 codec sub-blocks
      detail = (
        <>
          {Array.from({ length: 3 }, (_, i) => (
            <rect key={i} x={x+6+i*57} y={y+8} width={48} height={h-16} rx={4}
              fill="none" stroke="#00ff88" strokeWidth={0.6} />
          ))}
        </>
      );
    } else if (regionIdx === 6) {
      // Modem: parallel PHY lanes horizontal
      detail = (
        <>
          {Array.from({ length: 5 }, (_, row) => (
            <line key={`h${row}`} x1={x+4} y1={y+8+row*9} x2={x+w-4} y2={y+8+row*9}
              stroke="#f5a623" strokeWidth={0.6} />
          ))}
          {Array.from({ length: 30 }, (_, col) => (
            <line key={`v${col}`} x1={x+8+col*10} y1={y+4} x2={x+8+col*10} y2={y+h-4}
              stroke="#f5a623" strokeWidth={0.3} />
          ))}
        </>
      );
    } else if (regionIdx === 7) {
      // Cache/MC: SRAM rows 10 rows
      detail = (
        <>
          {Array.from({ length: 10 }, (_, row) => (
            <line key={row} x1={x+4} y1={y+8+row*10} x2={x+w-4} y2={y+8+row*10}
              stroke="#7c6fee" strokeWidth={0.6} />
          ))}
        </>
      );
    }
  }

  return (
    <g clipPath={`url(#${clip})`} opacity={0.35}>
      <defs>
        <clipPath id={clip}>
          <rect x={x+1} y={y+1} width={w-2} height={h-2} />
        </clipPath>
      </defs>
      {detail}
    </g>
  );
}

export default function DieFlorplan({ chip, posterior, defectRegion, scanning, onScanEnd, highlightRegion }: Props) {
  const maxPost = posterior ? Math.max(...posterior) : 0;
  const regionCenters = chip.regionRects.map(r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 }));

  return (
    <div style={{ width: '100%', aspectRatio: '500 / 380', position: 'relative' }}>
      <svg
        viewBox="0 0 500 380"
        width="100%" height="100%"
        style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {/* Die substrate */}
        <rect x={0} y={0} width={500} height={380} fill="#0d0d18" />

        {/* Substrate grid */}
        <defs>
          <pattern id="micro-grid" width={8} height={8} patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(124,111,238,0.04)" strokeWidth={0.5} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={500} height={380} fill="url(#micro-grid)" />

        {/* Region blocks */}
        {chip.regionRects.map((rect, i) => {
          const post = posterior?.[i] ?? 0;
          const normalizedPost = maxPost > 0 ? post / maxPost : 0;
          const baseColor = chip.regionColors[i];
          const heat = posterior ? heatColor(normalizedPost) : baseColor;
          const isHighlit = highlightRegion === i || defectRegion === i;

          return (
            <g key={i}>
              {/* Base fill */}
              <rect
                x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                fill={baseColor}
                rx={1}
              />
              {/* Heat overlay */}
              {posterior && (
                <rect
                  x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                  fill={heat}
                  opacity={0.55 * normalizedPost}
                  rx={1}
                />
              )}
              {/* Architectural detail */}
              <RegionDetail chipId={chip.id} regionIdx={i} rect={rect} />
              {/* Border */}
              <rect
                x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                fill="none"
                stroke={isHighlit ? '#7c6fee' : 'rgba(124,111,238,0.22)'}
                strokeWidth={isHighlit ? 1.5 : 0.8}
                rx={1}
              />
              {/* Region label */}
              <text
                x={rect.x + rect.w / 2}
                y={rect.y + 11}
                textAnchor="middle"
                fontSize={rect.w < 80 ? 6.5 : 7.5}
                fill="rgba(200,212,224,0.7)"
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing="0.04em"
              >
                {chip.regionNames[i].split(' ')[0].toUpperCase()}
              </text>
              {/* Posterior probability label */}
              {posterior && post > 0.03 && (
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={rect.w < 80 ? 8 : 11}
                  fontWeight="700"
                  fill={normalizedPost > 0.6 ? '#ffffff' : 'rgba(200,212,224,0.8)'}
                  fontFamily="'Orbitron', monospace"
                >
                  {(post * 100).toFixed(1)}%
                </text>
              )}
              {/* Secure Enclave pocket — M4 P-Core only */}
              {chip.id === 'm4' && i === 0 && (
                <g>
                  <rect x={rect.x + 4} y={rect.y + 4} width={28} height={22}
                    fill="#0a1020" stroke="#f5a623" strokeWidth={0.8} rx={1} />
                  <text x={rect.x + 18} y={rect.y + 14}
                    textAnchor="middle" fontSize={4.5}
                    fill="#f5a623" fontFamily="'JetBrains Mono', monospace"
                    letterSpacing="0.05em">SE</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Defect marker */}
        <AnimatePresence>
          {defectRegion != null && (
            <g key={`defect-${defectRegion}`}>
              <motion.text
                x={regionCenters[defectRegion].x}
                y={(() => {
                  const rect = chip.regionRects[defectRegion];
                  return rect.h < 100
                    ? rect.y - 8
                    : regionCenters[defectRegion].y - 14;
                })()}
                textAnchor="middle" fontSize={7}
                fill="#ff3b3b"
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing="0.08em"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ▼ MAP ESTIMATE
              </motion.text>
            </g>
          )}
        </AnimatePresence>

        {/* EUV scan beam */}
        <AnimatePresence>
          {scanning && (
            <motion.g key="scan-beam"
              initial={{ x: -40 }}
              animate={{ x: 540 }}
              transition={{ duration: 1.8, ease: 'linear' }}
              onAnimationComplete={onScanEnd}
            >
              <defs>
                <linearGradient id="beam-grad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%"   stopColor="transparent" />
                  <stop offset="40%"  stopColor="rgba(124,111,238,0.08)" />
                  <stop offset="50%"  stopColor="rgba(124,111,238,0.5)" />
                  <stop offset="60%"  stopColor="rgba(124,111,238,0.08)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <rect x={-30} y={0} width={80} height={380}
                fill="url(#beam-grad)"
              />
              <line x1={0} y1={0} x2={0} y2={380}
                stroke="rgba(124,111,238,0.9)" strokeWidth={1}
                style={{ filter: 'drop-shadow(0 0 4px #7c6fee)' }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Die border */}
        <rect x={1} y={1} width={498} height={378}
          fill="none" stroke="rgba(124,111,238,0.35)" strokeWidth={1.5} />
        {/* Corner marks */}
        {[[0,0],[490,0],[0,370],[490,370]].map(([cx, cy], idx) => (
          <g key={idx} transform={`translate(${cx},${cy})`}>
            <line x1={0} y1={0} x2={10} y2={0} stroke="#7c6fee" strokeWidth={1} />
            <line x1={0} y1={0} x2={0}  y2={10} stroke="#7c6fee" strokeWidth={1} />
          </g>
        ))}
      </svg>
    </div>
  );
}
