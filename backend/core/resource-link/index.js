'use strict';

var mongoose = require('mongoose');
var q = require('q');
var ResourceLink = mongoose.model('ResourceLink');
var logger = require('../logger');
var pubsub = require('../pubsub');

function create(link) {
  logger.debug('Creating link of type %s', link.type, link);
  var linkModel = link instanceof ResourceLink ? link : new ResourceLink(link);
  var defer = q.defer();

  linkModel.save(function(err, linked) {
    if (err) {
      return defer.reject(err);
    }

    pubsub.local.topic('resource:link:' + link.type + ':' + link.target.objectType).publish(linked);
    defer.resolve(linked);
  });
  return defer.promise;
}
module.exports.create = create;

function count(options) {
  var defer = q.defer();
  var query = {};
  if (options.type) {
    query.type = options.type;
  }
  if (options.source) {
    query['source.id'] = options.source.id;
    query['source.objectType'] = options.source.objectType;
  }
  if (options.target) {
    query['target.id'] = options.target.id;
    query['target.objectType'] = options.target.objectType;
  }

  ResourceLink.find(query).count().exec(function(err, result) {
    if (err) {
      return defer.reject(err);
    }
    defer.resolve(result);
  });
  return defer.promise;
}
module.exports.count = count;

function exists(link) {
  var defer = q.defer();
  var query = {
    type: link.type,
    'source.objectType': link.source.objectType,
    'source.id': link.source.id,
    'target.objectType': link.target.objectType,
    'target.id': link.target.id
  };

  ResourceLink.findOne(query).exec(function(err, result) {
    if (err) {
      return defer.reject(err);
    }
    defer.resolve(!!result);
  });
  return defer.promise;
}
module.exports.exists = exists;
