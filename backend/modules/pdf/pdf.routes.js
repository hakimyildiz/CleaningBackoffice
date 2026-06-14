const express = require('express');
const router = express.Router();
const PDFService = require('./pdf.service');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const logger = require('../../utils/logger');
const db = require('../../config/db');

/**
 * GET /api/v1/invoices/:id/pdf
 * Generates and streams the PDF for the requested invoice.
 */
router.get('/:id/pdf', verifyToken, requireRole('admin', 'manager', 'agency_bookkeeper'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT InvoiceNumber FROM Invoice WHERE InvoiceID = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    const invoiceNumber = rows[0].InvoiceNumber;

    const pdfBuffer = await PDFService.generateInvoicePDF(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Error in GET /invoices/:id/pdf: ${error.message}`);
    next(error);
  }
});

module.exports = router;
