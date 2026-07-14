/** Bounding-box helper for refined cutouts. */

export interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Recomputes the alpha bounding box of a (possibly refined) transparent PNG by
 * scanning the alpha channel for pixels above a small threshold. Returns null
 * when the image is fully transparent or fails to load.
 */
export async function alphaBbox(dataUrl: string): Promise<Bbox | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let minX = width, minY = height, maxX = -1, maxY = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      resolve(
        maxX < 0
          ? null
          : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
      );
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
