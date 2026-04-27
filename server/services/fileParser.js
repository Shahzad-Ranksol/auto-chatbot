const fs = require('fs');
const path = require('path');

async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8').trim();
  }

  if (ext === '.csv') {
    const { parse } = require('csv-parse/sync');
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    return records.map(row =>
      Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | ')
    ).join('\n');
  }

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  throw new Error(`Unsupported file type: ${ext}. Please use .txt, .csv, or .pdf`);
}

module.exports = { parseFile };
