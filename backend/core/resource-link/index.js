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

function remove(options) {
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

  ResourceLink.findOneAndRemove(query).exec(function(err, result) {
    if (err) {
      return defer.reject(err);
    }
    if (result) {
      pubsub.local.topic('resource:link:' + result.type + ':' + result.target.objectType + ':remove').publish(result);
    }
    defer.resolve(result);
  });
  return defer.promise;
}
module.exports.remove = remove;

function count(options) {
  var defer = q.defer();
  var query = {};

  if (options.type) {
    query.type = options.type;
  }

  if (options.source && options.source.id) {
    query['source.id'] = options.source.id;
  }

  if (options.source && options.source.objectType) {
    query['source.objectType'] = options.source.objectType;
  }

  if (options.target && options.target.id) {
    query['target.id'] = options.target.id;
  }

  if (options.target && options.target.objectType) {
    query['target.objectType'] = options.target.objectType;
  }

  ResourceLink.find(query).countDocuments().exec(function(err, result) {
    if (err) {
      return defer.reject(err);
    }
    defer.resolve(result);
  });
  return defer.promise;
}
module.exports.count = count;

function list(options) {
  var defer = q.defer();
  var query = {};

  if (options.type) {
    query.type = options.type;
  }

  if (options.source && options.source.id) {
    query['source.id'] = options.source.id;
  }

  if (options.source && options.source.objectType) {
    query['source.objectType'] = options.source.objectType;
  }

  if (options.target && options.target.id) {
    query['target.id'] = options.target.id;
  }

  if (options.target && options.target.objectType) {
    query['target.objectType'] = options.target.objectType;
  }

  var resourceLinkQuery = ResourceLink.find(query);
  if (options.offset > 0) {
    resourceLinkQuery = resourceLinkQuery.skip(+options.offset);
  }

  if (options.limit > 0) {
    resourceLinkQuery = resourceLinkQuery.limit(+options.limit);
  }

  resourceLinkQuery.sort('-timestamps.creation').exec(defer.makeNodeResolver());
  return defer.promise;
}
module.exports.list = list;

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
