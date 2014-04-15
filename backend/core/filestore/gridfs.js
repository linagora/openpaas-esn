'use strict';


var Grid = require('gridfs-stream');
var mongoose = require('mongoose');
var chunk_size = 1024;

module.exports.getAsFileStoreMeta = function(gridfsMeta) {
  var result = {};

  if (!gridfsMeta) {
    return result;
  }
  result.id = gridfsMeta.filename;
  result._id = gridfsMeta._id;
  result.contentType = gridfsMeta.contentType;
  result.length = gridfsMeta.length;
  result.md5 = gridfsMeta.md5;
  result.uploadDate = gridfsMeta.uploadDate;
  result.metadata = gridfsMeta.metadata;
  return result;
};

module.exports.store = function(id, contentType, metadata, stream, callback) {
  if (!id) {
    return callback(new Error('ID is mandatory'));
  }

  if (!stream) {
    return callback(new Error('Stream is mandatory'));
  }

  callback = callback || function(err, result) {
    console.log(err);
    console.log(result);
  };

  metadata = metadata || {};

  var opts = {
    filename: id,
    mode: 'w',
    content_type: contentType
  };

  opts.chunk_size = chunk_size;
  opts.metadata = metadata;

  var gfs = new Grid(mongoose.connection.db, mongoose.mongo);
  var writeStream = gfs.createWriteStream(opts);

  writeStream.on('close', function(file) {
    return callback(null, file);
  });

  writeStream.on('error', function(err) {
    return callback(err);
  });

  stream.pipe(writeStream);
};

module.exports.getMeta = function(id, callback) {
  if (!id) {
    return callback(new Error('ID is mandatory'));
  }

  var gfs = new Grid(mongoose.connection.db, mongoose.mongo);
  var self = this;
  gfs.files.findOne({filename: id}, function(err, meta) {
    if (err) {
      return callback(err);
    }
    if (meta) {
      return callback(null, self.getAsFileStoreMeta(meta));
    }
    return callback();
  });
};

module.exports.get = function(id, callback) {
  if (!id) {
    return callback(new Error('ID is mandatory'));
  }

  var self = this;
  this.getMeta(id, function(err, meta) {
    if (err) {
      return callback(err);
    }

    if (!meta) {
      return callback();
    }

    var gfs = new Grid(mongoose.connection.db, mongoose.mongo);
    var readstream = gfs.createReadStream({
      filename: id
    });
    return callback(err, self.getAsFileStoreMeta(meta), readstream);
  });
};

module.exports.delete = function(id, callback) {
  if (!id) {
    return callback(new Error('ID is mandatory'));
  }
  var gfs = new Grid(mongoose.connection.db, mongoose.mongo);
  gfs.remove({filename: id}, callback);
};
