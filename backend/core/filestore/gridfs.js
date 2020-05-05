'use strict';

const mongoose = require('mongoose');
const conn = mongoose.connection;
const { ObjectId } = mongoose.Types;
const chunk_size = 1024;
const extend = require('extend');
const { PassThrough } = require('stream');
const CONSTANTS = require('./constants');

function getMongoID(id) {
  if (!id || !(id + '').length) {
    return null;
  }
  if (id.toHexString) {
    return id;
  }
  var outid;

  try {
    outid = new ObjectId(id);
  } catch (e) {
    return null;
  }

  return outid;
}

function getGrid() {
  return new mongoose.mongo.GridFSBucket(conn.db);
}

module.exports.find = function find(query, callback) {
  conn.db
    .collection(CONSTANTS.COLLECTIONS.FS_FILES)
    .find(query)
    .toArray((err, meta) => {
      if (err) {
        return callback(err);
      }

      return callback(
        null,
        meta.map(m => ObjectId(m._id))
      );
    });
};

module.exports.store = function(id, contentType, metadata, stream, options, callback) {
  var mongoId = getMongoID(id);

  if (!mongoId) {
    return callback(new Error('ID is mandatory'));
  }

  if (!stream) {
    return callback(new Error('Stream is mandatory'));
  }

  if (!metadata) {
    return callback(new Error('Metadata is required'));
  }

  if (!metadata.creator) {
    return callback(new Error('Creator metadata is required'));
  }

  callback = callback || function(err, result) {
    console.log(err);
    console.log(result);
  };

  var strMongoId = mongoId.toHexString(); // http://stackoverflow.com/a/27176168
  var opts = {
    contentType: contentType,
    metadata: metadata
  };

  options = options || {};

  if (options.filename) {
    opts.filename = options.filename;
  }

  if (options.chunk_size) {
    var size = parseInt(options.chunk_size, 10);

    if (!isNaN(size) && size > 0 && size < 255) {
      opts.chunkSizeBytes = chunk_size * size;
    }
  }

  var gfs = getGrid();
  var writeStream = gfs.openUploadStreamWithId(strMongoId, opts.filename, opts);

  writeStream.on('finish', function(file) {
    return callback(null, file);
  });

  writeStream.on('error', function(err) {
    return callback(err);
  });

  stream.pipe(new PassThrough()).pipe(writeStream);
};

function getMeta(id, callback) {
  var mongoId = getMongoID(id);

  if (!mongoId) {
    return callback(new Error('ID is mandatory'));
  }

  conn.db.collection(CONSTANTS.COLLECTIONS.FS_FILES).findOne({_id: mongoId.toHexString()}, callback);
}
module.exports.getMeta = getMeta;

function getAllMetaByUserId(userId, options, callback) {
  const mongoUserId = getMongoID(userId);

  if (!mongoUserId) {
    return callback(new Error('userID is mandatory'));
  }

  const limit = options.limit || CONSTANTS.DEFAULT_LIMIT;
  const offset = options.offset || CONSTANTS.DEFAULT_OFFSET;

  const query = conn.db
    .collection(CONSTANTS.COLLECTIONS.FS_FILES)
    .find({ 'metadata.creator.id': mongoUserId })
    .limit(limit)
    .skip(offset);

  if (options.sort) {
    query.sort({uploadDate: options.sort});
  }

  query.toArray(callback);
}
module.exports.getAllMetaByUserId = getAllMetaByUserId;

module.exports.addMeta = function(id, data, callback) {
  var mongoId = getMongoID(id);

  if (!mongoId) {
    return callback(new Error('ID is mandatory'));
  }

  if (!data) {
    return callback(new Error('Metadata value is mandatory'));
  }

  getMeta(mongoId, function(err, file) {
    if (err) {
      return callback(err);
    }
    if (file) {
      extend(true, file, data);

      return conn.db.collection(CONSTANTS.COLLECTIONS.FS_FILES).updateOne(
        {
          _id: mongoId.toHexString()
        },
        {
          $set: file
        },
        callback
      );
    }

    return callback();
  });
};

function get(id, callback) {
  var mongoId = getMongoID(id);

  if (!mongoId) {
    return callback(new Error('ID is mandatory'));
  }

  getMeta(id, function(err, meta) {
    if (err) {
      return callback(err);
    }

    if (!meta) {
      return callback();
    }

    var gfs = getGrid();
    var readstream = gfs.openDownloadStream(mongoId.toHexString());

    return callback(err, meta, readstream);
  });
}
module.exports.get = get;

module.exports.getFileStream = function(id, callback) {
  get(id, function(err, meta, readstream) {
    if (!err && !meta) {
      return callback(new Error('File does not exists'));
    }

    return callback(err, readstream);
  });
};

module.exports.delete = function(id, callback) {
  var mongoId = getMongoID(id);

  if (!mongoId) {
    return callback(new Error('ID is mandatory'));
  }
  var gfs = getGrid();

  return gfs.delete(mongoId.toHexString(), function(err) {
    if (!err) {
      return callback(null);
    }

    if (err.message.includes('FileNotFound')) {
      return callback(null);
    }

    return callback(err);
  });
};
