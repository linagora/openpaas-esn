module.exports = dependencies => {
  const platformAdminsMW = dependencies('platformAdminsMW');
  const authorizationMW = dependencies('authorizationMW');
  const domainMW = dependencies('domainMW');

  return {
    checkQueryFormat,
    checkAuthorization
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
};
