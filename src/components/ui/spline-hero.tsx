import { SplineScene } from '@/components/ui/splite'
import { Card } from '@/components/ui/card'
import { Spotlight } from '@/components/ui/spotlight'

export function SplineHero() {
  return (
    <Card className="w-full h-[520px] bg-black/[0.96] relative overflow-hidden border-[rgba(124,111,238,0.15)]">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="cyan" />

      <div className="flex h-full">
        {/* Left: text content */}
        <div className="flex-1 p-10 relative z-10 flex flex-col justify-center gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start">
            <span
              className="text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded-sm border"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#7c6fee',
                borderColor: 'rgba(124,111,238,0.3)',
                background: 'rgba(124,111,238,0.06)',
              }}
            >
              TSMC N3E · 13.5 nm EUV
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-500">
              28 Billion
            </span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #7c6fee 0%, #00ff88 100%)',
              }}
            >
              Transistors
            </span>
          </h1>

          <p
            className="text-neutral-400 max-w-sm text-sm leading-relaxed"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Quantum stochastic defects from EUV photon variance are diagnosed using
            compound-Poisson physics and sequential Bayesian inference across 8 die regions.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-2">
            {[
              { v: '4.58×10⁻⁷', l: 'Fail prob / feature' },
              { v: '95.5%',      l: 'Expected yield'      },
              { v: '79.1%',      l: 'Diagnosis accuracy'  },
            ].map(({ v, l }) => (
              <div key={l}>
                <div
                  className="text-base font-bold"
                  style={{ fontFamily: "'Orbitron', monospace", color: '#7c6fee' }}
                >
                  {v}
                </div>
                <div
                  className="text-[10px] text-neutral-500 mt-0.5 tracking-wide uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3-D scene */}
        <div className="flex-1 relative">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}
