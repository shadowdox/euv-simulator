export const SYMPTOMS = [
  'Integer / Branch Error',
  'FP / SIMD Error',
  'GPU Render Corruption',
  'NPU Inference Error',
  'Cache Coherency Fault',
  'Memory BW Collapse',
  'Video Codec Failure',
  'Idle Power Anomaly',
  'Connectivity / Modem Failure',
];

export interface RegionRect { x: number; y: number; w: number; h: number; }

export interface ChipConfig {
  id: 'm4' | 'snapdragon' | 'dimensity';
  name: string;
  shortName: string;
  node: string;
  transistors: string;
  regionNames: string[];
  transistorCounts: number[];
  likelihood: number[][];
  regionRects: RegionRect[];
  regionColors: string[];
  faultLabels: string[];
}

export function getChipPriors(chip: ChipConfig): number[] {
  const total = chip.transistorCounts.reduce((a, b) => a + b, 0);
  return chip.transistorCounts.map(t => t / total);
}

// ── Apple M4 ─────────────────────────────────────────────────
export const M4: ChipConfig = {
  id: 'm4',
  name: 'Apple M4',
  shortName: 'M4',
  node: 'TSMC N3E',
  transistors: '28B',
  regionNames: [
    'P-Core Cluster',
    'E-Core Cluster',
    'GPU Array',
    'Neural Engine / NPU',
    'System-Level Cache',
    'Memory Controller',
    'Media Engine / ISP',
    'Fabric / IO / SE',
  ],
  transistorCounts: [440, 210, 1100, 1400, 700, 200, 250, 350],
  likelihood: [
    [0.92, 0.62, 0.04, 0.03, 0.22, 0.05, 0.02, 0.42, 0.01],
    [0.62, 0.28, 0.03, 0.02, 0.14, 0.04, 0.02, 0.14, 0.01],
    [0.04, 0.10, 0.95, 0.06, 0.14, 0.05, 0.08, 0.58, 0.01],
    [0.03, 0.07, 0.05, 0.97, 0.09, 0.04, 0.03, 0.68, 0.01],
    [0.52, 0.46, 0.40, 0.28, 0.93, 0.22, 0.12, 0.10, 0.01],
    [0.18, 0.16, 0.18, 0.10, 0.42, 0.92, 0.07, 0.14, 0.01],
    [0.03, 0.04, 0.07, 0.03, 0.04, 0.03, 0.94, 0.10, 0.01],
    [0.24, 0.18, 0.14, 0.09, 0.28, 0.18, 0.09, 0.16, 0.03],
  ],
  regionRects: [
    { x: 2,   y: 2,   w: 108, h: 148 },
    { x: 112, y: 2,   w: 68,  h: 148 },
    { x: 182, y: 2,   w: 183, h: 148 },
    { x: 2,   y: 152, w: 248, h: 162 },
    { x: 367, y: 2,   w: 131, h: 258 },
    { x: 252, y: 152, w: 113, h: 88  },
    { x: 252, y: 242, w: 113, h: 72  },
    { x: 2,   y: 316, w: 496, h: 62  },
  ],
  regionColors: [
    '#1a3060','#1a2e50','#1a4030','#2a1a50',
    '#1a3a40','#30201a','#1a3020','#1a2030',
  ],
  faultLabels: [
    'Big Core Complex (BCC)',
    'Efficiency Core Array (ECA)',
    'Shader Processing Grid',
    'Matrix Multiply Fabric',
    'Shared L3 SRAM Bank',
    'DRAM PHY Interface',
    'Video Encode Pipeline',
    'AXI Interconnect Mesh',
  ],
};

// ── Snapdragon 8 Elite ───────────────────────────────────────
export const SNAPDRAGON: ChipConfig = {
  id: 'snapdragon',
  name: 'Snapdragon 8 Elite',
  shortName: 'SD 8 Elite',
  node: 'TSMC N3E',
  transistors: '~19B',
  regionNames: [
    'Prime CPU (2× Oryon)',
    'Perf CPU (6× Oryon)',
    'Adreno 830 GPU',
    'Hexagon NPU',
    'System-Level Cache',
    'Spectra ISP / VPU',
    'Fabric / Memory Controller',
    'X80 5G Modem',
  ],
  transistorCounts: [850, 900, 1200, 800, 500, 600, 450, 900],
  likelihood: [
    [0.94, 0.65, 0.03, 0.03, 0.20, 0.04, 0.02, 0.48, 0.02],
    [0.68, 0.40, 0.03, 0.02, 0.16, 0.04, 0.02, 0.22, 0.02],
    [0.04, 0.09, 0.95, 0.05, 0.12, 0.04, 0.07, 0.60, 0.02],
    [0.03, 0.06, 0.04, 0.96, 0.08, 0.03, 0.03, 0.62, 0.02],
    [0.50, 0.44, 0.38, 0.25, 0.92, 0.20, 0.10, 0.10, 0.03],
    [0.04, 0.05, 0.08, 0.04, 0.06, 0.05, 0.90, 0.12, 0.03],
    [0.22, 0.16, 0.14, 0.08, 0.35, 0.88, 0.08, 0.15, 0.05],
    [0.03, 0.03, 0.03, 0.02, 0.04, 0.06, 0.03, 0.08, 0.96],
  ],
  regionRects: [
    { x: 2,   y: 2,   w: 130, h: 148 },
    { x: 134, y: 2,   w: 140, h: 148 },
    { x: 2,   y: 152, w: 272, h: 162 },
    { x: 276, y: 152, w: 98,  h: 162 },
    { x: 276, y: 2,   w: 98,  h: 148 },
    { x: 2,   y: 316, w: 185, h: 62  },
    { x: 188, y: 316, w: 186, h: 62  },
    { x: 376, y: 2,   w: 122, h: 376 }, // full-height right column
  ],
  regionColors: [
    '#1a3060','#1a2e50','#1a4030','#2a1a50',
    '#1a3a40','#1a3020','#1a2030','#20183a',
  ],
  faultLabels: [
    'Prime Core Complex (PCC)',
    'Performance Core Array',
    'Shader Execution Grid',
    'Signal Processing Fabric',
    'Unified L3 Cache Bank',
    'Image Signal Processor',
    'Interconnect / PHY Layer',
    'RF Transceiver Block',
  ],
};

// ── Dimensity 9400 ───────────────────────────────────────────
export const DIMENSITY: ChipConfig = {
  id: 'dimensity',
  name: 'Dimensity 9400',
  shortName: 'D9400',
  node: 'TSMC N3E',
  transistors: '~26B',
  regionNames: [
    'Prime CPU (1× X925)',
    'Mid CPU (3× X4)',
    'Eff CPU (4× A720)',
    'Immortalis G925 GPU',
    'NPU 890',
    'Imagiq ISP',
    'Integrated 5G Modem',
    'Cache / Memory Controller',
  ],
  transistorCounts: [400, 750, 500, 1800, 1200, 700, 1000, 850],
  likelihood: [
    [0.90, 0.55, 0.03, 0.03, 0.18, 0.04, 0.02, 0.38, 0.02],
    [0.72, 0.38, 0.03, 0.02, 0.15, 0.04, 0.02, 0.20, 0.02],
    [0.58, 0.28, 0.03, 0.02, 0.12, 0.04, 0.02, 0.14, 0.02],
    [0.04, 0.08, 0.96, 0.06, 0.13, 0.05, 0.07, 0.62, 0.02],
    [0.03, 0.06, 0.04, 0.96, 0.09, 0.04, 0.03, 0.65, 0.02],
    [0.03, 0.04, 0.07, 0.03, 0.05, 0.04, 0.92, 0.11, 0.03],
    [0.03, 0.03, 0.03, 0.02, 0.05, 0.06, 0.04, 0.08, 0.95],
    [0.48, 0.42, 0.36, 0.26, 0.90, 0.85, 0.10, 0.10, 0.04],
  ],
  regionRects: [
    { x: 196, y: 2,   w: 94,  h: 58  }, // Prime CPU (small, top-right)
    { x: 196, y: 62,  w: 94,  h: 100 }, // Mid CPU
    { x: 196, y: 164, w: 94,  h: 150 }, // Eff CPU
    { x: 2,   y: 2,   w: 192, h: 312 }, // GPU (dominant left)
    { x: 292, y: 2,   w: 206, h: 190 }, // NPU 890
    { x: 2,   y: 316, w: 180, h: 62  }, // ISP
    { x: 184, y: 316, w: 314, h: 62  }, // Modem (wide bottom)
    { x: 292, y: 194, w: 206, h: 120 }, // Cache/MC
  ],
  regionColors: [
    '#1a3060','#1a2e50','#152540',
    '#1a4030','#2a1a50','#1a3020','#20183a','#1a3a40',
  ],
  faultLabels: [
    'Prime Core Unit',
    'Mid Core Cluster',
    'Efficiency Core Array',
    'Shader Processing Grid',
    'AI Processing Fabric',
    'Image Signal Processor',
    'RF / Baseband Layer',
    'Cache / PHY Controller',
  ],
};

export const CHIPS: ChipConfig[] = [M4, SNAPDRAGON, DIMENSITY];
export const CHIP_MAP: Record<string, ChipConfig> = {
  m4: M4,
  snapdragon: SNAPDRAGON,
  dimensity: DIMENSITY,
};
