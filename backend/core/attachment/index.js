'use strict';

var uuid = require('node-uuid');
var filestore = require('../filestore');

function storeAttachment(message, metaData, stream, callback) {
  if (!message) {
    return callback(new Error('Message is missing.'));
  }
  if (!metaData.name) {
    return callback(new Error('Attachment name is required.'));
  }
  if (!metaData.contentType) {
    return callback(new Error('Attachment contentType is required.'));
  }
  //TODO
 /* if (!metaData.length || isNaN(metaData.length)) {
    return callback(new Error('Attachment length is required.'));
  }*/
  if (!stream) {
    return callback(new Error('Attachment stream is required.'));
  }

  var fileId = uuid.v1();

  var updateMessage = function(err) {
    if (err) {
      return callback(err);
    }

    var attachmentModel = {
      name: metaData.name,
      contentType: metaData.contentType,
      length: metaData.length,
      file: fileId
    };

    message.attachments.push(attachmentModel);

    callback(null, message);
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


