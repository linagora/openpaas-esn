'use strict';

var q = require('q');
var mongoose = require('mongoose');
require('../../../backend/core/db/mongo/models/features');
var Features = mongoose.model('Features');

module.exports = function(domains) {

  function createInboxFeature() {
    var promises = domains.map(function(domain) {
      var features = new Features({
        domain_id: domain._id || domain,
        modules:[{
          name: 'core',
          features: [
            {
              name: 'application-menu.profile',
              value: true
            }
          ]
        }, {
          name: 'linagora.esn.unifiedinbox',
          features: [
            {
              name: 'api',
              value: 'http://host:port/jmap/account_id'
            },
            {
              name: 'uploadUrl',
              value: 'http://host:port/upload/account_id'
            },
            {
              name: 'isJmapSendingEnabled',
              value: false
            },
            {
              name: 'isSaveDraftBeforeSendingEnabled',
              value: false
            },
            {
              name: 'maxSizeUpload',
              value: 20971520
            }, {
              name: 'view',
              value: 'messages'
            }
          ]
        }]
      });
      var deferred = q.defer();
      console.log('Creating feature flipping for inbox module', features);
      features.save(deferred.makeNodeResolver());
      return deferred.promise;
    });

    return q.all(promises);
  }

  return createInboxFeature();
};
