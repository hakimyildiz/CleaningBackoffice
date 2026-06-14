const db = require('../../config/db');
const PaymentModel = require('./payment.model');
const InvoiceModel = require('../invoice/invoice.model');

const PaymentService = {
  getPayments: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await PaymentModel.findList({
      limit,
      offset,
      method: filters.method || null,
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

  getInvoicePayments: async (invoiceId) => {
    const payments = await PaymentModel.findByInvoiceId(invoiceId);
    return { data: payments };
  },

  recordPayment: async (invoiceId, { amount, method, reference, paidAt, note }, user) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const err = new Error('Payment amount must be greater than zero.');
      err.statusCode = 400;
      throw err;
    }

    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      const err = new Error(`Invoice with ID ${invoiceId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const invalidStatuses = ['paid', 'cancelled', 'forwarded'];
    if (invalidStatuses.includes(invoice.Status)) {
      const err = new Error(`Cannot record payment against an invoice with status "${invoice.Status}".`);
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Record the payment
      const paymentId = await PaymentModel.create({
        InvoiceID: invoiceId,
        Amount: parsedAmount,
        PaidAt: paidAt || new Date(),
        Method: method,
        Reference: reference,
        Note: note,
        RecordedBy: user.UserID
      }, connection);

      // 2. Recalculate invoice payment total
      const totalPaid = await PaymentModel.sumByInvoiceId(invoiceId, connection);
      const invoiceTotal = parseFloat(invoice.Total);
      const remaining = invoiceTotal - totalPaid;

      let newStatus = 'partially_paid';
      let remainingAmountToSave = remaining;
      let creditCreated = false;
      let creditAmount = 0;

      if (remaining <= 0) {
        newStatus = 'paid';
        remainingAmountToSave = 0.00;
        const overpayment = Math.abs(remaining);
        
        if (overpayment > 0) {
          creditCreated = true;
          creditAmount = overpayment;

          // Insert into CreditLedger
          const customerId = invoice.CustomerID || null;
          const agencyId = invoice.AgencyID || null;

          const creditQuery = `
            INSERT INTO CreditLedger (CustomerID, AgencyID, Amount, Type, RelatedPaymentID, RelatedInvoiceID, Note, CreatedBy)
            VALUES (?, ?, ?, 'overpayment', ?, ?, ?, ?)
          `;
          const creditNote = `Auto-generated: overpayment on invoice ${invoice.InvoiceNumber}`;
          await connection.query(creditQuery, [
            customerId,
            agencyId,
            overpayment,
            paymentId,
            invoiceId,
            creditNote,
            user.UserID
          ]);
        }
      } else {
        // If remaining is greater than 0, check if the invoice was overdue and preserve/set appropriate status
        const isOverdue = invoice.DueDate && new Date(invoice.DueDate) < new Date();
        newStatus = isOverdue ? 'overdue' : 'partially_paid';
      }

      // 3. Update Invoice Status and RemainingAmount
      const updateInvoiceQuery = `
        UPDATE Invoice 
        SET Status = ?, RemainingAmount = ? 
        WHERE InvoiceID = ?
      `;
      await connection.query(updateInvoiceQuery, [newStatus, remainingAmountToSave, invoiceId]);

      await connection.commit();

      const updatedInvoice = await InvoiceModel.findById(invoiceId);
      const paymentRecord = await PaymentModel.findById(paymentId);

      return {
        invoice: updatedInvoice,
        payment: paymentRecord,
        creditCreated,
        creditAmount
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  deletePayment: async (paymentId) => {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      const err = new Error(`Payment record with ID ${paymentId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Delete associated CreditLedger entries if any were auto-generated (overpayment)
      await connection.query('DELETE FROM CreditLedger WHERE RelatedPaymentID = ?', [paymentId]);

      // 2. Delete the payment itself
      await PaymentModel.delete(paymentId, connection);

      // 3. Fetch invoice information to update its status
      const [invoiceRows] = await connection.query('SELECT Total, DueDate FROM Invoice WHERE InvoiceID = ?', [payment.InvoiceID]);
      const invoice = invoiceRows[0];

      // 4. Recalculate remaining balance
      const totalPaid = await PaymentModel.sumByInvoiceId(payment.InvoiceID, connection);
      const invoiceTotal = parseFloat(invoice.Total);
      const remaining = invoiceTotal - totalPaid;

      let newStatus = 'partially_paid';
      if (remaining >= invoiceTotal) {
        const isOverdue = invoice.DueDate && new Date(invoice.DueDate) < new Date();
        newStatus = isOverdue ? 'overdue' : 'sent';
      } else {
        const isOverdue = invoice.DueDate && new Date(invoice.DueDate) < new Date();
        newStatus = isOverdue ? 'overdue' : 'partially_paid';
      }

      // 5. Update invoice state
      await connection.query(
        'UPDATE Invoice SET Status = ?, RemainingAmount = ? WHERE InvoiceID = ?',
        [newStatus, remaining, payment.InvoiceID]
      );

      await connection.commit();
      return { success: true, message: 'Payment deleted and invoice balances successfully adjusted.' };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = PaymentService;
