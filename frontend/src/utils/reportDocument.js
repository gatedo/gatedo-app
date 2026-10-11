import { brandAssets } from '../brand/assets';
import { calculateAgeParts, formatCatAge } from './catAge';

// Laudo IA (iGentVet) é guardado como dados no documento (metadata.report).
// Daqui sai tudo que é derivado dele: linha do paciente, QR, PDF e o link da
// Pasta do Vet. O HTML fica em components/report/LaudoView.jsx.

export const PLATFORM = {
  name: 'Gatedo',
  tagline: 'Saúde e cuidado felino',
  site: 'gatedo.com',
  siteUrl: 'https://gatedo.com',
  email: 'contato@gatedo.com',
  instagram: '@gatedoapp',
};

export const REPORT_DISCLAIMER =
  'Laudo orientativo gerado por IA (iGentVet). Não substitui consulta veterinária presencial, exame físico ou exames complementares.';

export function vetShareUrl(token) {
  return token ? `${window.location.origin}/v/${token}` : '';
}

// O QR do laudo aponta pra Pasta do Vet só quando o laudo está nela e há link
// ativo; senão aponta pro site (nunca pra uma tela que pede login).
export function reportQrTarget(doc, vetLink) {
  if (doc?.isVetShared && vetLink?.token) {
    return { url: vetShareUrl(vetLink.token), caption: 'Escaneie para abrir a Pasta do Vet' };
  }
  return { url: PLATFORM.siteUrl, caption: PLATFORM.site };
}

export function getReport(doc) {
  const report = doc?.report || doc?.metadata?.report;
  return report && typeof report === 'object' ? report : null;
}

export function formatPetLine(pet = {}) {
  const parts = [
    pet.breed || 'SRD',
    pet.gender === 'FEMALE' ? 'Fêmea' : pet.gender === 'MALE' ? 'Macho' : null,
    calculateAgeParts(pet) ? formatCatAge(pet, { compact: false }) : null,
    pet.weight ? `${String(pet.weight).replace('.', ',')} kg` : null,
    pet.neutered ? 'Castrado(a)' : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

export function reportFileName(report) {
  const slug = (v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `laudo-igentvet-${slug(report?.pet?.name) || 'gato'}-${slug(report?.reportId) || 'ia'}.pdf`;
}

export async function makeQrDataUrl(text, size = 240) {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2D2657', light: '#FFFFFF' } });
}

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// jsPDF não lê WebP; redesenha em canvas e devolve PNG/JPEG + proporção.
async function imageForPdf(src, { type = 'image/png', crossOrigin = false, maxSide = 900 } = {}) {
  const img = await loadImage(src, crossOrigin);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL(type, 0.82), ratio: canvas.height / canvas.width };
}

// Fontes padrão do PDF só têm Latin-1: troca pontuação tipográfica e tira emoji.
function pdfText(value) {
  return String(value ?? '')
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/•/g, '·')
    .replace(/[−‒]/g, '-') // sinal de menos tipográfico (variação de peso)
    .replace(/[^\t\n\r\x20-\xFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Base de todo PDF do Gatedo (laudo IA, prontuário, relatório de saúde):
 * faixa roxa + logo + dados da plataforma no cabeçalho, QR + aviso +
 * paginação no rodapé de cada página. Devolve helpers pra montar o corpo.
 */
export async function createBrandedPdf({ qrUrl = PLATFORM.siteUrl, qrCaption = PLATFORM.site, footerNote = '', footerId = '' } = {}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  const FOOTER_H = 92;
  const contentBottom = H - FOOTER_H - 12;

  const [logo, igentLogo, qr] = await Promise.all([
    imageForPdf(brandAssets.gatedoFull).catch(() => null),
    imageForPdf(brandAssets.igentvetWordmark).catch(() => null),
    qrUrl ? makeQrDataUrl(qrUrl).catch(() => null) : null,
  ]);

  let y = 0;

  const header = () => {
    doc.setFillColor(139, 74, 255);
    doc.rect(0, 0, W, 6, 'F');
    // Logo sempre na proporção real (altura máx. 30pt).
    if (logo) {
      const h = Math.min(30, 110 * logo.ratio);
      doc.addImage(logo.dataUrl, 'PNG', M, 22, h / logo.ratio, h);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor('#6B7280');
    [`${PLATFORM.name} - ${PLATFORM.tagline}`, `${PLATFORM.site}  ·  ${PLATFORM.email}  ·  ${PLATFORM.instagram}`].forEach((t, i) => {
      doc.text(pdfText(t), W - M, 32 + i * 11, { align: 'right' });
    });
    doc.setDrawColor(229, 231, 235);
    doc.line(M, 66, W - M, 66);
    y = 90;
  };

  const footer = (page, total) => {
    const top = H - FOOTER_H;
    doc.setDrawColor(229, 231, 235);
    doc.line(M, top, W - M, top);
    if (qr) doc.addImage(qr, 'PNG', M, top + 10, 64, 64);
    const tx = M + (qr ? 76 : 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#8B4AFF');
    doc.text(pdfText(qrCaption), tx, top + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#9CA3AF');
    doc.setFontSize(7);
    if (footerNote) doc.text(doc.splitTextToSize(pdfText(footerNote), W - tx - M - 50), tx, top + 38);
    doc.text(pdfText(`${footerId ? `${footerId}  ·  ` : ''}Gerado pelo ${PLATFORM.name} · ${PLATFORM.site}`), tx, top + 66);
    doc.text(`${page}/${total}`, W - M, top + 66, { align: 'right' });
  };

  const ensure = (h) => {
    if (y + h > contentBottom) {
      doc.addPage();
      header();
    }
  };

  const text = (value, { size = 10, color = '#374151', bold = false, gap = 5, indent = 12 } = {}) => {
    const style = () => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(color);
    };
    style();
    doc.splitTextToSize(pdfText(value) || '-', W - M * 2 - indent - 12).forEach((line) => {
      ensure(size + gap);
      style(); // o cabeçalho de uma página nova troca a fonte
      doc.text(line, M + indent, y);
      y += size + gap;
    });
  };

  const section = (title) => {
    ensure(48);
    y += 12;
    doc.setFillColor(244, 243, 255);
    doc.roundedRect(M, y - 13, W - M * 2, 22, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor('#6D28D9');
    doc.text(pdfText(title).toUpperCase(), M + 12, y + 2);
    y += 24;
  };

  // Linhas "Rótulo: valor" com o valor alinhado numa coluna.
  const rows = (pairs, { labelWidth = 120 } = {}) => {
    pairs.filter(Boolean).forEach(([label, value]) => {
      const lines = doc.splitTextToSize(pdfText(value) || '-', W - M * 2 - labelWidth - 24);
      ensure(lines.length * 14 + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#6B7280');
      doc.text(pdfText(label), M + 12, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor('#1F2937');
      lines.forEach((line, i) => doc.text(line, M + 12 + labelWidth, y + i * 14));
      y += lines.length * 14 + 3;
    });
  };

  const title = ({ text: t, subtitle, badge, withIgent = false }) => {
    const x = M + (withIgent && igentLogo ? 82 : 0);
    if (withIgent && igentLogo) doc.addImage(igentLogo.dataUrl, 'PNG', M, y - 14, 70, 70 * igentLogo.ratio);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#2D2657');
    doc.text(pdfText(t), x, y + 2);
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#6B7280');
      doc.text(pdfText(subtitle), x, y + 16);
    }
    if (badge?.label) {
      const palette = { red: ['#FEE2E2', '#B91C1C'], green: ['#DCFCE7', '#15803D'], amber: ['#FEF3C7', '#B45309'], purple: ['#EDE9FE', '#6D28D9'] }[badge.tone || 'purple'];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const label = pdfText(badge.label).toUpperCase();
      const bw = doc.getTextWidth(label) + 20;
      doc.setFillColor(palette[0]);
      doc.roundedRect(W - M - bw, y - 10, bw, 18, 9, 9, 'F');
      doc.setTextColor(palette[1]);
      doc.text(label, W - M - bw / 2, y + 2, { align: 'center' });
    }
    y += 34;
  };

  const image = async (src, { caption, maxH = 260, crossOrigin = true } = {}) => {
    const img = await imageForPdf(src, { type: 'image/jpeg', crossOrigin }).catch(() => null);
    if (!img) return false;
    const h = Math.min(maxH, 220 * img.ratio);
    ensure(h + 30);
    doc.addImage(img.dataUrl, 'JPEG', M + 12, y, h / img.ratio, h);
    y += h + 8;
    if (caption) text(caption, { size: 8.5, color: '#6B7280' });
    return true;
  };

  const space = (h = 8) => { y += h; };

  const finish = () => {
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      footer(p, total);
    }
    return doc.output('blob');
  };

  header();
  return { doc, title, section, text, rows, image, space, finish };
}

export async function buildReportPdfBlob(report, { qrUrl = PLATFORM.siteUrl, qrCaption = PLATFORM.site } = {}) {
  const c = report?.consultation || {};
  const pet = report?.pet || {};
  const pdf = await createBrandedPdf({ qrUrl, qrCaption, footerNote: REPORT_DISCLAIMER, footerId: report?.reportId });

  pdf.title({
    text: 'Laudo da IA',
    subtitle: `${report?.reportId || ''}  ·  ${c.date || ''}${c.time ? ` às ${c.time}` : ''}`,
    badge: c.isUrgent ? { label: 'Urgente', tone: 'red' } : { label: 'Monitoramento', tone: 'green' },
    withIgent: true,
  });

  pdf.section('Paciente');
  pdf.text(pet.name, { size: 12, color: '#111827', bold: true });
  pdf.text(formatPetLine(pet));
  if (report?.owner?.name) pdf.text(`Tutor(a): ${report.owner.name}`, { size: 9, color: '#6B7280' });

  pdf.section('Consulta');
  pdf.text(`Sintoma: ${c.symptom || '-'}`, { color: '#111827', bold: true });

  pdf.section('Análise da IA');
  pdf.text(c.analysisText);

  if (c.care?.length) {
    pdf.section('Recomendações');
    c.care.forEach((item) => pdf.text(`- ${item}`));
  }

  if (c.ownerResponse) {
    pdf.section('Resposta do tutor');
    pdf.text(c.ownerResponse);
  }

  const attachments = (report?.attachments || []).filter((a) => a?.url);
  if (attachments.length) {
    pdf.section('Imagens enviadas pelo tutor');
    for (const att of attachments) {
      const caption = [att.label, att.note].filter(Boolean).join(' - ');
      const ok = await pdf.image(att.url, { caption });
      if (!ok) pdf.text(`${att.label || 'Imagem'}: disponível na versão online do laudo.`, { size: 9, color: '#9CA3AF' });
    }
  }

  return pdf.finish();
}

/** Compartilha o PDF (celular) ou baixa (desktop). */
export async function deliverPdf(blob, fileName, { preferShare = true, title = '' } = {}) {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  if (preferShare && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}

export async function exportReportPdf(report, qr, { preferShare = true } = {}) {
  const blob = await buildReportPdfBlob(report, qr);
  return deliverPdf(blob, reportFileName(report), { preferShare, title: `Laudo iGentVet — ${report?.pet?.name || ''}` });
}
