import heic2any from 'heic2any';

export const normalizeImageFile = async (file: File): Promise<File> => {
  // Check for HEIC/HEIF
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      console.log(`Converting HEIC: ${file.name}`);
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });

      // Handle array or single blob
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // Create a new File object
      const newFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      return newFile;
    } catch (error) {
      console.error('HEIC conversion failed', error);
      // Return original if conversion fails, though it might not render
      return file;
    }
  }
  
  return file;
};