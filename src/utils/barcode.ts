/**
 * Barcode Generator (Code 39 standard)
 * Generates crisp SVG barcodes for library books and student/teacher membership cards.
 */

const CODE39_PATTERNS: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100',
};

export function generateCode39Svg(
  rawText: string,
  width: number = 220,
  height: number = 60,
  showText: boolean = true
): string {
  // Sanitize text to uppercase alphanumeric and valid Code39 chars
  const sanitized = rawText.toUpperCase().replace(/[^0-9A-Z\-.$/+% ]/g, '-');
  const fullString = `*${sanitized}*`;

  const narrowBar = 1.5;
  const wideBar = 3.5;
  const interCharGap = 2;

  let barsData: { isBar: boolean; width: number }[] = [];

  for (let i = 0; i < fullString.length; i++) {
    const char = fullString[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

    // Pattern consists of 9 elements: 5 bars and 4 spaces
    // index 0,2,4,6,8 are bars; 1,3,5,7 are spaces
    for (let p = 0; p < pattern.length; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === '1';
      barsData.push({
        isBar,
        width: isWide ? wideBar : narrowBar,
      });
    }

    // Add inter-character gap (white space)
    if (i < fullString.length - 1) {
      barsData.push({ isBar: false, width: interCharGap });
    }
  }

  const totalBarcodeWidth = barsData.reduce((acc, curr) => acc + curr.width, 0);
  const scale = (width - 20) / totalBarcodeWidth;
  const startX = 10;
  const barHeight = showText ? height - 18 : height - 6;

  let currentX = startX;
  const rects: string[] = [];

  for (const item of barsData) {
    const itemWidth = item.width * scale;
    if (item.isBar) {
      rects.push(
        `<rect x="${currentX.toFixed(2)}" y="4" width="${itemWidth.toFixed(
          2
        )}" height="${barHeight}" fill="#000000" />`
      );
    }
    currentX += itemWidth;
  }

  const textElement = showText
    ? `<text x="${(width / 2).toFixed(2)}" y="${(height - 2).toFixed(
        2
      )}" text-anchor="middle" font-family="monospace, monospace" font-size="11" font-weight="600" fill="#0f172a">${rawText}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #ffffff; display: block; margin: 0 auto;">
    ${rects.join('\n')}
    ${textElement}
  </svg>`;
}

export function generateInventoryCode(sequenceNumber: number, year: number = 2026): string {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `INV-SMPN2PML/${year}/${padded}`;
}

export function generateBookBarcode(sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(5, '0');
  return `PML2-BK${padded}`;
}

export function generateMemberCode(type: 'Siswa' | 'Guru' | 'Tenaga Kependidikan', sequenceNumber: number): string {
  const prefix = type === 'Siswa' ? 'SIS' : type === 'Guru' ? 'GUR' : 'STF';
  const padded = String(sequenceNumber).padStart(4, '0');
  return `AGT-${prefix}-${padded}`;
}
