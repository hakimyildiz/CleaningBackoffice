const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const env = require('../../config/env');
const logger = require('../../utils/logger');

// Formatting helpers
const formatGBP = (val) => '£' + parseFloat(val || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const PDFService = {
  /**
   * Generates a PDF buffer for a given invoice.
   */
  generateInvoicePDF: async (invoiceId) => {
    let browser = null;
    try {
      // 1. Fetch detailed invoice data
      const query = `
        SELECT i.*, 
               sr.ScheduledDate, sr.ScheduledStart, sr.EstimatedHours, sr.ActualHours, 
               sr.AddressLine AS ServiceAddress, sr.City AS ServiceCity, sr.PostCode AS ServicePostCode,
               sr.Rate AS ServiceRecordRate,
               c.CustomerID, c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName, c_p.Email AS CustomerEmail, 
               c_p.AddressLine AS CustomerAddress, c_p.City AS CustomerCity, c_p.PostCode AS CustomerPostCode,
               a.AgencyID, a.Name AS AgencyName, a.Email AS AgencyEmail, 
               a.AddressLine AS AgencyAddress, a.City AS AgencyCity, a.PostCode AS AgencyPostCode
        FROM Invoice i
        JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
        LEFT JOIN Customer c ON i.CustomerID = c.CustomerID
        LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
        LEFT JOIN Agency a ON i.AgencyID = a.AgencyID
        WHERE i.InvoiceID = ?
      `;
      const [invoiceRows] = await db.query(query, [invoiceId]);
      if (!invoiceRows || invoiceRows.length === 0) {
        const err = new Error(`Invoice with ID ${invoiceId} not found.`);
        err.statusCode = 404;
        throw err;
      }
      const invoice = invoiceRows[0];

      // 2. Fetch service record options
      const [options] = await db.query(
        'SELECT * FROM ServiceRecordOption WHERE ServiceRecordID = ?',
        [invoice.ServiceRecordID]
      );

      // 3. Fetch total payments made against this invoice
      const [paymentRows] = await db.query(
        'SELECT COALESCE(SUM(Amount), 0) AS totalPaid FROM Payment WHERE InvoiceID = ?',
        [invoiceId]
      );
      const amountPaid = parseFloat(paymentRows[0].totalPaid || 0);
      const balanceDue = Math.max(0, parseFloat(invoice.Total) - amountPaid);

      // 4. Read company configuration
      const companyConfigPath = path.join(__dirname, '..', '..', 'info', 'company.json');
      let company = {};
      if (fs.existsSync(companyConfigPath)) {
        company = JSON.parse(fs.readFileSync(companyConfigPath, 'utf8'));
      } else {
        logger.warn('Company info JSON file not found at info/company.json');
      }

      // 5. Read logo as base64 URI
      const logoPath = path.join(__dirname, '..', '..', 'info', 'logo.png');
      let logoBase64 = '';
      if (fs.existsSync(logoPath)) {
        logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
      } else {
        logger.warn('Company logo.png not found at info/logo.png');
      }

      // 6. Read invoice template
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'invoice.html');
      let html = fs.readFileSync(templatePath, 'utf8');

      // 7. Format customer/agency client address & billing info
      const isCustomer = !!invoice.CustomerID;
      const clientName = isCustomer 
        ? `${invoice.CustomerFirstName} ${invoice.CustomerSureName}`
        : invoice.AgencyName;
      
      const clientAddress = isCustomer
        ? `${invoice.CustomerAddress || ''}\n${invoice.CustomerCity || ''}\n${invoice.CustomerPostCode || ''}`
        : `${invoice.AgencyAddress || ''}\n${invoice.AgencyCity || ''}\n${invoice.AgencyPostCode || ''}`;
      
      const clientEmail = isCustomer ? invoice.CustomerEmail : invoice.AgencyEmail;

      const serviceAddress = `${invoice.ServiceAddress || ''}, ${invoice.ServiceCity || ''}, ${invoice.ServicePostCode || ''}`;

      // 8. Generate line items rows
      let lineItemsHtml = '';
      // Base service Clean row
      const activeHours = invoice.HoursOverride !== null ? parseFloat(invoice.HoursOverride) : parseFloat(invoice.EstimatedHours);
      const activeRate = invoice.RateOverride !== null ? parseFloat(invoice.RateOverride) : parseFloat(invoice.ServiceRecordRate || 20.00);
      
      lineItemsHtml += `
        <tr>
          <td>Cleaning Service (${activeHours} hours at ${formatGBP(activeRate)}/hr)</td>
          <td class="right-align">${activeHours}h</td>
          <td class="right-align">${formatGBP(activeRate)}</td>
          <td class="right-align">${formatGBP(invoice.SubTotal)}</td>
        </tr>
      `;

      // Extras / Service Options
      for (const opt of options) {
        lineItemsHtml += `
          <tr>
            <td>${opt.Name} (Option)</td>
            <td class="right-align">1</td>
            <td class="right-align">${formatGBP(opt.Fee)}</td>
            <td class="right-align">${formatGBP(opt.Fee)}</td>
          </tr>
        `;
      }

      // Extra balance and credit tables
      const previousBalanceRow = invoice.PreviousBalance > 0
        ? `<tr>
            <td style="color: #64748b;">Previous Balance Carried Forward</td>
            <td class="right-align" style="font-weight: 600;">${formatGBP(invoice.PreviousBalance)}</td>
           </tr>`
        : '';

      const creditAppliedRow = invoice.CreditApplied > 0
        ? `<tr class="accent-row" style="color: #15803d;">
            <td>Credit Applied From Balance</td>
            <td class="right-align">- ${formatGBP(invoice.CreditApplied)}</td>
           </tr>`
        : '';

      const noteSection = invoice.Note
        ? `<div class="invoice-note">
            <strong>Notes / Terms:</strong><br>
            ${invoice.Note}
           </div>`
        : '';

      // 9. Format bank details
      const bank = company.bank || {};

      // 10. Replace template placeholders
      const replacements = {
        '{{LOGO_BASE64}}': logoBase64,
        '{{COMPANY_NAME}}': company.name || 'Mopsy Cleaning Services',
        '{{COMPANY_ADDRESS}}': `${company.addressLine1 || ''}, ${company.addressLine2 || ''}, ${company.postCode || ''}, ${company.country || ''}`,
        '{{COMPANY_PHONE}}': company.phone || '',
        '{{COMPANY_EMAIL}}': company.email || '',
        '{{COMPANY_WEBSITE}}': company.website || '',
        '{{COMPANY_NO}}': company.companyNo || '',
        '{{VAT_NO}}': company.vatNo || '',
        '{{INVOICE_NUMBER}}': invoice.InvoiceNumber,
        '{{INVOICE_DATE}}': formatDate(invoice.CreatedAt),
        '{{INVOICE_DUE_DATE}}': formatDate(invoice.DueDate),
        '{{INVOICE_STATUS}}': invoice.Status.toUpperCase().replace('_', ' '),
        '{{INVOICE_STATUS_CLASS}}': `status-${invoice.Status}`,
        '{{CLIENT_NAME}}': clientName,
        '{{CLIENT_ADDRESS}}': clientAddress,
        '{{CLIENT_EMAIL}}': clientEmail || '',
        '{{SERVICE_ADDRESS}}': serviceAddress,
        '{{SERVICE_DATE}}': formatDate(invoice.ScheduledDate),
        '{{ESTIMATED_HOURS}}': String(invoice.EstimatedHours),
        '{{LINE_ITEMS}}': lineItemsHtml,
        '{{SUBTOTAL}}': formatGBP(invoice.SubTotal),
        '{{EXTRAS_TOTAL}}': formatGBP(invoice.ExtrasTotal),
        '{{PREVIOUS_BALANCE_ROW}}': previousBalanceRow,
        '{{CREDIT_APPLIED_ROW}}': creditAppliedRow,
        '{{TOTAL}}': formatGBP(invoice.Total),
        '{{AMOUNT_PAID}}': formatGBP(amountPaid),
        '{{BALANCE_DUE}}': formatGBP(balanceDue),
        '{{BANK_NAME}}': bank.bankName || '',
        '{{ACCOUNT_NAME}}': bank.accountName || '',
        '{{SORT_CODE}}': bank.sortCode || '',
        '{{ACCOUNT_NO}}': bank.accountNo || '',
        '{{IBAN}}': bank.iban || '',
        '{{PAYMENT_REFERENCE}}': invoice.InvoiceNumber,
        '{{NOTE_SECTION}}': noteSection
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        html = html.split(placeholder).join(value);
      }

      // 11. Launch Puppeteer-core and render PDF
      browser = await puppeteer.launch({
        executablePath: env.CHROMIUM_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          bottom: '15mm',
          left: '15mm',
          right: '15mm'
        }
      });

      return pdfBuffer;
    } catch (error) {
      logger.error(`Failed to generate invoice PDF: ${error.message}`);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
};

module.exports = PDFService;
