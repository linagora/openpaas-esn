'use strict';

// error code:
// 1 : datastore error
// 2 : image manipulation error


var defaultAvatarSize = 128;
var logger = require('..').logger;
var PassThrough = require('stream').PassThrough;
var gm = require('gm').subClass({ imageMagick: true });
var filestore = require('../filestore');
var async = require('async');
var extend = require('extend');
var ObjectId = require('mongoose').Types.ObjectId;

function getDuplicates(readable) {
  var p1 = new PassThrough();
  var p2 = new PassThrough();
  readable.pipe(p1);
  readable.pipe(p2);
  return [p1, p2];
}

function getSize(readable, callback) {
  gm(readable)
  .size({bufferStream: true}, function(err, size) {
    if (err) {
      logger.error('Failed to get image size');
      logger.debug(err);
      err.code = 2;
      return callback(err);
    }
    return callback(null, size, this);
  });
}

function checkImageSquare(readable, callback) {
  getSize(readable, function(err, size, gmInstance) {

    if (err) {
      return callback(err);
    }
    var sizeWidthMin = size.height - 2;
    var sizeWidthMax = size.height + 2;
    if (size.width < sizeWidthMin || size.width > sizeWidthMax) {
      logger.debug('image is not a square');
      var error = new Error('Image is not a square');
      error.code = 2;
      return callback(error);
    }
    return callback(null, size, gmInstance);
  });
}


function recordAvatar(id, contentType, opts, readable, callback) {
  var streams = getDuplicates(readable);
  var fullSizeMetadata = extend(true, {}, opts);
  var resizedMetadata = extend(true, {}, opts);
  fullSizeMetadata.avatar = {
    fullsize: true
  };
  resizedMetadata.avatar = {
    originalId: id,
    fullsize: false,
    size: defaultAvatarSize
  };
  var responses = {
    datastore: {},
    gm: {}
  };
  async.parallel(
    [
      function(callback) {
        filestore.store(id, contentType, fullSizeMetadata, streams[0], {}, function(err, file) {
          if (err) {
            logger.debug('failed to record original image');
            logger.debug(err);
            responses.datastore = {error: err, size: file.length};
            responses.datastore.error.code = 1;
          } else {
            responses.datastore.size = file.length;
          }
          callback();
        });
      },
      function(callback) {
        checkImageSquare(streams[1], function(err, size, gmInstance) {
          if (err) {
            responses.gm.error = err;
          } else {
            responses.gm.size = size;
            responses.gm.image = gmInstance;
          }
          callback();
        });
      }
    ],
    function(err, resps) {
      if (responses.datastore.error) {
        return callback(responses.datastore.error);
      }
      if (responses.gm.error) {
        filestore.delete(id, function() {});
        return callback(responses.gm.error);
      }

      responses.gm.image.resize(defaultAvatarSize, defaultAvatarSize);
      responses.gm.image.stream(function(err, stdout, stderr) {
        if (err) {
          logger.debug('failed to stream gm image after resize');
          logger.debug(err.stack);
          filestore.delete(id, function() {});
          err.code = 2;
          return callback(err);
        }
        filestore.store(new ObjectId(), contentType, resizedMetadata, stdout, {}, function(err) {
          if (err) {
            logger.debug('failed to record resized image');
            logger.debug(err.stack);
            filestore.delete(id, function() {});
            err.code = 1;
            return callback(err);
          }
          return callback(null, responses.datastore.size);
        });
      });
    }
  );

}

function setDefaultAvatarSize(size) {
  var s = parseInt(size);
  if (isNaN(s)) {
    return false;
  }
  defaultAvatarSize = s;
  return true;
}

function getSmallAvatar(id, callback) {
  filestore.find({
    'metadata.avatar.originalId': id,
    'metadata.avatar.fullsize': false,
    'metadata.avatar.size': defaultAvatarSize
  }, function(err, ids) {
    if (err || !ids || !ids.length) {
      return callback(err);
    }
    return filestore.get(ids.pop(), function(err, meta, stream) {
      return callback(err, meta, stream);
    });
  });
}

function getAvatar(id, format, callback) {
  if (format && format === 'original') {
    return filestore.get(id, callback);
  }

  return getSmallAvatar(id, function(err, meta, stream) {
    if (err || !stream) {
      return filestore.get(id, callback);
    }

    return callback(err, meta, stream);
  });
}

module.exports.getSize = getSize;
module.exports.getAvatar = getAvatar;
module.exports.getSmallAvatar = getSmallAvatar;
module.exports.checkImageSquare = checkImageSquare;
module.exports.recordAvatar = recordAvatar;
module.exports.setDefaultAvatarSize = setDefaultAvatarSize;
