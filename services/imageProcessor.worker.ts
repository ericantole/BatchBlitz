/// <reference lib="webworker" />
import { AppSettings } from '../types';

/* 
  Web Worker for BatchBlitz
  Handles heavy image manipulation using OffscreenCanvas.
*/

self.onmessage = async (e: MessageEvent) => {
    const { file, settings, id } = e.data;

    try {
        const result = await processImageInWorker(file, settings);
        // Send back the result
        self.postMessage({ id, success: true, blob: result.blob, width: result.width, height: result.height });
    } catch (error) {
        self.postMessage({ id, success: false, error: (error as Error).message });
    }
};

async function processImageInWorker(
    file: File | Blob,
    settings: AppSettings
): Promise<{ blob: Blob, width: number, height: number }> {

    // 1. Create Bitmap from File (Native Worker API)
    const imgBitmap = await createImageBitmap(file);

    // 2. Calculate Dimensions
    let targetWidth = imgBitmap.width;
    let targetHeight = imgBitmap.height;

    if (settings.resize.enabled) {
        if (settings.resize.type === 'width') {
            targetWidth = settings.resize.value;
            // Maintain Aspect Ratio defaults to true logic here for safety
            targetHeight = (imgBitmap.height / imgBitmap.width) * targetWidth;
        } else {
            // Percentage
            const scale = settings.resize.value / 100;
            targetWidth = imgBitmap.width * scale;
            targetHeight = imgBitmap.height * scale;
        }
    }

    // 3. Create OffscreenCanvas
    const canvas = new OffscreenCanvas(Math.round(targetWidth), Math.round(targetHeight));
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get OffscreenCanvas context');
    }

    // 4. Draw & Resize
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

    // 5. Watermark Application
    if (settings.watermark.enabled) {
        const { mode, text, color, opacity, fontSize, position, imageData, scale } = settings.watermark;

        ctx.save();
        ctx.globalAlpha = opacity;

        let contentWidth = 0;
        let contentHeight = 0;

        if (mode === 'image' && imageData) {
            // Load base64/url image into bitmap
            try {
                const response = await fetch(imageData);
                const logoBlob = await response.blob();
                const logoBitmap = await createImageBitmap(logoBlob);

                // Calculate logo dimensions relative to target image width
                const targetLogoWidth = canvas.width * scale;
                const aspectRatio = logoBitmap.height / logoBitmap.width;
                contentWidth = targetLogoWidth;
                contentHeight = targetLogoWidth * aspectRatio;

                const { x, y } = calculatePosition(position, canvas.width, canvas.height, contentWidth, contentHeight, 20);

                ctx.drawImage(logoBitmap, x, y, contentWidth, contentHeight);
                logoBitmap.close(); // Cleanup

            } catch (e) {
                console.warn("Failed to apply logo watermark in worker", e);
            }
        } else if (mode === 'text' && text) {
            ctx.fillStyle = color;

            // Dynamic font size relative to image
            const scaleFactor = canvas.width / 1920;
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
            ctx.fillText(text, x, y + (contentHeight / 2));
        }

        ctx.restore();
    }

    // 6. Signature Application
    if (settings.signature.enabled && settings.signature.imageData) {
        try {
            // Load signature image
            const response = await fetch(settings.signature.imageData);
            const sigBlob = await response.blob();
            const sigBitmap = await createImageBitmap(sigBlob);

            // Calculate dimensions relative to canvas width
            // scale is 1-100 percentage of width
            const sigScale = settings.signature.scale / 100;
            const sigWidth = canvas.width * sigScale;
            const aspectRatio = sigBitmap.height / sigBitmap.width;
            const sigHeight = sigWidth * aspectRatio;

            // Calculate position
            // position x/y are percentages 0-100
            // We want the point (x%, y%) to be the CENTER of the signature
            const posX = (canvas.width * (settings.signature.position.x / 100)) - (sigWidth / 2);
            const posY = (canvas.height * (settings.signature.position.y / 100)) - (sigHeight / 2);

            ctx.drawImage(sigBitmap, posX, posY, sigWidth, sigHeight);
            sigBitmap.close();

        } catch (e) {
            console.warn("Failed to apply signature in worker", e);
        }
    }

    // 6. Convert to Blob
    const mimeType = settings.convert.format;
    const quality = settings.convert.quality;

    const resultBlob = await canvas.convertToBlob({
        type: mimeType,
        quality: quality
    });

    // Cleanup
    imgBitmap.close();

    return { blob: resultBlob, width: canvas.width, height: canvas.height };

}

// Shared Helper (Duplicated to avoid complex imports in Worker environment)
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
        case 'top-left': x = padding; y = padding; break;
        case 'top-center': x = (targetW - contentW) / 2; y = padding; break;
        case 'top-right': x = targetW - contentW - padding; y = padding; break;
        case 'middle-left': x = padding; y = (targetH - contentH) / 2; break;
        case 'center': x = (targetW - contentW) / 2; y = (targetH - contentH) / 2; break;
        case 'middle-right': x = targetW - contentW - padding; y = (targetH - contentH) / 2; break;
        case 'bottom-left': x = padding; y = targetH - contentH - padding; break;
        case 'bottom-center': x = (targetW - contentW) / 2; y = targetH - contentH - padding; break;
        case 'bottom-right': x = targetW - contentW - padding; y = targetH - contentH - padding; break;
        default: x = (targetW - contentW) / 2; y = (targetH - contentH) / 2;
    }
    return { x, y };
}
