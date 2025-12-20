import { AppSettings } from '../types';
import Worker from './imageProcessor.worker?worker'; // Vite Worker Import Syntax

export const processImage = async (
  file: File,
  settings: AppSettings
): Promise<{ blob: Blob; url: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    // Spawn a new worker for this task
    // (For production with 1000s of files, a worker pool is better, 
    // but for <100 files, spawning per file is cleaner/safer state-wise)
    const worker = new Worker();

    const id = Math.random().toString(36).substring(7);

    worker.onmessage = (e) => {
      const { id: responseId, success, blob, width, height, error } = e.data;

      if (responseId !== id) return;

      if (success && blob) {
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, width, height });
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