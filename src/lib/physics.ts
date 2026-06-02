export const REGION_NAMES = [
  'P-Core Cluster',
  'E-Core Cluster',
  'GPU Array',
  'Neural Engine / NPU',
  'System-Level Cache',
  'Memory Controller',
  'Media Engine / ISP',
  'Fabric / IO / SE',
];

export const TRANSISTORS = [440, 210, 1100, 1400, 700, 200, 250, 350]; // millions

export const SYMPTOMS = [
  'Integer / Branch Error',
  'FP / SIMD Error',
  'GPU Render Corruption',
  'NPU Inference Error',
  'Cache Coherency Fault',
  'Memory BW Collapse',
  'Video Codec Failure',
  'Idle Power Anomaly',
];

export const LIKELIHOOD: number[][] = [
  [0.92, 0.62, 0.04, 0.03, 0.22, 0.05, 0.02, 0.42],
  [0.62, 0.28, 0.03, 0.02, 0.14, 0.04, 0.02, 0.14],
  [0.04, 0.10, 0.95, 0.06, 0.14, 0.05, 0.08, 0.58],
  [0.03, 0.07, 0.05, 0.97, 0.09, 0.04, 0.03, 0.68],
  [0.52, 0.46, 0.40, 0.28, 0.93, 0.22, 0.12, 0.10],
  [0.18, 0.16, 0.18, 0.10, 0.42, 0.92, 0.07, 0.14],
  [0.03, 0.04, 0.07, 0.03, 0.04, 0.03, 0.94, 0.10],
  [0.24, 0.18, 0.14, 0.09, 0.28, 0.18, 0.09, 0.16],
];

export const TOTAL_TRANSISTORS = TRANSISTORS.reduce((a, b) => a + b, 0);
export const PRIORS = TRANSISTORS.map(t => t / TOTAL_TRANSISTORS);

function poissonCDF(lambda: number, maxK: number): number {
  let cdf = 0;
  let term = Math.exp(-lambda);
  cdf += term;
  for (let i = 1; i <= maxK; i++) {
    term *= lambda / i;
    cdf += term;
  }
  return Math.min(cdf, 1);
}

export function featureFailProb(lambda: number, mu: number, kappa: number): number {
  return poissonCDF(lambda * mu, kappa - 1);
}

export function chipFailProb(lambda: number, mu: number, kappa: number, nFeatures = 100_000): number {
  const p = featureFailProb(lambda, mu, kappa);
  return 1 - Math.pow(1 - p, nFeatures);
}

export interface SimResult {
  passed: boolean;
  trueRegion: number | null;
  symptoms: boolean[];
}

export function simulateOne(lambda: number, mu: number, kappa: number): SimResult {
  const fails = Math.random() < chipFailProb(lambda, mu, kappa);
  if (!fails) return { passed: true, trueRegion: null, symptoms: Array(8).fill(false) };

  let trueRegion = PRIORS.length - 1;
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < PRIORS.length; i++) {
    cum += PRIORS[i];
    if (r <= cum) { trueRegion = i; break; }
  }

  const symptoms = LIKELIHOOD[trueRegion].map(p => Math.random() < p);
  return { passed: false, trueRegion, symptoms };
}

// Die floorplan geometry (viewBox 0 0 500 380)
export const REGION_RECTS = [
  { x: 2,   y: 2,   w: 108, h: 148 }, // P-Core
  { x: 112, y: 2,   w: 68,  h: 148 }, // E-Core
  { x: 182, y: 2,   w: 183, h: 148 }, // GPU
  { x: 2,   y: 152, w: 248, h: 162 }, // NPU
  { x: 367, y: 2,   w: 131, h: 258 }, // SLC
  { x: 252, y: 152, w: 113, h: 88  }, // MemCtrl
  { x: 252, y: 242, w: 113, h: 72  }, // Media
  { x: 2,   y: 316, w: 496, h: 62  }, // Fabric
];

export const REGION_CENTERS = REGION_RECTS.map(r => ({
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
}));
