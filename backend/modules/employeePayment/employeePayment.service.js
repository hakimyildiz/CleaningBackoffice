const EmployeePaymentModel = require('./employeePayment.model');

const EmployeePaymentService = {
  getPayments: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await EmployeePaymentModel.findList({
      limit,
      offset,
      employeeId: filters.employeeId || null,
      from: filters.from || null,
      to: filters.to || null,
      type: filters.type || null
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

  getEarningsReport: async ({ employeeId, from, to }) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      const err = new Error('Valid from and to date values are required.');
      err.statusCode = 400;
      throw err;
    }

    if (toDate < fromDate) {
      const err = new Error('End date must be after start date.');
      err.statusCode = 400;
      throw err;
    }

    // Check max range 366 days
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      const err = new Error('The query date range cannot exceed 366 days.');
      err.statusCode = 400;
      throw err;
    }

    // Fetch employee checkout details
    const employees = await EmployeePaymentModel.findEmployeeEarnings({ employeeId, from, to });

    const report = [];
    for (const row of employees) {
      const rate = parseFloat(row.EmployeeRate || 0);
      const totalHours = parseFloat(row.totalActualHours || 0);
      const expectedPayment = parseFloat((totalHours * rate).toFixed(2));
      
      // Fetch already paid amounts for this employee within period
      const alreadyPaid = await EmployeePaymentModel.findAlreadyPaid(row.EmployeeID, from, to);
      const balance = parseFloat((expectedPayment - alreadyPaid).toFixed(2));

      report.push({
        employeeId: row.EmployeeID,
        fullName: `${row.EmployeeFirstName} ${row.EmployeeSureName}`,
        role: row.EmployeeRole,
        rate,
        totalJobs: row.totalJobs,
        totalActualHours: totalHours,
        expectedPayment,
        alreadyPaid,
        balance
      });
    }

    return report;
  },

  recordPayment: async (paymentData, user) => {
    const { employeeId, amount, type, paidAt, periodFrom, periodTo, reference, note } = paymentData;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const err = new Error('Amount must be a positive decimal.');
      err.statusCode = 400;
      throw err;
    }

    const validTypes = ['regular', 'bonus', 'expense', 'travel', 'other'];
    if (!type || !validTypes.includes(type)) {
      const err = new Error(`Type must be one of: ${validTypes.join(', ')}.`);
      err.statusCode = 400;
      throw err;
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date();
    if (isNaN(paymentDate.getTime())) {
      const err = new Error('Invalid payment date (paidAt).');
      err.statusCode = 400;
      throw err;
    }

    if (periodFrom && periodTo) {
      const pFrom = new Date(periodFrom);
      const pTo = new Date(periodTo);
      if (isNaN(pFrom.getTime()) || isNaN(pTo.getTime())) {
        const err = new Error('Period date range contains invalid values.');
        err.statusCode = 400;
        throw err;
      }
      if (pTo < pFrom) {
        const err = new Error('Period end date (periodTo) must be after period start date (periodFrom).');
        err.statusCode = 400;
        throw err;
      }
    }

    const insertId = await EmployeePaymentModel.create({
      EmployeeID: employeeId,
      Amount: parsedAmount,
      Type: type,
      PeriodFrom: periodFrom,
      PeriodTo: periodTo,
      PaidAt: paymentDate,
      Reference: reference,
      Note: note,
      RecordedBy: user.UserID
    });

    return await EmployeePaymentModel.findById(insertId);
  },

  deletePayment: async (id) => {
    const payment = await EmployeePaymentModel.findById(id);
    if (!payment) {
      const err = new Error(`Employee payment with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    await EmployeePaymentModel.delete(id);
    return { success: true, message: 'Employee payment record deleted successfully.' };
  }
};

module.exports = EmployeePaymentService;
