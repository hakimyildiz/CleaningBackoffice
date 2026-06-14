const CreditLedgerModel = require('./creditLedger.model');

const CreditLedgerService = {
  getCredits: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await CreditLedgerModel.findList({ limit, offset });

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

  getCustomerBalance: async (customerId) => {
    const balance = await CreditLedgerModel.findCustomerBalance(customerId);
    return { balance };
  },

  getAgencyBalance: async (agencyId) => {
    const balance = await CreditLedgerModel.findAgencyBalance(agencyId);
    return { balance };
  },

  adjustCredit: async ({ customerId, agencyId, amount, note }, user) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      const err = new Error('Adjustment amount is required and must not be zero.');
      err.statusCode = 400;
      throw err;
    }

    if (!customerId && !agencyId) {
      const err = new Error('Either customerId or agencyId must be specified.');
      err.statusCode = 400;
      throw err;
    }

    if (customerId && agencyId) {
      const err = new Error('Cannot specify both customerId and agencyId.');
      err.statusCode = 400;
      throw err;
    }

    const ledgerId = await CreditLedgerModel.create({
      CustomerID: customerId || null,
      AgencyID: agencyId || null,
      Amount: parsedAmount,
      Type: 'manual_adjustment',
      Note: note || 'Manual adjustment',
      CreatedBy: user.UserID
    });

    // Fetch new balance
    let newBalance = 0;
    if (customerId) {
      newBalance = await CreditLedgerModel.findCustomerBalance(customerId);
    } else {
      newBalance = await CreditLedgerModel.findAgencyBalance(agencyId);
    }

    return {
      ledgerId,
      newBalance
    };
  }
};

module.exports = CreditLedgerService;
