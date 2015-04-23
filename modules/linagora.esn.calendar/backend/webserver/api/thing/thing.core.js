'use strict';

var q = require('q');
var Thing = require('./thing.model');

/**
 * Return a promise. It resolves a thing by its mongo id.
 * @param id - This is the mongo id of the thing to return.
 */
function getOne(dependencies, id) {
  var defer = q.defer();
  Thing.findById(id, defer.makeNodeResolver());
  return defer.promise;
}

/**
 * Create a new thing inside mongo.
 * @param thing - This is the thing to create in mongo.
 */
function create(dependencies, thing) {
  var defer = q.defer();
  Thing.create(thing, defer.makeNodeResolver());
  return defer.promise;
}

/**
 * Remove a thing by its id inside mongo.
 * @param thing - This is the mongoose object to remove
 */
function remove(dependencies, thing) {
  var defer = q.defer();
  thing.remove(function(err) {
    if (err) {
      defer.reject(err);
    }

    defer.resolve(thing);
  });
  return defer.promise;
}

module.exports = function(dependencies) {
  return {
    getOne: getOne.bind(null, dependencies),
    create: create.bind(null, dependencies),
    remove: remove.bind(null, dependencies)
  };
};
