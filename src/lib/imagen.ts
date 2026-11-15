const OBJETIVO = 200 * 1024; // 200 KB por foto

function aJpeg(bitmap: ImageBitmap, lado: number, calidad: number): Promise<Blob> {
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la foto'))), 'image/jpeg', calidad),
  );
}

/**
 * Reduce la foto en el teléfono antes de subirla, para ahorrar espacio y datos:
 * máximo 1280 px de lado largo y calidad ~70 %. Si aun así pesa más de 200 KB,
 * baja la calidad y luego el tamaño hasta lograrlo.
 */
export async function comprimirImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  try {
    let mejor: Blob | null = null;
    for (const [lado, calidad] of [[1280, 0.7], [1280, 0.55], [1024, 0.55], [1024, 0.42], [800, 0.42]] as const) {
      mejor = await aJpeg(bitmap, lado, calidad);
      if (mejor.size <= OBJETIVO) break;
    }
    return mejor!;
  } finally {
    bitmap.close?.();
  }
}

export function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
