const sendSuccess = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

const success = (res, message, data = null, extra = null) => {
  const payload = {
    success: true,
    message,
    data
  };

  if (extra) {
    if (extra.page !== undefined || extra.limit !== undefined || extra.totalPages !== undefined) {
      payload.pagination = {
        page: extra.page,
        limit: extra.limit,
        totalPages: extra.totalPages,
        total: extra.total
      };

      for (const [key, val] of Object.entries(extra)) {
        if (!['page', 'limit', 'totalPages', 'total'].includes(key)) {
          payload[key] = val;
        }
      }
    } else {
      if (extra.pagination) {
        payload.pagination = extra.pagination;
        for (const [key, val] of Object.entries(extra)) {
          if (key !== 'pagination') {
            payload[key] = val;
          }
        }
      } else {
        Object.assign(payload, extra);
      }
    }
  }

  return res.status(200).json(payload);
};

const badRequest = (res, message = 'Bad Request') => {
  return res.status(400).json({
    success: false,
    message
  });
};

const notFound = (res, message = 'Not Found') => {
  return res.status(404).json({
    success: false,
    message
  });
};

const error = (res, message = 'Internal Server Error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError,
  success,
  badRequest,
  notFound,
  error
};
