import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';
import { Readable } from 'stream';

/**
 * @swagger
 * /api/v1/export:
 *   post:
 *     summary: Export diagnostic results to JSON or PDF
 *     tags: [Export]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, pdf]
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Exported results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
const exportResults = async (req, res, next) => {
  const { format, data } = req.body;

  if (!format || !['json', 'pdf'].includes(format)) {
    return res.status(400).json({ error: 'Invalid format, must be "json" or "pdf"' });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    if (format === 'json') {
      logger.info(`Exporting results to JSON from IP: ${req.ip}`);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="results.json"');
      res.json(data);
    } else if (format === 'pdf') {
      logger.info(`Exporting results to PDF from IP: ${req.ip}`);
      const doc = new PDFDocument();
      const stream = new Readable();
      stream._read = () => {};
      doc.pipe(stream);

      doc.fontSize(16).text('Network Diagnostics Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Timestamp: ${new Date().toISOString()}`);
      doc.moveDown();

      const addSection = (title, obj) => {
        doc.fontSize(14).text(title, { underline: true });
        doc.moveDown();
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object') {
            doc.fontSize(12).text(`${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              doc.text(`  ${subKey}: ${JSON.stringify(subValue)}`);
            });
          } else {
            doc.fontSize(12).text(`${key}: ${value}`);
          }
        });
        doc.moveDown();
      };

      Object.entries(data).forEach(([section, content]) => {
        addSection(section, content);
      });

      doc.end();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="results.pdf"');
      stream.pipe(res);
    }
  } catch (error) {
    logger.error(`Error in exportResults:`, error);
    next(error);
  }
};

export default { exportResults };
