import QRCode from 'qrcode';

/**
 * Generates a data URL PNG for a given text string (e.g. login URL or student code)
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  if (!text) return '';
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code for:', text, err);
    return '';
  }
}

/**
 * Bulk generate QR codes for a list of students
 */
export async function generateBulkStudentQrCodes(
  students: Array<{ id: string; studentCode?: string }>,
  baseUrl: string = 'https://madrasety.ai.studio'
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  
  await Promise.all(
    students.map(async (student) => {
      const code = student.studentCode || `STD-2026-${student.id}`;
      const loginUrl = `${baseUrl.replace(/\/+$/, '')}/login?code=${encodeURIComponent(code)}`;
      const qrDataUrl = await generateQrCodeDataUrl(loginUrl);
      result[student.id] = qrDataUrl;
    })
  );

  return result;
}
