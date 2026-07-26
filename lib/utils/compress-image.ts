// lib/utils/compress-image.ts
//
// Shrinks a screenshot in the browser before it is uploaded for OCR.
//
// WHY: Groq's vision endpoint rejects requests over 20MB, and base64
// encoding inflates a file by roughly a third on the way there. A modern
// phone screenshot can be several megabytes before that markup. Vision
// models also gain nothing from resolution beyond ~1600px on the long
// edge — the extra pixels cost upload time and buy no accuracy.
//
// Fails open by design: if anything goes wrong (no canvas, odd format,
// decode error) the original file is returned untouched and the upload
// proceeds as before. Compression is an optimisation, never a gate.

/** Long-edge ceiling. Above this, vision accuracy plateaus but bytes keep growing. */
const MAX_EDGE = 1600

/** JPEG quality. 0.82 is visually lossless for text-bearing screenshots. */
const QUALITY = 0.82

/** Files smaller than this are already cheap to send — skip the work. */
const SKIP_BELOW_BYTES = 600 * 1024

export async function compressImage(file: File): Promise<File> {
  try {
    if (file.size <= SKIP_BELOW_BYTES) return file
    if (typeof document === 'undefined') return file

    const bitmap = await createImageBitmap(file)

    const scale  = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width  = Math.round(bitmap.width  * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close(); return file }

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    )
    if (!blob) return file

    // If compression somehow made it larger, keep the original.
    if (blob.size >= file.size) return file

    return new File([blob], 'capture.jpg', {
      type:         'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
