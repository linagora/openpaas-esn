'use strict';

var uuid = require('node-uuid');
var filestore = require('../filestore');
var Attachment = require('mongoose').model('Attachment');

function storeAttachment(name, contentType, length, stream, callback) {
  if (!name) {
    return callback(new Error('Attachment name is required.'));
  }
  if (!contentType) {
    return callback(new Error('Attachment contentType is required.'));
  }
  if (!length || isNaN(length)) {
    return callback(new Error('Attachment length is required.'));
  }
  if (!stream) {
    return callback(new Error('Attachment stream is required.'));
  }

  var fileId = uuid.v1();

  var createAttachmentModel = function(err) {
    if (err) {
      return callback(err);
    }
    var attachmentModel = {
      name: name,
      contentType: contentType,
      length: length,
      file: fileId
    };

    Attachment.save(attachmentModel, function(err, savedAttachment) {
      if (err) {
        return callback(err);
      }
      return callback(null, savedAttachment);
    });
  };

  filestore.store(fileId, contentType, {}, stream, createAttachmentModel);
}
module.exports.storeAttachment = storeAttachment;

function getAttachmentFile(attachment, callback) {
  if (!attachment) {
    return callback(new Error('Attachment is missing'));
  }
  var attachmentId = attachment._id || attachment;

  Attachment.findById(attachmentId, function(err, foundAttachment) {
    if (err) {
      return callback(err);
    }
    filestore.get(foundAttachment.file, function(err, fileMeta, readStream) {
      if (err) {
        return callback(err);
      }
      return callback(null, fileMeta, readStream);
    });
  });
}
module.exports.getAttachmentFile = getAttachmentFile;


