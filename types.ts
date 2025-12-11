export enum ImageStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  processedUrl?: string;
  status: ImageStatus;
  originalDimensions?: { width: number; height: number };
  processedDimensions?: { width: number; height: number };
  sizeChange?: number; // Percentage difference
}

export enum OutputFormat {
  JPG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp'
}

export interface ResizeSettings {
  enabled: boolean;
  type: 'width' | 'percentage';
  value: number; // width in px or percentage (1-100)
  maintainAspectRatio: boolean;
}

export interface WatermarkSettings {
  enabled: boolean;
  mode: 'text' | 'image';
  // Text Mode Props
  text: string;
  fontSize: number;
  // Image Mode Props
  imageData?: string; // Data URL of the uploaded image
  scale: number; // 0.1 to 1.0 (relative to image width)
  // Shared Props
  color: string;
  opacity: number; // 0-1
  position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export interface ConvertSettings {
  format: OutputFormat;
  quality: number; // 0-1
}

export interface AppSettings {
  resize: ResizeSettings;
  watermark: WatermarkSettings;
  convert: ConvertSettings;
}