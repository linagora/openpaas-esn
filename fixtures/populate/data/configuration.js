'use strict';

var q = require('q');
var mongoose = require('mongoose');
require('../../../backend/core/db/mongo/models/configuration');
var Configuration = mongoose.model('Configuration');

module.exports = function(domains, host) {
  var jmapHost = process.env.JMAP_SERVER_HOST || host || 'localhost';
  var port = process.env.JMAP_SERVER_PORT || 1080;
  var path = process.env.JMAP_SERVER_PATH || 'jmap';
  var isJmapSendingEnabled = process.env.JMAP_SENDING_ENABLED !== 'false';
  var isSaveDraftBeforeSendingEnabled = process.env.SAVE_DRAFT_BEFORE_SENDING_ENABLED === 'true';
  var isAttachmentsEnabled = process.env.ATTACHMENTS_ENABLED !== 'false';
  var drafts = process.env.DRAFTS !== 'false';
  var maxSizeUpload = parseInt(process.env.JMAP_MAX_SIZE_UPLOAD, 10) || 20971520;
  var numberItemsPerPageOnBulkReadOperations = 30;
  var numberItemsPerPageOnBulkDeleteOperations = 30;
  var jmapHostPort = 'http://' + jmapHost + ':' + port;
  var api = jmapHostPort + '/' + path;
  var uploadUrl = process.env.JMAP_UPLOAD_URL || jmapHostPort + '/upload';
  var downloadUrl = process.env.JMAP_DOWNLOAD_URL || jmapHostPort + '/download/{blobId}/{name}';
  var view = process.env.JMAP_VIEW || 'messages';
  var swipeRightAction = process.env.JMAP_SWIPE_RIGHT_ACTION || 'markAsRead';

  function createInboxFeature() {
    var promises = domains.map(function(domain) {
      var configuration = new Configuration({
        domain_id: domain._id || domain,
        modules: [{
          name: 'core',
          configurations: [
            {
              name: 'features',
              value: {
                'control-center:appstore': false,
                'application-menu:communities': false,
                'control-center:members': false,
                'control-center:invitation': false,
                'control-center:jobqueue': false
              }
            }
          ]
        }, {
          name: 'linagora.esn.unifiedinbox',
          configurations: [
            {
              name: 'api',
              value: api
            },
            {
              name: 'uploadUrl',
              value: uploadUrl
            },
            {
              name: 'downloadUrl',
              value: downloadUrl
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
              name: 'composer.attachments',
              value: isAttachmentsEnabled
            },
            {
              name: 'maxSizeUpload',
              value: maxSizeUpload
            },
            {
              name: 'numberItemsPerPageOnBulkReadOperations',
              value: numberItemsPerPageOnBulkReadOperations
            },
            {
              name: 'numberItemsPerPageOnBulkDeleteOperations',
              value: numberItemsPerPageOnBulkDeleteOperations
            },
            {
              name: 'drafts',
              value: drafts
            },
            {
              name: 'view',
              value: view
            },
            {
              name: 'swipeRightAction',
              value: swipeRightAction
            }
          ]
        }]
      });
      var deferred = q.defer();
      console.log('Creating feature flipping for inbox module', configuration);
      configuration.save(deferred.makeNodeResolver());
      return deferred.promise;
    });

    return q.all(promises);
  }

  return createInboxFeature();
};
