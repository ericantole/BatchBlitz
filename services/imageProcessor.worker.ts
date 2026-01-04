/// <reference lib="webworker" />
import { AppSettings } from '../types';
import { piexif } from './piexif';

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

    // 1. Smart Bypass: If no changes are needed, return original file
    // Condition: Format matches + No Resize + No Watermark + No Signature + Quality is 100%
    // If quality < 1, user Intends to compress, so we must process.

    // Loose format check (handle jpeg/jpg discrepancy)
    const targetFormat = settings.convert.format;
    const fileType = file.type;
    const isFormatMatch = fileType === targetFormat ||
        (fileType === 'image/jpeg' && targetFormat === 'image/jpeg') ||
        (fileType === 'image/jpg' && targetFormat === 'image/jpeg'); // normalize

    const isResizeDisabled = !settings.resize.enabled;
    const isWatermarkDisabled = !settings.watermark.enabled;
    const isSignatureDisabled = !settings.signature.enabled;
    // Treat >=90% as sufficiently high to prefer original if format matches
    // Also treat PNG as max quality (lossless) regardless of slider value
    const isMaxQuality = settings.convert.quality >= 0.9 || settings.convert.format === 'image/png';

    if (isFormatMatch && isResizeDisabled && isWatermarkDisabled && isSignatureDisabled && isMaxQuality) {
        // Return original values immediately
        const bitmap = await createImageBitmap(file);
        const originalWidth = bitmap.width;
        const originalHeight = bitmap.height;
        bitmap.close();

        return { blob: file instanceof Blob ? file : new Blob([file]), width: originalWidth, height: originalHeight };
    }

    // 2. Create Bitmap from File (Native Worker API)
    const imgBitmap = await createImageBitmap(file);

    // 3. Calculate Dimensions
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

    // 4. Create OffscreenCanvas
    const canvas = new OffscreenCanvas(Math.round(targetWidth), Math.round(targetHeight));
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get OffscreenCanvas context');
    }

    // 5. Draw & Resize
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

    // 6. Watermark Application
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

    // 7. Signature Application
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

    // 8. Convert to Blob
    const mimeType = settings.convert.format;
    const quality = settings.convert.quality;

    let resultBlob = await canvas.convertToBlob({
        type: mimeType,
        quality: quality
    });

    // 9. Exif Injection (Worker Thread)
    const isJpegOutput = mimeType === 'image/jpeg';
    // Check original file type (File object passed to worker)
    const isJpegInput = (file.type === 'image/jpeg' || file.type === 'image/jpg') ||
        /\.(jpe?g)$/i.test((file as File).name || '');

    if (isJpegOutput && isJpegInput) {
        try {
            // Read Original Exif
            const originalBuffer = await file.arrayBuffer();
            const originalBinary = Array.from(new Uint8Array(originalBuffer))
                .map(b => String.fromCharCode(b)).join("");
            const exifObj = piexif.load(originalBinary);

            // If we have valid Exif data
            if (exifObj && (Object.keys(exifObj['0th']).length > 0 || Object.keys(exifObj['Exif']).length > 0)) {
                // Read processed image
                const processedBuffer = await resultBlob.arrayBuffer();
                const processedBinary = Array.from(new Uint8Array(processedBuffer))
                    .map(b => String.fromCharCode(b)).join("");

                // Insert Exif (dump -> insert)
                const exifBytes = piexif.dump(exifObj);
                const newJpegBinary = piexif.insert(exifBytes, processedBinary);

                // Convert back to Blob
                const len = newJpegBinary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = newJpegBinary.charCodeAt(i);
                }
                resultBlob = new Blob([bytes], { type: 'image/jpeg' });
            }
        } catch (e) {
            console.warn("Worker: Exif injection failed", e);
        }
    }

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
