// backend/middleware/speedtestMiddleware.js
export const disableCompressionForSpeedTest = (req, res, next) => {
  if (req.path.includes('/speedtest/')) {
    req.headers['accept-encoding'] = 'identity';
    res.locals.skipCompression = true;
  }
  next();
};
