'use strict';

var mongoose = require('mongoose');
var q = require('q');
var ResourceLink = mongoose.model('ResourceLink');
var logger = require('../logger');

function create(link) {
  logger.debug('Creating link of type %s', link.type, link);
  var linkModel = link instanceof ResourceLink ? link : new ResourceLink(link);
  var defer = q.defer();

  linkModel.save(function(err, linked) {
    if (err) {
      return defer.reject(err);
    }
    defer.resolve(linked);
  });
  return defer.promise;
}

module.exports.create = create;
