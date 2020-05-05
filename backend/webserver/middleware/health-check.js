const platformadminMW = require('./platformadmins');

module.exports = {
  checkAPIAuthorization
};

function checkAPIAuthorization(req, res, next) {
  if (req.query.cause) {
    if (req.isAuthenticated()) {
      req.isAuthorized = true;
      return platformadminMW.requirePlatformAdmin(req, res, next);
    }
    res.status(401).json({
      error: {
        code: 401,
        message: 'Authentication error',
        details: 'To perform this action, you have to login first!'
      }
    });
  }
  req.isAuthorized = false;
  return next();
}
