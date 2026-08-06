function errorHandler(
  err,
  req,
  res,
  next
) {
  console.error(
    '[Backend Error]',
    err
  );

  if (err.zohoResponse) {
    return res
      .status(
        err.statusCode || 400
      )
      .json({
        detail:
          err.message ||
          'Zoho Creator rejected the Work Order.',

        zoho:
          err.zohoResponse,
      });
  }

  if (
    err.response &&
    err.response.data
  ) {
    return res
      .status(
        err.response.status ||
        502
      )
      .json({
        detail:
          'Zoho Creator request failed.',

        zoho:
          err.response.data,
      });
  }

  return res
    .status(
      err.statusCode || 500
    )
    .json({
      detail:
        err.message ||
        'Something went wrong.',
    });
}

module.exports =
  errorHandler;