export async function resizeImage(file: File, maxEdge: number): Promise<Blob> {
  const source = await decodeImage(file);
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (source instanceof ImageBitmap) source.close();
    throw new Error('Canvas unsupported');
  }
  ctx.drawImage(source, 0, 0, width, height);
  if (source instanceof ImageBitmap) source.close();
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encode failed'))),
      'image/jpeg',
      0.85,
    );
  });
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to the HTMLImageElement path.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
