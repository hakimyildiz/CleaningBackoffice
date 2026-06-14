import express from 'express';
import { query, queryOne, insert, update, remove, generateUUID } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM Invoice WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND Status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND InvoiceNumber LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY CreatedAt DESC';

    const invoices = await query(sql, params);
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await queryOne('SELECT * FROM Invoice WHERE InvoiceID = ?', [req.params.id]);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'manager', 'agency_manager'), async (req, res) => {
  try {
    const data = req.body;
    const invoiceId = generateUUID();

    // Generate invoice number
    const count = await queryOne('SELECT COUNT(*) as count FROM Invoice');
    const invoiceNumber = `INV${String(count.count + 1).padStart(8, '0')}`;

    await insert(
      `INSERT INTO Invoice (
        InvoiceID, ServiceRecordID, InvoiceNumber, CustomerID, AgencyID, AgencyStaffID,
        PDFPath, Total, Status, SentDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Sent', NOW())`,
      [
        invoiceId, data.serviceRecordId, invoiceNumber, data.customerId, data.agencyId, data.agencyStaffId,
        data.pdfPath, data.total
      ]
    );

    // Update service record status
    if (data.serviceRecordId) {
      await update("UPDATE ServiceRecord SET Status = 'Invoice Sent' WHERE ServiceRecordID = ?", [data.serviceRecordId]);
    }

    const invoice = await queryOne('SELECT * FROM Invoice WHERE InvoiceID = ?', [invoiceId]);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.patch('/:id/pay', authMiddleware, roleMiddleware('admin', 'manager', 'agency_manager', 'agency_bookkeeper'), async (req, res) => {
  try {
    await update(
      "UPDATE Invoice SET Status = 'Paid', PaidDate = NOW() WHERE InvoiceID = ?",
      [req.params.id]
    );

    const invoice = await queryOne('SELECT * FROM Invoice WHERE InvoiceID = ?', [req.params.id]);

    // Update service record status
    if (invoice.ServiceRecordID) {
      await update("UPDATE ServiceRecord SET Status = 'Paid' WHERE ServiceRecordID = ?", [invoice.ServiceRecordID]);
    }

    res.json(invoice);
  } catch (error) {
    console.error('Pay invoice error:', error);
    res.status(500).json({ error: 'Failed to pay invoice' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await remove('DELETE FROM Invoice WHERE InvoiceID = ?', [req.params.id]);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;
