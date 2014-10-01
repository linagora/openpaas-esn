'use strict';

var uuid = require('node-uuid');
var filestore = require('../filestore');

function storeAttachment(metaData, stream, options, callback) {
  if (!metaData.name) {
    return callback(new Error('Attachment name is required.'));
  }
  if (!metaData.contentType) {
    return callback(new Error('Attachment contentType is required.'));
  }
  if (!stream) {
    return callback(new Error('Attachment stream is required.'));
  }

  var fileId = uuid.v1();

  var returnAttachmentModel = function(err, file) {
    if (err) {
      return callback(err);
    }

    var fileStoreMeta = filestore.getAsFileStoreMeta(file);

    var attachmentModel = {
      _id: fileId,
      name: metaData.name,
      contentType: metaData.contentType,
      length: fileStoreMeta.length
    };

    callback(null, attachmentModel);
  };

  filestore.store(fileId, metaData.contentType, {name: metaData.name, creator: metaData.creator}, stream, options, returnAttachmentModel);
}
module.exports.storeAttachment = storeAttachment;

function getAttachmentFile(attachment, callback) {
  if (!attachment) {
    return callback(new Error('Attachment parameter is missing.'));
  }

  filestore.get(attachment._id, callback);
}
module.exports.getAttachmentFile = getAttachmentFile;


