/** Guarda el archivo en las descargas del teléfono. */
export function descargar(archivo: File): void {
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = archivo.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Abre el menú "Compartir" de Android con el archivo adjunto (ahí se elige WhatsApp).
 * Si el teléfono no lo permite, descarga el archivo y abre WhatsApp con el resumen en texto.
 * Devuelve false si el usuario canceló.
 */
export async function compartir(archivo: File, texto: string, titulo = 'Llavecita'): Promise<boolean> {
  const datos: ShareData = { files: [archivo], title: titulo, text: texto };
  if (navigator.canShare?.(datos)) {
    try {
      await navigator.share(datos);
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return false;
    }
  }
  descargar(archivo);
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  return true;
}
