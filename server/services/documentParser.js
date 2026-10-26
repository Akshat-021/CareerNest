const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts plain text from an uploaded document buffer (PDF, DOCX, or TXT).
 * @param {Object} file - Multer file object containing buffer, originalname, and mimetype
 * @returns {Promise<{ text: string, charCount: number, format: string }>}
 */
async function extractDocumentText(file) {
  if (!file || !file.buffer) {
    throw new Error('No file buffer provided for document text extraction');
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();
  let extractedText = '';
  let detectedFormat = 'unknown';

  try {
    if (ext === '.pdf' || mimetype.includes('pdf')) {
      detectedFormat = 'pdf';
      const data = await pdfParse(file.buffer);
      extractedText = data.text || '';
    } else if (ext === '.docx' || mimetype.includes('wordprocessingml') || mimetype.includes('officedocument')) {
      detectedFormat = 'docx';
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value || '';
    } else if (ext === '.txt' || ext === '.md' || mimetype.includes('text')) {
      detectedFormat = 'text';
      extractedText = file.buffer.toString('utf-8');
    } else {
      // Attempt PDF first as most common resume format, fallback to UTF-8
      try {
        const data = await pdfParse(file.buffer);
        if (data && data.text && data.text.trim().length > 0) {
          detectedFormat = 'pdf';
          extractedText = data.text;
        }
      } catch (e) {
        detectedFormat = 'raw-text';
        extractedText = file.buffer.toString('utf-8');
      }
    }
  } catch (parseError) {
    console.error(`Document text extraction error (${detectedFormat}):`, parseError.message);
    throw new Error(`Failed to extract text from ${detectedFormat.toUpperCase()} document: ${parseError.message}`);
  }

  // Clean and normalize whitespace
  const cleanedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return {
    text: cleanedText,
    charCount: cleanedText.length,
    format: detectedFormat
  };
}

module.exports = {
  extractDocumentText
};
