import { jsPDF } from 'jspdf';

/*
 * jsPDF's built-in fonts only support WinAnsi encoding and cannot render
 * Vietnamese diacritics correctly. To avoid embedding a Unicode font file,
 * the certificate is drawn on an offscreen <canvas> — the browser's own
 * text renderer handles Vietnamese correctly — then the canvas is embedded
 * into the PDF as a single full-page image.
 */
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1131; // matches A4 landscape aspect ratio (297:210)

const slugify = (str) =>
  (str || 'hoc-vien')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();

const drawCertificate = ({ studentName, examLabel, scorePct, dateLabel, attemptId }) => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, CANVAS_WIDTH - 80, CANVAS_HEIGHT - 80);
  ctx.strokeStyle = '#a5b4fc';
  ctx.lineWidth = 3;
  ctx.strokeRect(65, 65, CANVAS_WIDTH - 130, CANVAS_HEIGHT - 130);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#4338ca';
  ctx.font = '700 40px Arial, "Segoe UI", sans-serif';
  ctx.fillText('IC3 EXAM PLATFORM', CANVAS_WIDTH / 2, 180);

  ctx.fillStyle = '#111827';
  ctx.font = '800 68px Arial, "Segoe UI", sans-serif';
  ctx.fillText('CHỨNG CHỈ HOÀN THÀNH', CANVAS_WIDTH / 2, 280);

  ctx.fillStyle = '#6b7280';
  ctx.font = '400 28px Arial, "Segoe UI", sans-serif';
  ctx.fillText('Chứng nhận học viên đã hoàn thành bài thi với kết quả', CANVAS_WIDTH / 2, 340);

  ctx.fillStyle = '#4338ca';
  ctx.font = '700 58px Arial, "Segoe UI", sans-serif';
  ctx.fillText(studentName || 'Học viên', CANVAS_WIDTH / 2, 460);

  ctx.fillStyle = '#111827';
  ctx.font = '500 34px Arial, "Segoe UI", sans-serif';
  ctx.fillText(examLabel || '', CANVAS_WIDTH / 2, 530);

  ctx.fillStyle = '#059669';
  ctx.font = '800 88px Arial, "Segoe UI", sans-serif';
  ctx.fillText(`${Math.round(scorePct)}%`, CANVAS_WIDTH / 2, 660);

  ctx.fillStyle = '#059669';
  ctx.font = '700 26px Arial, "Segoe UI", sans-serif';
  ctx.fillText('ĐẠT', CANVAS_WIDTH / 2, 700);

  ctx.fillStyle = '#374151';
  ctx.font = '400 26px Arial, "Segoe UI", sans-serif';
  ctx.fillText(`Ngày cấp: ${dateLabel}`, CANVAS_WIDTH / 2, 950);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '400 18px Arial, "Segoe UI", sans-serif';
  ctx.fillText(`Mã xác thực: ${attemptId}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);

  return canvas;
};

export const generateCertificatePdf = ({ studentName, examLabel, scorePct, submittedAtISO, attemptId }) => {
  const dateLabel = submittedAtISO
    ? new Date(submittedAtISO).toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : '--';

  const canvas = drawCertificate({ studentName, examLabel, scorePct, dateLabel, attemptId });
  const imgData = canvas.toDataURL('image/png', 1.0);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

  doc.save(`chung-chi-${slugify(studentName)}-${(attemptId || '').slice(0, 8)}.pdf`);
};
