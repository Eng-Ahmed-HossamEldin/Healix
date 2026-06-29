const { errorResponse } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err && err.code === "ER_DUP_ENTRY") {
    return errorResponse(res, "Duplicate entry", 409);
  }

  if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
    return errorResponse(res, "Referenced record does not exist", 400);
  }

  if (err && err.code === "ER_ROW_IS_REFERENCED_2") {
    return errorResponse(res, "Cannot delete or update because record is referenced elsewhere", 400);
  }

  return errorResponse(res, err.message || "Internal server error", err.statusCode || 500);
};

module.exports = errorHandler;