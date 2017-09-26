'use strict';

const q = require('q');
const mongoose = require('mongoose');
const resolvers = {
  user: createModelResolver('User')
};

module.exports = {
  getResolver,
  registerResolver,
  resolve
};

/**
 * Get a resolver
 * @param  {String} objectType a member objectType
 * @return {Function}          a promise-based fn receive a member `tuple` and resolve the member object
 */
function getResolver(objectType) {
  return resolvers[objectType];
}

/**
 * Register a resolver
 * @param  {String} objectType          a member objectType
 * @param  {String|Function} resolver   a model name or a promise-based fn receiving
 *                                      a member `tuple` and resolve the member object
 */
function registerResolver(objectType, resolver) {
  if (getResolver(objectType)) {
    throw new Error(`Member resolver for ${objectType} is already registered`);
  }

  if (typeof resolver === 'string') {
    resolvers[objectType] = createModelResolver(resolver);
  } else if (typeof resolver === 'function') {
    resolvers[objectType] = resolver;
  } else {
    throw Error('resolver must be string or function');
  }
}

/**
 * Resolve a tuple to member objectType
 * @param  {Object} tuple the tuple { objectType, id }
 * @return {Promise}      resolve the member object (can be null) or reject if
 *                        no resolver found
 */
function resolve(tuple) {
  const resolver = getResolver(tuple.objectType);

  if (resolver) {
    return resolver(tuple);
  }

  return q.reject(`No resolver for objectType ${tuple.objectType}`);
}

/**
 * Create resolver for model tuples (User, Community, etc)
 * @param  {String} modelName   the model name
 * @return {Function}           the resolver to find document by tuple.id
 */
function createModelResolver(modelName) {
  return tuple => mongoose.model(modelName).findOne({ _id: tuple.id });
}
