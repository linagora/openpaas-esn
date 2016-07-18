'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var userModule = dependencies('user');
  var domainModule = dependencies('domain');
  var logger = dependencies('logger');

  function getDomain() {
    return q.denodeify(domainModule.list)({})
      .then(function(domains) {
        if (!domains || domains.length === 0) {
          return q.reject(new Error('Can not find any domain'));
        }
        return domains[0];
      });
  }

  function provision(user) {
    return getDomain().then(function(domain) {
      user.domains = [{domain_id: domain._id}];
      return q.denodeify(userModule.provisionUser)(user);
    });
  }

  return {
    provision: provision
  };
};
