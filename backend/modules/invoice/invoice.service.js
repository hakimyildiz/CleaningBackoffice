const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const InvoiceModel = require('./invoice.model');
const ServiceRecordModel = require('../serviceRecord/serviceRecord.model');

const InvoiceService = {
  getInvoices: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await InvoiceModel.findList({
      limit,
      offset,
      status: filters.status || null,
      ownerType: filters.owner || null,
      from: filters.from || null,
      to: filters.to || null,
      search: filters.search || null
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  getInvoiceById: async (id) => {
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      const err = new Error(`Invoice with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Load related ServiceRecord
    const record = await ServiceRecordModel.findById(invoice.ServiceRecordID);
    if (record) {
      const cleaners = await ServiceRecordModel.findCleaners(invoice.ServiceRecordID);
      const options = await ServiceRecordModel.findOptions(invoice.ServiceRecordID);
      
      const photosQuery = 'SELECT * FROM ServicePhoto WHERE ServiceRecordID = ? ORDER BY UploadedAt ASC';
      const [photos] = await db.query(photosQuery, [invoice.ServiceRecordID]);

      record.cleaners = cleaners;
      record.options = options;
      record.photos = photos;
      
      invoice.serviceRecord = record;
    }

    return invoice;
  },

  updateInvoice: async (id, { hoursOverride, rateOverride, note }) => {
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      const err = new Error(`Invoice with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (invoice.Status !== 'draft') {
      const err = new Error('Only draft invoices can be modified.');
      err.statusCode = 400;
      throw err;
    }

    const record = await ServiceRecordModel.findById(invoice.ServiceRecordID);
    if (!record) {
      const err = new Error('Associated service record not found.');
      err.statusCode = 400;
      throw err;
    }

    // Recalculate:
    // serviceCharge = (rateOverride ?? existing Rate) * (hoursOverride ?? EstimatedHours)
    const activeRate = rateOverride !== undefined && rateOverride !== null && rateOverride !== ''
      ? parseFloat(rateOverride)
      : parseFloat(record.Rate || 20.00);

    const activeHours = hoursOverride !== undefined && hoursOverride !== null && hoursOverride !== ''
      ? parseFloat(hoursOverride)
      : parseFloat(record.EstimatedHours || 2.0);

    if (activeHours < 0 || activeHours > 24) {
      const err = new Error('Hours override must be a positive number and cannot exceed 24 hours.');
      err.statusCode = 400;
      throw err;
    }

    if (activeRate < 0) {
      const err = new Error('Rate override must be a positive number.');
      err.statusCode = 400;
      throw err;
    }

    const subTotal = activeRate * activeHours;
    const extrasTotal = parseFloat(invoice.ExtrasTotal || 0);
    const total = subTotal + extrasTotal;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await InvoiceModel.updateOverrides(id, {
        SubTotal: subTotal,
        Total: total,
        Note: note,
        HoursOverride: hoursOverride !== undefined && hoursOverride !== '' ? parseFloat(hoursOverride) : null,
        RateOverride: rateOverride !== undefined && rateOverride !== '' ? parseFloat(rateOverride) : null
      }, connection);

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return await InvoiceService.getInvoiceById(id);
  },

  approveInvoice: async (id, user) => {
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      const err = new Error(`Invoice with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (invoice.Status !== 'draft') {
      const err = new Error('Only draft invoices can be approved.');
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const customerId = invoice.CustomerID || null;
      const agencyId = invoice.AgencyID || null;
      let balance = 0;

      // 1. Determine customer or agency credit balance
      if (customerId) {
        const [creditRows] = await connection.query(
          'SELECT COALESCE(SUM(Amount), 0) AS balance FROM CreditLedger WHERE CustomerID = ?',
          [customerId]
        );
        balance = parseFloat(creditRows[0].balance || 0);
      } else if (agencyId) {
        const [creditRows] = await connection.query(
          'SELECT COALESCE(SUM(Amount), 0) AS balance FROM CreditLedger WHERE AgencyID = ?',
          [agencyId]
        );
        balance = parseFloat(creditRows[0].balance || 0);
      }

      let creditApplied = 0;
      let newTotal = parseFloat(invoice.Total);
      let updatedNote = invoice.Note || '';

      // 2. Auto apply credit if balance > 0
      if (balance > 0) {
        creditApplied = Math.min(balance, newTotal);
        newTotal = newTotal - creditApplied;
        updatedNote += (updatedNote ? '\n' : '') + `£${creditApplied.toFixed(2)} credit applied from account balance`;

        // Update Invoice record in DB
        await connection.query(
          'UPDATE Invoice SET CreditApplied = ?, Total = ?, RemainingAmount = ?, Note = ? WHERE InvoiceID = ?',
          [creditApplied, newTotal, newTotal, updatedNote, id]
        );

        // Insert log in CreditLedger
        const creditNote = `Credit applied to invoice ${invoice.InvoiceNumber}`;
        await connection.query(
          'INSERT INTO CreditLedger (CustomerID, AgencyID, Amount, Type, RelatedInvoiceID, Note, CreatedBy) VALUES (?, ?, ?, "applied_to_invoice", ?, ?, ?)',
          [customerId, agencyId, -creditApplied, id, creditNote, user.UserID]
        );
      }

      // 3. Query past invoices (status partially_paid and RemainingAmount > 0)
      let debtQuery = `
        SELECT * FROM Invoice
        WHERE Status = 'partially_paid' AND RemainingAmount > 0
      `;
      const debtParams = [];
      if (customerId) {
        debtQuery += ' AND CustomerID = ?';
        debtParams.push(customerId);
      } else {
        debtQuery += ' AND AgencyID = ?';
        debtParams.push(agencyId);
      }
      debtQuery += ' ORDER BY CreatedAt ASC';

      const [debtRows] = await connection.query(debtQuery, debtParams);
      
      let totalDebt = 0;
      if (debtRows && debtRows.length > 0) {
        for (const row of debtRows) {
          totalDebt += parseFloat(row.RemainingAmount || 0);

          // Update past invoice status to 'forwarded' and update note
          const forwardNote = (row.Note || '') + `\nBalance of £${parseFloat(row.RemainingAmount).toFixed(2)} forwarded to invoice ${invoice.InvoiceNumber}`;
          await connection.query(
            'UPDATE Invoice SET Status = "forwarded", RemainingAmount = 0.00, Note = ? WHERE InvoiceID = ?',
            [forwardNote, row.InvoiceID]
          );
        }

        if (totalDebt > 0) {
          const finalTotal = newTotal + totalDebt;
          await connection.query(
            'UPDATE Invoice SET PreviousBalance = ?, Total = ?, RemainingAmount = ? WHERE InvoiceID = ?',
            [totalDebt, finalTotal, finalTotal, id]
          );
        }
      }

      // 4. Update invoice status to 'sent'
      await connection.query(
        'UPDATE Invoice SET Status = "sent", SentAt = NOW() WHERE InvoiceID = ?',
        [id]
      );

      // 5. Update ServiceRecord status to 'invoice_sent'
      await connection.query(
        'UPDATE ServiceRecord SET Status = "invoice_sent" WHERE ServiceRecordID = ?',
        [invoice.ServiceRecordID]
      );

      // 6. Generate PDF and write to uploads/invoices
      const pdfDir = path.join(__dirname, '..', '..', 'uploads', 'invoices');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      
      const PDFService = require('../pdf/pdf.service');
      const pdfBuffer = await PDFService.generateInvoicePDF(id);
      const pdfFileName = `Invoice-${invoice.InvoiceNumber}.pdf`;
      const pdfRelativePath = path.posix.join('uploads', 'invoices', pdfFileName);
      const pdfAbsolutePath = path.join(pdfDir, pdfFileName);
      fs.writeFileSync(pdfAbsolutePath, pdfBuffer);

      // Update PDFPath in database
      await connection.query(
        'UPDATE Invoice SET PDFPath = ? WHERE InvoiceID = ?',
        [pdfRelativePath, id]
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return await InvoiceService.getInvoiceById(id);
  },

  sendInvoiceEmail: async (id) => {
    const invoice = await InvoiceService.getInvoiceById(id);
    if (!invoice) {
      const err = new Error(`Invoice with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (invoice.Status !== 'sent' && invoice.Status !== 'overdue') {
      const err = new Error('Only approved (sent) or overdue invoices can be emailed.');
      err.statusCode = 400;
      throw err;
    }

    // Resolve recipient
    let recipientEmail = '';
    let clientName = '';
    if (invoice.CustomerID) {
      const [customerRows] = await db.query(
        'SELECT p.Email, p.FirstName, p.SureName FROM Customer c JOIN Person p ON c.PersonID = p.PersonID WHERE c.CustomerID = ?',
        [invoice.CustomerID]
      );
      if (customerRows && customerRows.length > 0) {
        recipientEmail = customerRows[0].Email;
        clientName = `${customerRows[0].FirstName} ${customerRows[0].SureName}`;
      }
    } else if (invoice.AgencyID) {
      const [agencyRows] = await db.query(
        'SELECT Email, Name FROM Agency WHERE AgencyID = ?',
        [invoice.AgencyID]
      );
      if (agencyRows && agencyRows.length > 0) {
        recipientEmail = agencyRows[0].Email;
        clientName = agencyRows[0].Name;
      }
    }

    if (!recipientEmail) {
      const err = new Error('No recipient email address could be resolved for this client.');
      err.statusCode = 400;
      throw err;
    }

    // Generate PDF buffer
    const PDFService = require('../pdf/pdf.service');
    const pdfBuffer = await PDFService.generateInvoicePDF(id);

    // Send email via mailer
    const { sendMail } = require('../../utils/mailer');
    const envConfig = require('../../config/env');
    const appUrl = envConfig.APP_URL;
    
    const dueDateStr = invoice.DueDate 
      ? new Date(invoice.DueDate).toLocaleDateString('en-GB') 
      : 'N/A';

    const mailSubject = `Invoice ${invoice.InvoiceNumber} from BellaClean — £${parseFloat(invoice.Total).toFixed(2)} due ${dueDateStr}`;
    
    const mailHtml = `
      <p>Dear ${clientName},</p>
      <p>Please find attached your invoice <strong>${invoice.InvoiceNumber}</strong> for <strong>£${parseFloat(invoice.Total).toFixed(2)}</strong>.</p>
      <p>Due date: <strong>${dueDateStr}</strong></p>
      <p><a href="${appUrl}/invoices/${invoice.InvoiceID}" style="display:inline-block;background:#1e3a8a;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">View Invoice Online</a></p>
      <p>Thank you for your business.</p>
    `;

    await sendMail({
      to: recipientEmail,
      subject: mailSubject,
      html: mailHtml,
      attachments: [
        {
          filename: `Invoice-${invoice.InvoiceNumber}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    // Update SentAt if not set
    await db.query(
      'UPDATE Invoice SET SentAt = NOW() WHERE InvoiceID = ? AND SentAt IS NULL',
      [id]
    );

    // Insert into NotificationLog
    await db.query(
      'INSERT INTO NotificationLog (UserID, Type, Channel, Subject, SentAt, Status, RelatedID, RelatedType) VALUES (?, "invoice", "email", ?, NOW(), "sent", ?, "Invoice")',
      [invoice.CreatedBy || null, mailSubject, id]
    );

    return { success: true, sentTo: recipientEmail };
  },

  sendOverdueReminders: async (invoiceIds) => {
    let sent = 0;
    let failed = 0;
    const results = [];

    const { sendMail } = require('../../utils/mailer');
    const envConfig = require('../../config/env');
    const appUrl = envConfig.APP_URL;

    for (const id of invoiceIds) {
      try {
        const invoice = await InvoiceService.getInvoiceById(id);
        if (!invoice) {
          throw new Error('Invoice not found.');
        }

        const validReminderStatuses = ['sent', 'partially_paid', 'overdue'];
        if (!validReminderStatuses.includes(invoice.Status)) {
          throw new Error(`Invoice status is "${invoice.Status}". Reminders only sent for sent/partially_paid/overdue.`);
        }

        let recipientEmail = '';
        let clientName = '';
        if (invoice.CustomerID) {
          const [customerRows] = await db.query(
            'SELECT p.Email, p.FirstName, p.SureName FROM Customer c JOIN Person p ON c.PersonID = p.PersonID WHERE c.CustomerID = ?',
            [invoice.CustomerID]
          );
          if (customerRows && customerRows.length > 0) {
            recipientEmail = customerRows[0].Email;
            clientName = `${customerRows[0].FirstName} ${customerRows[0].SureName}`;
          }
        } else if (invoice.AgencyID) {
          const [agencyRows] = await db.query(
            'SELECT Email, Name FROM Agency WHERE AgencyID = ?',
            [invoice.AgencyID]
          );
          if (agencyRows && agencyRows.length > 0) {
            recipientEmail = agencyRows[0].Email;
            clientName = agencyRows[0].Name;
          }
        }

        if (!recipientEmail) {
          throw new Error('Recipient email could not be resolved.');
        }

        const dueDateStr = invoice.DueDate 
          ? new Date(invoice.DueDate).toLocaleDateString('en-GB') 
          : 'N/A';

        const mailSubject = `Payment Reminder — Invoice ${invoice.InvoiceNumber} is overdue`;
        const mailHtml = `
          <p>Dear ${clientName},</p>
          <p>This is a reminder that invoice <strong>${invoice.InvoiceNumber}</strong> for <strong>£${parseFloat(invoice.RemainingAmount).toFixed(2)}</strong> was due on <strong>${dueDateStr}</strong> and remains unpaid.</p>
          <p><a href="${appUrl}/invoices/${invoice.InvoiceID}" style="display:inline-block;background:#b91c1c;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">View Invoice</a></p>
          <p>Please settle the outstanding balance as soon as possible.</p>
          <p>Thank you.</p>
        `;

        await sendMail({
          to: recipientEmail,
          subject: mailSubject,
          html: mailHtml
        });

        // Insert into NotificationLog
        await db.query(
          'INSERT INTO NotificationLog (UserID, Type, Channel, Subject, SentAt, Status, RelatedID, RelatedType) VALUES (?, "overdue_reminder", "email", ?, NOW(), "sent", ?, "Invoice")',
          [invoice.CreatedBy || null, mailSubject, id]
        );

        sent++;
        results.push({ invoiceId: id, success: true });
      } catch (err) {
        failed++;
        logger.error(`Failed to send overdue reminder for Invoice ID ${id}: ${err.message}`);
        results.push({ invoiceId: id, success: false, error: err.message });
      }
    }

    return { sent, failed, results };
  },

  cancelInvoice: async (id) => {
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      const err = new Error(`Invoice with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (invoice.Status !== 'draft') {
      const err = new Error('Only draft invoices can be cancelled.');
      err.statusCode = 400;
      throw err;
    }

    await InvoiceModel.updateStatus(id, 'cancelled');
    return await InvoiceService.getInvoiceById(id);
  }
};

module.exports = InvoiceService;
