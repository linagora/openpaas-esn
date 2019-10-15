module.exports = dependencies => {
  const platformAdminsMW = dependencies('platformAdminsMW');
  const authorizationMW = dependencies('authorizationMW');
  const domainMW = dependencies('domainMW');
  const { isFeatureEnabled } = require('../../../../lib/domain-members/utils')(dependencies);

  return {
    checkQueryFormat,
    checkAuthorization,
    requireFeatureEnabledForDomain
  };

  function checkQueryFormat(req, res, next) {
    if (req.query.hasOwnProperty('domain_id')) {
      return domainMW.loadFromDomainIdParameter(req, res, next);
    }

    next();
  }

  function checkAuthorization(req, res, next) {
    if (req.query.domain_id) {
      return authorizationMW.requiresDomainManager(req, res, next);
    }

    return platformAdminsMW.requirePlatformAdmin(req, res, next);
  }

  function requireFeatureEnabledForDomain(req, res, next) {
    if (req.query.domain_id) {
      return isFeatureEnabled(req.query.domain_id)
        .then(isEnabled => {
          if (isEnabled) return next();

          res.status(403).json({
            error: {
              code: 403,
              message: 'Forbidden',
              details: 'The domain members address book feature is currently disabled.'
            }
          });
        });
    }

    next();
  }
};
