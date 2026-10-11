// Tipos aceitos no seletor de arquivo dos documentos do pet. Sem o `accept`
// o iPhone pode mandar HEIC cru, que nem todo navegador consegue exibir.
export const DOCUMENT_ACCEPT = 'image/*,application/pdf,.doc,.docx,.odt,.txt';

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

const COMPRESS_FROM_BYTES = 300 * 1024;
const MAX_SIDE = 2000;
const QUALITY = 0.75;
const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Converte fotos pra WebP antes do upload (foto de celular de 3-8 MB vira
 * ~200-400 KB), o que deixa o envio rápido no 4G. O backend comprime de novo
 * de qualquer forma; aqui é só pra economizar banda. Safari antigo não gera
 * WebP no canvas — aí cai pra JPEG. Em qualquer falha devolve o original.
 */
export async function compressImageForUpload(file) {
  if (!file || file.size < COMPRESS_FROM_BYTES) return file;
  if (!COMPRESSIBLE.includes(file.type)) return file;
  if (typeof createImageBitmap !== 'function') return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // PNG com transparência não fica preto no JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const encode = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
    let blob = await encode('image/webp');
    // Navegador sem encoder WebP devolve PNG em vez de falhar.
    if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
    if (!blob || blob.size >= file.size) return file;

    const ext = blob.type === 'image/webp' ? '.webp' : '.jpg';
    const name = file.name.replace(/\.[^.]+$/, '') + ext;
    return new File([blob], name, { type: blob.type, lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/**
 * Documentos no R2 vêm com `downloadUrl` assinado como anexo: o navegador
 * baixa sem sair da página. Arquivos antigos (/uploads) não têm isso, então
 * abrem em outra aba.
 */
export function downloadDocument(doc, resolveFileUrl) {
  const viewUrl = resolveFileUrl(doc?.fileUrl);
  const downloadUrl = doc?.downloadUrl ? resolveFileUrl(doc.downloadUrl) : viewUrl;
  if (!downloadUrl) return;

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = doc?.title || doc?.fileName || 'documento';
  if (downloadUrl === viewUrl) a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * "Exportar": manda o ARQUIVO pro compartilhamento nativo (Arquivos/iCloud,
 * Drive, WhatsApp...). Isso exige CORS liberado no bucket R2 pra o app poder
 * ler os bytes; sem CORS (ou em arquivo legado) cai pro link, como antes.
 * Retorna 'file' | 'link' | 'download' | false (cancelado/erro).
 */
export async function exportDocumentFile(doc, resolveFileUrl) {
  const url = resolveFileUrl(doc?.fileUrl);
  if (!url) return false;
  const title = doc.title || doc.fileName || 'Documento';

  if (navigator.share && navigator.canShare) {
    let file = null;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const type = blob.type || doc.mimeType || 'application/octet-stream';
        const ext = (type.split('/')[1] || '').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
        const base = String(title).replace(/\.[a-z0-9]{2,5}$/i, '');
        file = new File([blob], ext ? `${base}.${ext}` : base, { type });
      }
    } catch {
      file = null; // sem CORS: segue pro link
    }

    try {
      if (file && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return 'file';
      }
      await navigator.share({ title, text: 'Documento exportado do GATEDO', url });
      return 'link';
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      // Safari às vezes recusa o share depois do download (perde o "toque").
    }
  }

  downloadDocument(doc, resolveFileUrl);
  return 'download';
}
