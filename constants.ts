import { AppSettings, OutputFormat } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  resize: {
    enabled: false,
    type: 'percentage',
    value: 100,
    maintainAspectRatio: true,
  },
  watermark: {
    enabled: false,
    mode: 'text',
    text: '© BatchBlitz',
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 48,
    position: 'center',
    scale: 0.3, // 30% of width by default
  },
  signature: {
    enabled: false,
    mode: 'single',
    inputMode: 'draw',
    imageData: null,
    position: { x: 50, y: 50 }, // Center
    scale: 20, // 20%
  },
  convert: {
    format: OutputFormat.JPG,
    quality: 0.95, // Standard high quality (prevents 100% bloat)
  },
  rename: {
    enabled: false,
    pattern: '{original}_{n}',
    startSequence: 1
  }
};

export const MAX_FREE_FILES = 20;