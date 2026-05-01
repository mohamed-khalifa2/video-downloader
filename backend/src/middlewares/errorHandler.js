export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};