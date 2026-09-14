/**
 * Image optimization utility for company logos & branding assets.
 * Automatically downscales large raster images to optimal resolution (max 512px)
 * to prevent localStorage quota exhaustion while preserving crisp retina clarity & transparency.
 */

export async function optimizeLogoImage(
  fileOrDataUrl: File | string,
  maxDimension: number = 512
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's already a string
    if (typeof fileOrDataUrl === 'string') {
      // Check if it's an SVG
      if (fileOrDataUrl.includes('image/svg+xml') || fileOrDataUrl.startsWith('<svg')) {
        return resolve(fileOrDataUrl);
      }
      processImageSrc(fileOrDataUrl, maxDimension, resolve, reject);
    } else {
      // It's a File
      if (fileOrDataUrl.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        processImageSrc(dataUrl, maxDimension, resolve, reject);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

function processImageSrc(
  src: string,
  maxDimension: number,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      let { width, height } = img;

      // Only scale down if width or height exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if 2d context unavailable
        return resolve(src);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Export as PNG to preserve transparency
      const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
      resolve(optimizedDataUrl);
    } catch {
      // In case of any canvas security or memory issue, fallback safely
      resolve(src);
    }
  };

  img.onerror = () => {
    // If image loading fails, return raw src or reject
    resolve(src);
  };

  img.src = src;
}
