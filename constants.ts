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
  convert: {
    format: OutputFormat.JPG,
    quality: 0.9,
  },
  rename: {
    enabled: false,
    pattern: '{original}_{n}',
    startSequence: 1
  }
};

export const MAX_FREE_FILES = 20;