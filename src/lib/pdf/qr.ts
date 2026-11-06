import QRCode from 'qrcode';

/**
 * Generates a PNG Uint8Array of a QR code for embedding in pdf-lib
 */
export async function generateQrPngBytes(text: string): Promise<Uint8Array> {
  const dataUrl = await QRCode.toDataURL(text || 'https://madrasety.ai.studio/', {
    margin: 1,
    width: 200,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const base64Data = dataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
