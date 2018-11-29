'use strict';

const coreUser = require('../../user');
const q = require('q');

const denormalizers = {
  user: userDenormalizer,
  email: emailDenormalizer
};

module.exports = {
  denormalize,
  registerDenormalizer
};

/**
 * Denormalize member object to be responded from REST APIs. Note that the member
 * object parameter must be object returned from member resolver,
 * e.g. the user object, the community object, etc
 * @param  {String} objectType - The objectType of member
 * @param  {Object} member     - The member object to be denormalized
 * @return {Object}            - The denormalized member
 */
function denormalize(objectType, member) {
  const denormalizer = getDenormalizer(objectType);

  if (denormalizer) {
    return denormalizer(member, objectType).then(user => user);
  }

  return null;
}

/**
 * Register a member denormalizer
 * @param  {String} objectType   - Teh objectType of member
 * @param  {Function} denormalizer - The denormalizer function that returns denormalized object
 */
function registerDenormalizer(objectType, denormalizer) {
  if (getDenormalizer(objectType)) {
    throw new Error(`Member denormalizer for ${objectType} is already registered`);
  }

  if (typeof denormalizer !== 'function') {
    throw Error('resolver must be a function');
  }

  denormalizers[objectType] = denormalizer;
}

function getDenormalizer(objectType) {
  return denormalizers[objectType];
}

function userDenormalizer(user, objectType) {
  user.objectType = objectType;
  return q.when(coreUser.denormalize.denormalize(user));
}

function emailDenormalizer(ObjectId) {
  const id = ObjectId.toString();

  return q.nfcall(coreUser.get, id).then(user => {
    if (user) {
      user.objectType = 'user';
      return coreUser.denormalize.denormalize(user);
    }
  });
}
