import { PRIORS, LIKELIHOOD } from './physics';
import { type ChipConfig, getChipPriors } from './chips';

function logSumExp(arr: number[]): number {
  const max = Math.max(...arr);
  return max + Math.log(arr.reduce((s, x) => s + Math.exp(x - max), 0));
}

export function computePosterior(symptoms: boolean[]): number[] {
  const logPost = PRIORS.map((prior, ri) => {
    const ll = symptoms.reduce((sum, obs, si) => {
      const p = LIKELIHOOD[ri][si];
      return sum + (obs ? Math.log(p) : Math.log(1 - p));
    }, 0);
    return Math.log(prior) + ll;
  });
  const logZ = logSumExp(logPost);
  return logPost.map(lp => Math.exp(lp - logZ));
}

export function computePosteriorForChip(chip: ChipConfig, symptoms: boolean[]): number[] {
  const priors = getChipPriors(chip);
  const logPost = priors.map((prior, ri) => {
    const ll = symptoms.reduce((sum, obs, si) => {
      const p = chip.likelihood[ri][si];
      return sum + (obs ? Math.log(p) : Math.log(1 - p));
    }, 0);
    return Math.log(prior) + ll;
  });
  const logZ = logSumExp(logPost);
  return logPost.map(lp => Math.exp(lp - logZ));
}

export function mapEstimate(posterior: number[]): number {
  return posterior.reduce((best, p, i) => (p > posterior[best] ? i : best), 0);
}

export function top2(posterior: number[]): [number, number] {
  const indexed = posterior.map((p, i) => [p, i] as [number, number]);
  indexed.sort((a, b) => b[0] - a[0]);
  return [indexed[0][1], indexed[1][1]];
}

export function shannonEntropy(dist: number[]): number {
  return -dist.reduce((s, p) => s + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
}

export function priorEntropy(): number {
  return shannonEntropy(PRIORS);
}

// Interpolate heat color: 0 → navy, 0.5 → amber, 1 → red
export function heatColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  if (t < 0.5) {
    const k = t * 2;
    const r = Math.round(10  + k * (245 - 10));
    const g = Math.round(22  + k * (166 - 22));
    const b = Math.round(40  + k * (35  - 40));
    return `rgb(${r},${g},${b})`;
  } else {
    const k = (t - 0.5) * 2;
    const r = Math.round(245 + k * (255 - 245));
    const g = Math.round(166 + k * (59  - 166));
    const b = Math.round(35  + k * (59  - 35));
    return `rgb(${r},${g},${b})`;
  }
}
