'use strict';

var q = require('q');
var mongoose = require('mongoose');
require('../../../backend/core/db/mongo/models/technical-user');
var TechnicalUser = mongoose.model('TechnicalUser');

module.exports = function(domains) {

  function createSabreUser() {
    var promises = domains.map(function(domain) {
      var user = {
        name: 'Sabre Dav',
        description: 'Allows to authenticate on Sabre DAV',
        type: 'dav',
        domain: domain._id || domain,
        data: {
          principal: 'principals/technicalUser'
        }
      };
      var technicalUser = new TechnicalUser(user);
      var deferred = q.defer();
      console.log('Creating technical user', technicalUser);
      technicalUser.save(deferred.makeNodeResolver());
      return deferred.promise;
    });

    return q.all(promises);
  }

  return createSabreUser();
};
