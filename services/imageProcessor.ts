import { AppSettings, OutputFormat } from '../types';

export const processImage = async (
  file: File,
  settings: AppSettings
): Promise<{ blob: Blob; url: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    // Ensure we are working with a readable image source
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    // Cleanup on exit
    const cleanup = () => {
       URL.revokeObjectURL(objectUrl);
    };

    img.onload = async () => {
      try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
    
          if (!ctx) {
            cleanup();
            reject(new Error('Could not get canvas context'));
            return;
          }
    
          // --- 1. Resize Logic ---
          let targetWidth = img.width;
          let targetHeight = img.height;
    
          if (settings.resize.enabled) {
            if (settings.resize.type === 'width') {
              targetWidth = settings.resize.value;
              if (settings.resize.maintainAspectRatio) {
                targetHeight = (img.height / img.width) * targetWidth;
              } else {
                 // Even if aspect ratio is off, if we only have width control, 
                 // we usually maintain aspect unless we had a separate height input.
                 // For safety in this specific UI, we default to Aspect Ratio behavior 
                 // to prevent distortion until a Height slider is added.
                targetHeight = (img.height / img.width) * targetWidth; 
              }
            } else {
              // Percentage
              const scale = settings.resize.value / 100;
              targetWidth = img.width * scale;
              targetHeight = img.height * scale;
            }
          }
    
          // Ensure Integer Dimensions to prevent rendering glitches
          canvas.width = Math.round(targetWidth);
          canvas.height = Math.round(targetHeight);
    
          // Draw resized image
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
          // --- 2. Watermark Logic ---
          if (settings.watermark.enabled) {
            const { mode, text, color, opacity, fontSize, position, imageData, scale } = settings.watermark;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            
            let contentWidth = 0;
            let contentHeight = 0;
            
            if (mode === 'image' && imageData) {
                 try {
                    const logo = new Image();
                    logo.src = imageData;
                    await new Promise((r, rej) => { 
                        logo.onload = r; 
                        logo.onerror = rej; 
                    });
                    
                    // Calculate logo dimensions relative to target image width
                    const targetLogoWidth = canvas.width * scale;
                    const aspectRatio = logo.height / logo.width;
                    contentWidth = targetLogoWidth;
                    contentHeight = targetLogoWidth * aspectRatio;
    
                    const { x, y } = calculatePosition(position, canvas.width, canvas.height, contentWidth, contentHeight, 20);
                    
                    ctx.drawImage(logo, x, y, contentWidth, contentHeight);
    
                 } catch (e) {
                     console.warn("Failed to load watermark image", e);
                 }
            } else if (mode === 'text' && text) {
                 ctx.fillStyle = color;
                 
                 // Dynamic font size relative to image
                 const scaleFactor = canvas.width / 1920; 
                 // Ensure min font size isn't too small
                 const actualFontSize = Math.max(16, fontSize * scaleFactor * 2); 
                 
                 ctx.font = `bold ${Math.round(actualFontSize)}px Inter, sans-serif`;
                 ctx.textBaseline = 'middle';
                 
                 const metrics = ctx.measureText(text);
                 contentWidth = metrics.width;
                 contentHeight = actualFontSize; 
                 const padding = actualFontSize;
    
                 const { x, y } = calculatePosition(position, canvas.width, canvas.height, contentWidth, contentHeight, padding);
                 
                 ctx.shadowColor = "rgba(0,0,0,0.5)";
                 ctx.shadowBlur = 4;
                 ctx.fillText(text, x, y + (contentHeight/2));
            }
            
            ctx.restore();
          }
    
          // --- 3. Output/Convert Logic ---
          const mimeType = settings.convert.format;
          const quality = settings.convert.quality;
    
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) {
                const newUrl = URL.createObjectURL(blob);
                resolve({ blob, url: newUrl, width: canvas.width, height: canvas.height });
              } else {
                reject(new Error('Canvas conversion failed'));
              }
            },
            mimeType,
            quality
          );

      } catch (err) {
          cleanup();
          reject(err);
      }
    };

    img.onerror = (err) => {
      cleanup();
      reject(new Error('Failed to load original image for processing. File might be corrupt or unsupported format.'));
    };

    img.src = objectUrl;
  });
};

function calculatePosition(
    position: string, 
    targetW: number, 
    targetH: number, 
    contentW: number, 
    contentH: number, 
    padding: number
) {
    let x = 0;
    let y = 0;

    switch (position) {
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'top-center':
        x = (targetW - contentW) / 2;
        y = padding;
        break;
      case 'top-right':
        x = targetW - contentW - padding;
        y = padding;
        break;
      case 'middle-left':
        x = padding;
        y = (targetH - contentH) / 2;
        break;
      case 'center':
        x = (targetW - contentW) / 2;
        y = (targetH - contentH) / 2;
        break;
      case 'middle-right':
        x = targetW - contentW - padding;
        y = (targetH - contentH) / 2;
        break;
      case 'bottom-left':
        x = padding;
        y = targetH - contentH - padding;
        break;
      case 'bottom-center':
        x = (targetW - contentW) / 2;
        y = targetH - contentH - padding;
        break;
      case 'bottom-right':
        x = targetW - contentW - padding;
        y = targetH - contentH - padding;
        break;
      default: // center
        x = (targetW - contentW) / 2;
        y = (targetH - contentH) / 2;
    }
    return { x, y };
}