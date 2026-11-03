import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';
import JSZip from 'jszip';

function wrap(value, width = 72) {
  return String(value).split('\n').flatMap(line => {
    const result = [];
    while (line.length > width) {
      let at = line.lastIndexOf(' ', width);
      if (at < width / 3) at = width;
      result.push(line.slice(0, at));
      line = line.slice(at).trimStart();
    }
    return [...result, line];
  });
}
export async function createPdf(value, meta) {
  const response = await fetch(new URL('../fonts/DejaVuSans.base64', import.meta.url));
  if (!response.ok) throw new Error('Не удалось загрузить шрифт PDF');
  const font = Uint8Array.from(atob(await response.text()), c => c.charCodeAt(0)).buffer;
  const lines = wrap(value), pages = [];
  for (let i = 0; i < lines.length; i += 39) pages.push(lines.slice(i, i + 39).join('\n'));
  const inputs = {}, schemas = pages.map((page, i) => {
    inputs['body' + i] = page;
    inputs['brand' + i] = 'ЗЕРКАЛО PRO · ' + meta.city;
    inputs['footer' + i] = meta.site + ' · ' + new Date().toLocaleDateString('ru-RU') + ' · ' + (i + 1) + '/' + pages.length;
    return [
      { name: 'brand' + i, type: 'text', position: { x: 16, y: 16 }, width: 178, height: 12, fontSize: 15, fontName: 'DejaVuSans', fontColor: '#173D34' },
      { name: 'body' + i, type: 'text', position: { x: 16, y: 36 }, width: 178, height: 228, fontSize: 10, lineHeight: 1.3, fontName: 'DejaVuSans' },
      { name: 'footer' + i, type: 'text', position: { x: 16, y: 278 }, width: 178, height: 8, fontSize: 8, fontName: 'DejaVuSans', fontColor: '#666666' }
    ];
  });
  const bytes = await generate({ template: { basePdf: { width: 210, height: 297, padding: [0, 0, 0, 0] }, schemas }, inputs: [inputs], plugins: { text }, options: { font: { DejaVuSans: { data: font, fallback: true } } } });
  return new Blob([bytes], { type: 'application/pdf' });
}
export async function createArchive(value, files) {
  const zip = new JSZip();
  zip.file('Zayavka.txt', '\uFEFF' + value);
  files.forEach((file, i) => zip.file('photo-' + (i + 1) + '.' + ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type] || 'bin'), file));
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}
