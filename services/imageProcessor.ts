import { AppSettings } from '../types';
import { piexif } from './piexif';

import Worker from './imageProcessor.worker?worker'; // Vite Worker Import Syntax

export const processImage = async (
  file: File,
  settings: AppSettings
): Promise<{ blob: Blob; url: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    // Spawn a new worker for this task
    const worker = new Worker();
    const id = Math.random().toString(36).substring(7);

    worker.onmessage = async (e) => {
      const { id: responseId, success, blob, width, height, error } = e.data;

      if (responseId !== id) return;

      if (success && blob) {
        let finalBlob = blob;

        // --- Advanced Metadata Preservation Logic ---
        // If Output is JPEG (since piexif only supports JPEG) and Input was JPEG
        // We attempt to lift EXIF from original and inject into new Blob.
        const isJpegOutput = settings.convert.format === 'image/jpeg';
        const isJpegInput = file.type === 'image/jpeg' || file.type === 'image/jpg';

        if (isJpegOutput && isJpegInput) {
          try {
            // 1. Read Original EXIF
            const originalBuffer = await file.arrayBuffer();
            // Piexif needs BinaryString (Latin1)
            const originalBinary = Array.from(new Uint8Array(originalBuffer))
              .map(b => String.fromCharCode(b)).join("");

            const exifObj = piexif.load(originalBinary);

            // Check if EXIF actually exists
            if (exifObj && (Object.keys(exifObj['0th']).length > 0 || Object.keys(exifObj['Exif']).length > 0)) {
              // 2. Read Processed Image as Base64/Binary
              const processedBuffer = await blob.arrayBuffer();
              const processedBinary = Array.from(new Uint8Array(processedBuffer))
                .map(b => String.fromCharCode(b)).join("");

              // 3. Insert EXIF
              // We must re-dump the exif object to string
              const exifBytes = piexif.dump(exifObj);
              const newJpegBinary = piexif.insert(exifBytes, processedBinary);

              // 4. Convert back to Blob
              // This is heavy but necessary for bit-level manipulation
              const len = newJpegBinary.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = newJpegBinary.charCodeAt(i);
              }
              finalBlob = new Blob([bytes], { type: 'image/jpeg' });

              // console.log("Metadata successfully injected.");
            }

          } catch (exifErr) {
            console.warn("Metadata preservation skipped (likely not a standard JPEG or empty EXIF):", exifErr);
            // Fallback to the processed blob (no metadata)
          }
        }
        // ---------------------------------------------

        const url = URL.createObjectURL(finalBlob);
        resolve({ blob: finalBlob, url, width, height });
      } else {
        console.error('Worker Error:', error);
        reject(new Error(error || 'Worker processing failed'));
      }

      worker.terminate(); // Cleanup
    };

    worker.onerror = (err) => {
      console.error('Worker Script Error:', err);
      reject(new Error('Worker script failed to load or execute'));
      worker.terminate();
    };

    // Send the job
    worker.postMessage({ id, file, settings });
  });
};