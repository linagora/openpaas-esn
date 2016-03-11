'use strict';

var q = require('q');
var mongoose = require('mongoose');
require('../../../backend/core/db/mongo/models/features');
var Features = mongoose.model('Features');

module.exports = function(domains) {
  var host = process.env.JMAP_SERVER_HOST || 'localhost';
  var port = process.env.JMAP_SERVER_PORT || 80;
  var path = process.env.JMAP_SERVER_PATH || 'jmap';
  var isJmapSendingEnabled = process.env.JMAP_SENDING_ENABLED || true;
  var isSaveDraftBeforeSendingEnabled = process.env.SAVE_DRAFT_BEFORE_SENDING_ENABLED || false;
  var maxSizeUpload = process.env.JMAP_MAX_SIZE_UPLOAD || 20971520;
  var api = 'http://' + host + ':' + port + '/' + path;
  var uploadUrl = process.env.JMAP_UPLOAD_URL || api + '/upload';
  var view = process.env.JMAP_VIEW || 'messages';

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
              value: api
            },
            {
              name: 'uploadUrl',
              value: uploadUrl
            },
            {
              name: 'isJmapSendingEnabled',
              value: isJmapSendingEnabled
            },
            {
              name: 'isSaveDraftBeforeSendingEnabled',
              value: isSaveDraftBeforeSendingEnabled
            },
            {
              name: 'maxSizeUpload',
              value: maxSizeUpload
            }, {
              name: 'view',
              value: view
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
