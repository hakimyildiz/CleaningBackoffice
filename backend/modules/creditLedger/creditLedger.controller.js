const CreditLedgerService = require('./creditLedger.service');
const response = require('../../utils/response');

const CreditLedgerController = {
  getCredits: async (req, res, next) => {
    try {
      const filters = {
        limit: req.query.limit,
        page: req.query.page
      };
      const result = await CreditLedgerService.getCredits(filters);
      return response.success(res, 'Credit ledger list retrieved successfully.', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  getCustomerBalance: async (req, res, next) => {
    try {
      const { customerId } = req.params;
      const result = await CreditLedgerService.getCustomerBalance(customerId);
      return response.success(res, 'Customer credit balance retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  },

  getAgencyBalance: async (req, res, next) => {
    try {
      const { agencyId } = req.params;
      const result = await CreditLedgerService.getAgencyBalance(agencyId);
      return response.success(res, 'Agency credit balance retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  },

  adjustCredit: async (req, res, next) => {
    try {
      const { customerId, agencyId, amount, note } = req.body;
      const result = await CreditLedgerService.adjustCredit({
        customerId,
        agencyId,
        amount,
        note
      }, req.user);
      return response.success(res, 'Credit adjusted successfully.', result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = CreditLedgerController;
