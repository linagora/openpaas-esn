// credits: https://github.com/juttle/winston-logrotate/blob/master/lib/winston-logrotate.js
// Apache License

'use strict';

var fse = require('fs-extra');
var path = require('path');
var LogStream = require('logrotate-stream');
var q = require('q');
var winston = require('winston');
var common = require('winston/lib/winston/common');

var util = require('util');

var Transport = winston.Transport;

var DEFAULT_SIZE = '100m';
var DEFAULT_KEEP = 5;

var DEFAULT_COMPRESS = true;

var Rotate = exports.Rotate = function(options) {
  Transport.call(this, options);
  options = options || {};

  this.file = options.file;
  if (!this.file) {
    throw new Error('required file argument not specified');
  }
  this.json = options.json || false;
  this.colorize = options.colorize || false;
  this.prettyPrint = options.prettyPrint || false;
  this.timestamp = typeof (options.timestamp) === 'undefined' ? false : options.timestamp;
  this.label = options.label || null;

  this.size = options.size || DEFAULT_SIZE;
  this.keep = options.keep || DEFAULT_KEEP;
  this.compress = typeof (options.compress) === 'undefined' ? DEFAULT_COMPRESS : options.compress;

  this.ready = false;
};

//
// Define a getter so that `winston.transports.Rotate`
// is available and thus backwards compatible.
//
winston.transports.Rotate = Rotate;

//
// Inherit from `winston.Transport`.
//
util.inherits(Rotate, Transport);

//
// Expose the name of this Transport on the prototype
//
Rotate.prototype.name = 'rotate';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Rotate.prototype.log = function(level, msg, meta, callback) {
  var self = this;

  var output = common.log({
    colorize: this.colorize,
    json: this.json,
    level: level,
    message: msg,
    meta: meta,
    stringify: this.stringify,
    timestamp: this.timestamp,
    prettyPrint: this.prettyPrint
  });

  if (this.ready) {
    this._write(level, output, callback);
  } else {
    this._init().done(function() {
      self._write(level, output, callback);
    }, function(err) {
      throw err;
    });
  }
};

Rotate.prototype.close = function() {
  if (this.log_stream) {
    this.log_stream.end();
  }

  this.emit('closed');
};

Rotate.prototype._write = function(level, output, callback) {
  var self = this;

  this.log_stream.write(output + '\n', function() {
    self.emit('logged');
    callback(null, true);
  });
};

Rotate.prototype._init = function() {
  var self = this;

  // create base log dir if it does not exist
  var logs_dir = path.dirname(this.file);

  return q.nfcall(fse.mkdirp, logs_dir).then(function() {
    return q.Promise(function(resolve, reject) {
      return self._configure_log_stream(resolve, reject);
    });
  });
};

Rotate.prototype._configure_log_stream = function(resolve, reject) {
  var self = this;
  var log_stream = new LogStream({
    file: this.file,
    size: this.size,
    keep: this.keep,
    compress: this.compress
  });

  log_stream.on('ready', function() {
    self.ready = true;
    self.emit('ready', log_stream);
    resolve();
  });

  log_stream.on('error', reject);
  log_stream.on('rotated', function(rotated_file) {
    self.emit('rotated', rotated_file);
  });

  this.log_stream = log_stream;
};
