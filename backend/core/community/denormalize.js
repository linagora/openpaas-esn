'use strict';

var Community = require('mongoose').model('Community');

function getId(community) {
  return community._id;
}
module.exports.getId = getId;

function denormalize(community) {
  function transform(doc, ret) {
    ret.id = getId(ret);
  }
  var options = {virtuals: true, transform: transform};

  return community instanceof Community ? community.toObject(options) : new Community(community).toObject(options);
}
module.exports.denormalize = denormalize;
