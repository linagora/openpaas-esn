'use strict';

var Community = require('mongoose').model('Community');

function communityToJSON(community) {
  return community instanceof Community ? community.toObject({ virtuals: true }) : new Community(community).toObject({ virtuals: true });
}

function denormalize(community) {
  var document = communityToJSON(community);
  document.id = document._id;
  return document;
}
module.exports = denormalize;
