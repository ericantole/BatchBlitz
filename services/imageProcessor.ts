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
        // Exif processing is now handled in the Worker to prevent UI lag.
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