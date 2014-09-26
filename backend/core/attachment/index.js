'use strict';

var uuid = require('node-uuid');
var filestore = require('../filestore');

function storeAttachment(metaData, stream, callback) {
  if (!message) {
    return callback(new Error('Message is missing.'));
  }
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

  var updateMessage = function(err, file) {
    var fileStoreMeta = filestore.getAsFileStoreMeta(file);
    if (err) {
      return callback(err);
    }

    var attachmentModel = {
      name: metaData.name,
      contentType: metaData.contentType,
      length: fileStoreMeta.length,
      file: fileId
    };

    callback(null, attachmentModel);
  };

  filestore.store(fileId, metaData.contentType, {}, stream, updateMessage);
}
module.exports.storeAttachment = storeAttachment;

function getAttachmentFile(attachment, callback) {
  if (!attachment) {
    return callback(new Error('Attachment parameter is missing.'));
  }

  filestore.get(attachment.file, function(err, fileMeta, readStream) {
    if (err) {
      return callback(err);
    }
    return callback(null, fileMeta, readStream);
  });
}
module.exports.getAttachmentFile = getAttachmentFile;


