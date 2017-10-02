'use strict';

const mongoose = require('mongoose');
const User = mongoose.model('User');
const publicKeys = [
  '_id',
  'firstname',
  'lastname',
  'preferredEmail',
  'emails',
  'domains',
  'avatars',
  'job_title',
  'service',
  'building_location',
  'office_location',
  'main_phone',
  'description'
];
const privateKeys = ['accounts', 'login'];

module.exports = {
  getId,
  denormalize,
  denormalizeForSearchIndexing
};

function getId(user) {
  return user._id;
}

function denormalize(user, includePrivateData = false) {
  const denormalizedUser = {};
  const keys = publicKeys.slice();

  user = user instanceof User ? user : new User(user).toObject({ virtuals: true }); // So that we have mongoose virtuals

  if (includePrivateData) {
    keys.push(...privateKeys);
  }

  keys.forEach(function(key) {
    if (user[key]) {
      denormalizedUser[key] = user[key];
    }
  });

  denormalizedUser.id = getId(user);

  return denormalizedUser;
}

function denormalizeForSearchIndexing(user) {
  const denormalizedUser = denormalize(user, true);

  // _id is a metadata field and cannot be added inside a document
  delete denormalizedUser._id;

  return denormalizedUser;
}
