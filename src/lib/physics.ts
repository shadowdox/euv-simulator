import { M4, SYMPTOMS as CHIP_SYMPTOMS, type ChipConfig, getChipPriors } from './chips';

export { CHIP_SYMPTOMS as SYMPTOMS };

export const REGION_NAMES  = M4.regionNames;
export const TRANSISTORS   = M4.transistorCounts;
export const PRIORS        = getChipPriors(M4);
export const LIKELIHOOD    = M4.likelihood;
export const REGION_RECTS  = M4.regionRects;
export const REGION_CENTERS = M4.regionRects.map(r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 }));

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

export function simulateOne(
  lambda: number, mu: number, kappa: number,
  chip: ChipConfig = M4
): SimResult {
  const priors = getChipPriors(chip);
  const fails = Math.random() < chipFailProb(lambda, mu, kappa);
  if (!fails) return { passed: true, trueRegion: null, symptoms: Array(chip.likelihood[0].length).fill(false) };
  let trueRegion = priors.length - 1;
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < priors.length; i++) {
    cum += priors[i];
    if (r <= cum) { trueRegion = i; break; }
  }
  const symptoms = chip.likelihood[trueRegion].map(p => Math.random() < p);
  return { passed: false, trueRegion, symptoms };
}
