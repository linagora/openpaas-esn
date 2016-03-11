'use strict';

module.exports = function() {
  var host = process.env.JMAP_SERVER_HOST || 'localhost';
  var port = process.env.JMAP_SERVER_PORT || 80;
  var path = process.env.JMAP_SERVER_PATH || 'jmap';
  var isJmapSendingEnabled = process.env.JMAP_SENDING_ENABLED || false;
  var maxSizeUpload = process.env.JMAP_MAX_SIZE_UPLOAD || 20971520;
  var api = 'http://' + host + ':' + port + '/' + path;
  var uploadUrl = process.env.JMAP_UPLOAD_URL || api + '/upload';
  var view = process.env.JMAP_VIEW || 'messages';

  return {
    api: api,
    uploadUrl: uploadUrl,
    isJmapSendingEnabled: isJmapSendingEnabled,
    maxSizeUpload: maxSizeUpload,
    view: view
  };
};
