/**
 * Utility per la compressione client-side e conversione delle immagini in AVIF (con fallback WebP).
 * Non richiede librerie esterne, usa HTMLCanvasElement nativo del browser.
 */

export interface CompressionResult {
  blob: Blob;
  format: 'image/avif' | 'image/webp';
  filename: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Ridimensiona e comprime un file immagine in formato AVIF (o WebP se AVIF non è supportato dall'encoder canvas).
 */
export async function compressAndConvertToAvif(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calcola dimensioni mantenendo l'aspect ratio
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Impossibile ottenere il contesto 2D del Canvas'));
        }

        // Migliore qualità di interpolazione
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prova prima la conversione in AVIF
        canvas.toBlob(
          (avifBlob) => {
            if (avifBlob && avifBlob.type === 'image/avif') {
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              resolve({
                blob: avifBlob,
                format: 'image/avif',
                filename: `${baseName}-${Date.now()}.avif`,
                originalSize: file.size,
                compressedSize: avifBlob.size,
                compressionRatio: Math.round((1 - avifBlob.size / file.size) * 100),
              });
            } else {
              // Fallback su WebP se il browser non supporta l'encoding AVIF nel canvas
              canvas.toBlob(
                (webpBlob) => {
                  if (!webpBlob) {
                    return reject(new Error('Compressione dell\'immagine fallita'));
                  }
                  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                  resolve({
                    blob: webpBlob,
                    format: 'image/webp',
                    filename: `${baseName}-${Date.now()}.webp`,
                    originalSize: file.size,
                    compressedSize: webpBlob.size,
                    compressionRatio: Math.round((1 - webpBlob.size / file.size) * 100),
                  });
                },
                'image/webp',
                quality
              );
            }
          },
          'image/avif',
          quality
        );
      };

      img.onerror = () => reject(new Error('Errore durante il caricamento dell\'immagine per l\'elaborazione'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Errore nella lettura del file'));
    reader.readAsDataURL(file);
  });
}
