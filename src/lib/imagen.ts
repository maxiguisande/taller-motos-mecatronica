/** Comprime una imagen a JPEG (máx ~1600px) antes de subirla. Solo cliente. */
export function comprimir(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > max || height > max) {
        const s = max / Math.max(width, height);
        width = Math.round(width * s);
        height = Math.round(height * s);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("no blob"))),
        "image/jpeg",
        quality,
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
