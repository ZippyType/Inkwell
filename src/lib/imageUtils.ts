
export async function compressImage(dataUrl: string, maxSizeMB: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
      const maxDimension = 2048; 
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      // Calculate size in MB
      const getKB = (str: string) => (str.length * 0.75) / 1024;
      const getMB = (str: string) => getKB(str) / 1024;

      while (getMB(result) > maxSizeMB && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(result);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
  });
}
